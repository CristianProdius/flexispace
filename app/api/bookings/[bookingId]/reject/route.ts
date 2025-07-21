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
    const body = await request.json();
    const { reason } = body;

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
        { error: "You are not authorized to reject this booking" },
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

    // Update booking status to REJECTED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        // If you want to store the rejection reason, you'd need to add a field to your schema
        // rejectionReason: reason,
      },
      include: {
        space: true,
        user: true,
      },
    });

    // TODO: Send rejection email notification
    // await sendEmail({
    //   to: booking.user.email,
    //   subject: `Booking Request Declined - ${booking.space.title}`,
    //   template: 'booking-rejected',
    //   data: {
    //     userName: booking.user.name,
    //     spaceName: booking.space.title,
    //     startDate: booking.startDateTime,
    //     endDate: booking.endDateTime,
    //     reason: reason || "The space is not available for the requested time.",
    //   }
    // });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Booking rejected",
    });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return NextResponse.json(
      { error: "Failed to reject booking" },
      { status: 500 }
    );
  }
}
