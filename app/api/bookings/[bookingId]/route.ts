// app/api/bookings/[bookingId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface IParams {
  bookingId: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { bookingId } = params;

  if (!bookingId || typeof bookingId !== "string") {
    throw new Error("Invalid ID");
  }

  // Users can only delete their own bookings or bookings for their spaces
  const booking = await prisma.booking.deleteMany({
    where: {
      id: bookingId,
      OR: [{ userId: currentUser.id }, { space: { userId: currentUser.id } }],
    },
  });

  return NextResponse.json(booking);
}

export async function PATCH(request: Request, { params }: { params: IParams }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { bookingId } = params;
  const body = await request.json();

  if (!bookingId || typeof bookingId !== "string") {
    throw new Error("Invalid ID");
  }

  const { status, attendeeCount, eventType, companyName, specialRequests } =
    body;

  try {
    // First, check if user has permission to update this booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { space: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = existingBooking.userId === currentUser.id;
    const isSpaceProvider = existingBooking.space.userId === currentUser.id;

    if (!isOwner && !isSpaceProvider) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build update data based on permissions
    const updateData: any = {};

    // Space providers can update status
    if (isSpaceProvider && status) {
      // Validate status transitions
      const validTransitions: Record<BookingStatus, BookingStatus[]> = {
        PENDING: [BookingStatus.APPROVED, BookingStatus.REJECTED],
        APPROVED: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
        REJECTED: [],
        CANCELLED: [],
        COMPLETED: [],
      };

      if (!validTransitions[existingBooking.status].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status transition" },
          { status: 400 }
        );
      }

      updateData.status = status;

      // If approving, create invoice
      if (
        status === BookingStatus.APPROVED &&
        !existingBooking.space.requiresApproval
      ) {
        const invoiceNumber = `INV-${Date.now()}-${bookingId.slice(0, 8)}`;

        await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId,
            billingName:
              existingBooking.companyName || currentUser.name || "attendee",
            billingEmail: currentUser.email || "",
            subtotal: existingBooking.totalPrice * 0.9,
            taxes: existingBooking.totalPrice * 0.1,
            total: existingBooking.totalPrice,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "SENT",
          },
        });
      }
    }

    // Booking owner can update certain fields before the booking starts
    if (isOwner && new Date(existingBooking.startDateTime) > new Date()) {
      if (attendeeCount !== undefined) {
        // Validate attendee count
        if (
          attendeeCount < existingBooking.space.minCapacity ||
          attendeeCount > existingBooking.space.capacity
        ) {
          return NextResponse.json(
            {
              error: `Attendee count must be between ${existingBooking.space.minCapacity} and ${existingBooking.space.capacity}`,
            },
            { status: 400 }
          );
        }
        updateData.attendeeCount = attendeeCount;
      }

      if (eventType !== undefined) updateData.eventType = eventType;
      if (companyName !== undefined) updateData.companyName = companyName;
      if (specialRequests !== undefined)
        updateData.specialRequests = specialRequests;
    }

    // Both can cancel if booking hasn't started
    if (
      status === BookingStatus.CANCELLED &&
      new Date(existingBooking.startDateTime) > new Date()
    ) {
      updateData.status = BookingStatus.CANCELLED;
    }

    // Perform the update
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        space: {
          include: {
            user: true,
            pricing: true,
          },
        },
        user: true,
        invoice: true,
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
