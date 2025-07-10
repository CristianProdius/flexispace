// app/actions/getSpaceById.ts
import prisma from "@/app/libs/prismadb";

interface IParams {
  spaceId?: string;
}

export default async function getSpaceById(params: IParams) {
  try {
    const { spaceId } = params;

    const space = await prisma.space.findUnique({
      where: {
        id: spaceId,
      },
      include: {
        user: true,
        pricing: true,
        businessHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
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

    if (!space) {
      return null;
    }

    // Calculate average ratings
    const avgRating =
      space.reviews.length > 0
        ? space.reviews.reduce((sum, r) => sum + r.rating, 0) /
          space.reviews.length
        : null;

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
      reviews: space.reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        user: {
          ...r.user,
          createdAt: r.user.createdAt.toISOString(),
          updatedAt: r.user.updatedAt.toISOString(),
          emailVerified: r.user.emailVerified?.toISOString() || null,
        },
      })),
      averageRating: avgRating,
      reviewCount: space._count.reviews,
      bookingCount: space._count.bookings,
    };
  } catch (error: any) {
    throw new Error(error);
  }
}
