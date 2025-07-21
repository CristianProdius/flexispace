import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { BookingStatus } from "@prisma/client";

interface IParams {
  bookingId: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = params;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Get the booking with space and user details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        space: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if current user owns the space
    if (booking.space.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "You are not authorized to approve this booking" },
        { status: 403 }
      );
    }

    // Check if booking is pending
    if (booking.status !== BookingStatus.PENDING) {
      return NextResponse.json(
        { error: "Booking is not pending approval" },
        { status: 400 }
      );
    }

    // Update booking status to APPROVED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.APPROVED,
      },
      include: {
        space: true,
        user: true,
      },
    });

    // Create invoice for approved booking
    const invoiceNumber = `INV-${Date.now()}-${bookingId
      .slice(0, 8)
      .toUpperCase()}`;

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId,
        billingName: booking.companyName || booking.user.name || "Customer",
        billingEmail: booking.user.email || "",
        subtotal: booking.totalPrice * 0.9, // Example: 10% tax
        taxes: booking.totalPrice * 0.1,
        total: booking.totalPrice,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "SENT",
      },
    });

    // TODO: Send approval email notification
    // await sendEmail({
    //   to: booking.user.email,
    //   subject: `Booking Approved - ${booking.space.title}`,
    //   template: 'booking-approved',
    //   data: {
    //     userName: booking.user.name,
    //     spaceName: booking.space.title,
    //     startDate: booking.startDateTime,
    //     endDate: booking.endDateTime,
    //     totalPrice: booking.totalPrice,
    //     invoiceNumber,
    //   }
    // });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Booking approved successfully",
    });
  } catch (error) {
    console.error("Error approving booking:", error);
    return NextResponse.json(
      { error: "Failed to approve booking" },
      { status: 500 }
    );
  }
}
