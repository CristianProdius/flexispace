// app/actions/getFavoriteSpaces.ts
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

export default async function getFavoriteSpaces() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

    const favorites = await prisma.space.findMany({
      where: {
        id: {
          in: [...(currentUser.favoriteIds || [])],
        },
        isActive: true, // Only show active spaces
      },
      include: {
        user: true,
        pricing: true,
        businessHours: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    const safeFavorites = favorites.map((space) => ({
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
      reviewCount: space._count.reviews,
      bookingCount: space._count.bookings,
    }));

    return safeFavorites;
  } catch (error: any) {
    throw new Error(error);
  }
}
