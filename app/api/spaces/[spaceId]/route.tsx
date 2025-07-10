// app/api/spaces/[spaceId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface IParams {
  spaceId: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { spaceId } = params;

  if (!spaceId || typeof spaceId !== "string") {
    throw new Error("Invalid ID");
  }

  // Check if space has active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      spaceId,
      status: {
        in: ["PENDING", "APPROVED"],
      },
      endDateTime: {
        gte: new Date(),
      },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json(
      { error: "Cannot delete space with active bookings" },
      { status: 400 }
    );
  }

  // Soft delete by setting isActive to false instead of hard delete
  const space = await prisma.space.update({
    where: {
      id: spaceId,
      userId: currentUser.id, // Only owner can delete
    },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json(space);
}

export async function PATCH(request: Request, { params }: { params: IParams }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { spaceId } = params;
  const body = await request.json();

  if (!spaceId || typeof spaceId !== "string") {
    throw new Error("Invalid ID");
  }

  try {
    // Check if user owns this space
    const existingSpace = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        pricing: true,
        businessHours: true,
      },
    });

    if (!existingSpace) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    if (existingSpace.userId !== currentUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      title,
      description,
      imageSrc,
      images,
      category,
      capacity,
      minCapacity,
      address,
      city,
      state,
      postalCode,
      squareFootage,
      ceilingHeight,
      amenities,
      equipment,
      instantBooking,
      requiresApproval,
      minBookingHours,
      maxBookingHours,
      cancellationPolicy,
      rules,
      isActive,
      pricing,
      businessHours,
    } = body;

    // Update space data
    const updateData: any = {};

    // Only include fields that are provided
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageSrc !== undefined) updateData.imageSrc = imageSrc;
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (minCapacity !== undefined)
      updateData.minCapacity = parseInt(minCapacity);
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (squareFootage !== undefined)
      updateData.squareFootage = parseInt(squareFootage);
    if (ceilingHeight !== undefined)
      updateData.ceilingHeight = parseFloat(ceilingHeight);
    if (amenities !== undefined) updateData.amenities = amenities;
    if (equipment !== undefined) updateData.equipment = equipment;
    if (instantBooking !== undefined)
      updateData.instantBooking = instantBooking;
    if (requiresApproval !== undefined)
      updateData.requiresApproval = requiresApproval;
    if (minBookingHours !== undefined)
      updateData.minBookingHours = parseInt(minBookingHours);
    if (maxBookingHours !== undefined)
      updateData.maxBookingHours = maxBookingHours
        ? parseInt(maxBookingHours)
        : null;
    if (cancellationPolicy !== undefined)
      updateData.cancellationPolicy = cancellationPolicy;
    if (rules !== undefined) updateData.rules = rules;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update in a transaction
    const updatedSpace = await prisma.$transaction(async (tx) => {
      // Update the space
      const space = await tx.space.update({
        where: { id: spaceId },
        data: updateData,
      });

      // Update pricing if provided
      if (pricing && Array.isArray(pricing)) {
        // Delete existing pricing
        await tx.pricingTier.deleteMany({
          where: { spaceId },
        });

        // Create new pricing
        const pricingData = pricing.map((tier) => ({
          spaceId,
          pricingType: tier.pricingType,
          price: parseFloat(tier.price),
          currency: tier.currency || "USD",
          isPeakPrice: tier.isPeakPrice || false,
          peakDays: tier.peakDays || [],
          peakHours: tier.peakHours || null,
          cleaningFee: tier.cleaningFee ? parseFloat(tier.cleaningFee) : null,
          serviceFee: tier.serviceFee ? parseFloat(tier.serviceFee) : null,
          overtimeFee: tier.overtimeFee ? parseFloat(tier.overtimeFee) : null,
        }));

        await tx.pricingTier.createMany({
          data: pricingData,
        });
      }

      // Update business hours if provided
      if (businessHours && Array.isArray(businessHours)) {
        // Delete existing business hours
        await tx.businessHour.deleteMany({
          where: { spaceId },
        });

        // Create new business hours
        const businessHoursData = businessHours.map((day) => ({
          spaceId,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openTime,
          closeTime: day.closeTime,
          isClosed: day.isClosed || false,
        }));

        await tx.businessHour.createMany({
          data: businessHoursData,
        });
      }

      // Return updated space with all relations
      return await tx.space.findUnique({
        where: { id: spaceId },
        include: {
          user: true,
          pricing: true,
          businessHours: true,
          reviews: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedSpace);
  } catch (error) {
    console.error("Space update error:", error);
    return NextResponse.json(
      { error: "Failed to update space" },
      { status: 500 }
    );
  }
}
