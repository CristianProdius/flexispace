// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { PricingType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const body = await request.json();

  const {
    spaceId,
    startDateTime,
    endDateTime,
    attendeeCount,
    eventType,
    companyName,
    specialRequests,
    pricingType = PricingType.HOURLY,
    addons = [],
  } = body;

  // Validation
  if (!spaceId || !startDateTime || !endDateTime || !attendeeCount) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Convert to Date objects
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Calculate hours
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (totalHours <= 0) {
      return NextResponse.json(
        { error: "Invalid booking duration" },
        { status: 400 }
      );
    }

    // Get space details and pricing
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        pricing: {
          where: {
            pricingType: pricingType,
          },
        },
        businessHours: true,
      },
    });

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    // Check capacity
    if (attendeeCount > space.capacity || attendeeCount < space.minCapacity) {
      return NextResponse.json(
        {
          error: `Attendee count must be between ${space.minCapacity} and ${space.capacity}`,
        },
        { status: 400 }
      );
    }

    // Check minimum booking hours
    if (totalHours < space.minBookingHours) {
      return NextResponse.json(
        { error: `Minimum booking duration is ${space.minBookingHours} hours` },
        { status: 400 }
      );
    }

    // Check if booking overlaps with existing bookings
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        spaceId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startDateTime: { lte: end },
            endDateTime: { gte: start },
          },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: "Space is not available for the selected time" },
        { status: 400 }
      );
    }

    // Calculate pricing
    const pricing = space.pricing[0];
    if (!pricing) {
      return NextResponse.json(
        { error: "No pricing available for this space" },
        { status: 400 }
      );
    }

    let totalPrice = 0;
    const hourlyRate = pricing.price;

    switch (pricingType) {
      case PricingType.HOURLY:
        totalPrice = hourlyRate * totalHours;
        break;
      case PricingType.DAILY:
        const days = Math.ceil(totalHours / 8);
        totalPrice = hourlyRate * days;
        break;
      case PricingType.WEEKLY:
        const weeks = Math.ceil(totalHours / 40);
        totalPrice = hourlyRate * weeks;
        break;
      case PricingType.MONTHLY:
        const months = Math.ceil(totalHours / 160);
        totalPrice = hourlyRate * months;
        break;
      default:
        totalPrice = hourlyRate * totalHours;
    }

    // Add additional fees
    if (pricing.cleaningFee) {
      totalPrice += pricing.cleaningFee;
    }
    if (pricing.serviceFee) {
      totalPrice += pricing.serviceFee;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: currentUser.id,
        spaceId,
        startDateTime: start,
        endDateTime: end,
        totalHours,
        attendeeCount,
        eventType,
        companyName: companyName || currentUser.companyName,
        specialRequests,
        hourlyRate,
        totalPrice,
        pricingType,
        addons,
        status: space.requiresApproval ? "PENDING" : "APPROVED",
        paymentStatus: "PENDING",
      },
      include: {
        space: {
          include: {
            user: true,
          },
        },
      },
    });

    // If instant booking, create invoice
    if (!space.requiresApproval && space.instantBooking) {
      const invoiceNumber = `INV-${Date.now()}-${booking.id.slice(0, 8)}`;

      await prisma.invoice.create({
        data: {
          invoiceNumber,
          bookingId: booking.id,
          billingName: companyName || currentUser.name || "attendee",
          billingEmail: currentUser.email || "",
          subtotal: totalPrice * 0.9, // Example: 10% tax
          taxes: totalPrice * 0.1,
          total: totalPrice,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: "SENT",
        },
      });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        space: {
          include: {
            user: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        startDateTime: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
