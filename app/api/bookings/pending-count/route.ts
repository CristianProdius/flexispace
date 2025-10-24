import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ count: 0 });
    }

    // Count pending bookings for spaces owned by the current user
    const pendingCount = await prisma.booking.count({
      where: {
        status: BookingStatus.PENDING,
        space: {
          userId: currentUser.id,
        },
      },
    });

    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error("Error fetching pending bookings count:", error);
    return NextResponse.json({ count: 0 });
  }
}
