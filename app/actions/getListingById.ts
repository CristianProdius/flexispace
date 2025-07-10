// app/actions/getSpaces.ts
import prisma from "@/app/libs/prismadb";
import { SpaceType, PricingType } from "@prisma/client";

export interface ISpaceParams {
  userId?: string;
  capacity?: number;
  minCapacity?: number;
  spaceType?: string;
  category?: string;
  startDateTime?: string;
  endDateTime?: string;
  locationValue?: string;
  city?: string;
  instantBooking?: boolean;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
}

export default async function getSpaces(params: ISpaceParams) {
  try {
    const {
      userId,
      capacity,
      minCapacity,
      spaceType,
      category,
      startDateTime,
      endDateTime,
      locationValue,
      city,
      instantBooking,
      minPrice,
      maxPrice,
      amenities,
    } = params;

    let query: any = {
      isActive: true,
    };

    // Basic filters
    if (userId) {
      query.userId = userId;
    }

    if (spaceType) {
      query.spaceType = spaceType;
    }

    if (category) {
      query.category = category;
    }

    if (capacity) {
      query.capacity = {
        gte: +capacity,
      };
    }

    if (minCapacity) {
      query.minCapacity = {
        lte: +minCapacity,
      };
    }

    if (locationValue) {
      query.locationValue = locationValue;
    }

    if (city) {
      query.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    if (instantBooking !== undefined) {
      query.instantBooking = instantBooking;
    }

    if (amenities && amenities.length > 0) {
      query.amenities = {
        hasEvery: amenities,
      };
    }

    // Date availability filter
    if (startDateTime && endDateTime) {
      query.NOT = {
        bookings: {
          some: {
            status: {
              notIn: ["CANCELLED", "REJECTED"],
            },
            OR: [
              {
                endDateTime: { gte: startDateTime },
                startDateTime: { lte: startDateTime },
              },
              {
                startDateTime: { lte: endDateTime },
                endDateTime: { gte: endDateTime },
              },
            ],
          },
        },
      };
    }

    // Get spaces with relations
    const spaces = await prisma.space.findMany({
      where: query,
      include: {
        user: true,
        pricing: true,
        businessHours: true,
        reviews: {
          select: {
            rating: true,
            cleanlinessRating: true,
            amenitiesRating: true,
            locationRating: true,
            valueRating: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by price range if specified
    let filteredSpaces = spaces;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredSpaces = spaces.filter((space) => {
        const hourlyPricing = space.pricing.find(
          (p) => p.pricingType === PricingType.HOURLY
        );

        if (!hourlyPricing) return false;

        const price = hourlyPricing.price;
        if (minPrice !== undefined && price < minPrice) return false;
        if (maxPrice !== undefined && price > maxPrice) return false;

        return true;
      });
    }

    // Transform to safe spaces with calculated fields
    const safeSpaces = filteredSpaces.map((space) => {
      // Calculate average ratings
      const ratings = space.reviews;
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : null;

      const avgCleanlinessRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.cleanlinessRating || 0), 0) /
            ratings.filter((r) => r.cleanlinessRating).length
          : null;

      // Get base price (hourly rate)
      const basePrice =
        space.pricing.find((p) => p.pricingType === PricingType.HOURLY)
          ?.price || 0;

      return {
        ...space,
        createdAt: space.createdAt.toISOString(),
        updatedAt: space.updatedAt.toISOString(),
        user: {
          ...space.user,
          createdAt: space.user.createdAt.toISOString(),
          updatedAt: space.user.updatedAt.toISOString(),
          emailVerified: space.user.emailVerified?.toISOString() || null,
        },
        pricing: space.pricing.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        businessHours: space.businessHours,
        averageRating: avgRating,
        cleanlinessRating: avgCleanlinessRating,
        reviewCount: space._count.reviews,
        bookingCount: space._count.bookings,
        basePrice: basePrice,
      };
    });

    return safeSpaces;
  } catch (error: any) {
    throw new Error(error);
  }
}
