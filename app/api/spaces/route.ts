// app/api/spaces/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { SpaceType, PricingType, DayOfWeek } from "@prisma/client";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const body = await request.json();

  const {
    title,
    description,
    imageSrc,
    images = [],
    spaceType,
    category,
    capacity,
    minCapacity = 1,
    location,
    address,
    city,
    state,
    postalCode,
    country,
    squareFootage,
    ceilingHeight,
    amenities = [],
    equipment = [],
    instantBooking = false,
    requiresApproval = false,
    minBookingHours = 1,
    maxBookingHours,
    cancellationPolicy = "MODERATE",
    rules = [],
    pricing,
    businessHours,
  } = body;

  // Validation
  const requiredFields = [
    "title",
    "description",
    "imageSrc",
    "spaceType",
    "category",
    "capacity",
    "location",
    "address",
    "city",
    "country",
    "pricing",
    "businessHours",
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  try {
    // Create space with all related data in a transaction
    const space = await prisma.$transaction(async (tx) => {
      // Create the space
      const newSpace = await tx.space.create({
        data: {
          title,
          description,
          imageSrc,
          images,
          spaceType,
          category,
          capacity: parseInt(capacity),
          minCapacity: parseInt(minCapacity),
          locationValue: location.value,
          address,
          city,
          state,
          postalCode,
          country: location.label,
          latitude: location.latlng?.[0],
          longitude: location.latlng?.[1],
          squareFootage: squareFootage ? parseInt(squareFootage) : null,
          ceilingHeight: ceilingHeight ? parseFloat(ceilingHeight) : null,
          amenities,
          equipment,
          instantBooking,
          requiresApproval,
          minBookingHours: parseInt(minBookingHours),
          maxBookingHours: maxBookingHours ? parseInt(maxBookingHours) : null,
          cancellationPolicy,
          rules,
          userId: currentUser.id,
          isActive: true,
          verified: false,
        },
      });

      // Create pricing tiers
      const pricingData = [];
      for (const tier of pricing) {
        pricingData.push({
          spaceId: newSpace.id,
          pricingType: tier.pricingType,
          price: parseFloat(tier.price),
          currency: tier.currency || "USD",
          isPeakPrice: tier.isPeakPrice || false,
          peakDays: tier.peakDays || [],
          peakHours: tier.peakHours || null,
          cleaningFee: tier.cleaningFee ? parseFloat(tier.cleaningFee) : null,
          serviceFee: tier.serviceFee ? parseFloat(tier.serviceFee) : null,
          overtimeFee: tier.overtimeFee ? parseFloat(tier.overtimeFee) : null,
        });
      }

      await tx.pricingTier.createMany({
        data: pricingData,
      });

      // Create business hours
      const businessHoursData = [];
      for (const day of businessHours) {
        businessHoursData.push({
          spaceId: newSpace.id,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openTime,
          closeTime: day.closeTime,
          isClosed: day.isClosed || false,
        });
      }

      await tx.businessHour.createMany({
        data: businessHoursData,
      });

      // Return the space with all relations
      return await tx.space.findUnique({
        where: { id: newSpace.id },
        include: {
          pricing: true,
          businessHours: true,
          user: true,
        },
      });
    });

    return NextResponse.json(space);
  } catch (error) {
    console.error("Space creation error:", error);
    return NextResponse.json(
      { error: "Failed to create space" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const userId = searchParams.get("userId");
    const spaceType = searchParams.get("spaceType");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const minCapacity = searchParams.get("minCapacity");
    const maxCapacity = searchParams.get("maxCapacity");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const instantBooking = searchParams.get("instantBooking");
    const amenities = searchParams.get("amenities")?.split(",");

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (userId) where.userId = userId;
    if (spaceType) where.spaceType = spaceType;
    if (category) where.category = category;
    if (city) where.city = { contains: city, mode: "insensitive" };

    if (minCapacity || maxCapacity) {
      where.capacity = {};
      if (minCapacity) where.capacity.gte = parseInt(minCapacity);
      if (maxCapacity) where.capacity.lte = parseInt(maxCapacity);
    }

    if (instantBooking !== null) {
      where.instantBooking = instantBooking === "true";
    }

    if (amenities && amenities.length > 0) {
      where.amenities = {
        hasEvery: amenities,
      };
    }

    // Get spaces with optional price filtering
    let spaces = await prisma.space.findMany({
      where,
      include: {
        user: true,
        pricing: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by price if needed (after fetching due to pricing being in related table)
    if (minPrice || maxPrice) {
      spaces = spaces.filter((space) => {
        const hourlyPricing = space.pricing.find(
          (p) => p.pricingType === PricingType.HOURLY
        );
        if (!hourlyPricing) return false;

        const price = hourlyPricing.price;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;

        return true;
      });
    }

    // Calculate average ratings
    const spacesWithRatings = spaces.map((space) => {
      const avgRating =
        space.reviews.length > 0
          ? space.reviews.reduce((sum, review) => sum + review.rating, 0) /
            space.reviews.length
          : null;

      return {
        ...space,
        averageRating: avgRating,
        reviewCount: space._count.reviews,
        bookingCount: space._count.bookings,
      };
    });

    return NextResponse.json(spacesWithRatings);
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch spaces" },
      { status: 500 }
    );
  }
}
