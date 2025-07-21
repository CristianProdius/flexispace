import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all spaces with their bookings and reviews
    const spaces = await prisma.space.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        bookings: {
          include: {
            review: true,
          },
        },
        reviews: true,
      },
    });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Calculate stats for each space
    const spaceStats: Record<string, any> = {};

    spaces.forEach((space) => {
      // Count pending bookings
      const pendingBookings = space.bookings.filter(
        (booking) => booking.status === BookingStatus.PENDING
      ).length;

      // Total bookings
      const totalBookings = space.bookings.length;

      // Monthly revenue
      const monthlyRevenue = space.bookings
        .filter(
          (booking) =>
            booking.status === BookingStatus.APPROVED &&
            booking.paymentStatus === PaymentStatus.PAID &&
            new Date(booking.createdAt) >= monthStart &&
            new Date(booking.createdAt) <= monthEnd
        )
        .reduce((sum, booking) => sum + booking.totalPrice, 0);

      // Average rating
      const averageRating =
        space.reviews.length > 0
          ? space.reviews.reduce((sum, review) => sum + review.rating, 0) /
            space.reviews.length
          : 0;

      spaceStats[space.id] = {
        pendingBookings,
        totalBookings,
        monthlyRevenue,
        averageRating,
      };
    });

    return NextResponse.json(spaceStats);
  } catch (error) {
    console.error("Error fetching space stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch space statistics" },
      { status: 500 }
    );
  }
}
