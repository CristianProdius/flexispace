// app/actions/getBookings.ts
import prisma from "@/app/libs/prismadb";
import { BookingStatus } from "@prisma/client";

interface IParams {
  spaceId?: string;
  userId?: string;
  providerId?: string; // Space owner ID
  status?: BookingStatus;
  includeInvoice?: boolean;
}

export default async function getBookings(params: IParams) {
  try {
    const {
      spaceId,
      userId,
      providerId,
      status,
      includeInvoice = false,
    } = params;

    const query: any = {};

    if (spaceId) {
      query.spaceId = spaceId;
    }

    if (userId) {
      query.userId = userId;
    }

    if (providerId) {
      query.space = { userId: providerId };
    }

    if (status) {
      query.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where: query,
      include: {
        space: {
          include: {
            user: true,
            pricing: true,
            businessHours: true,
          },
        },
        user: true,
        review: includeInvoice ? true : false,
        invoice: includeInvoice ? true : false,
      },
      orderBy: {
        startDateTime: "desc",
      },
    });

    // Transform to safe bookings
    const safeBookings = bookings.map((booking) => ({
      ...booking,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      startDateTime: booking.startDateTime.toISOString(),
      endDateTime: booking.endDateTime.toISOString(),
      space: {
        ...booking.space,
        createdAt: booking.space.createdAt.toISOString(),
        updatedAt: booking.space.updatedAt.toISOString(),
        user: {
          ...booking.space.user,
          createdAt: booking.space.user.createdAt.toISOString(),
          updatedAt: booking.space.user.updatedAt.toISOString(),
          emailVerified:
            booking.space.user.emailVerified?.toISOString() || null,
        },
        pricing: booking.space.pricing.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      },
      user: {
        ...booking.user,
        createdAt: booking.user.createdAt.toISOString(),
        updatedAt: booking.user.updatedAt.toISOString(),
        emailVerified: booking.user.emailVerified?.toISOString() || null,
      },
      invoice: booking.invoice
        ? {
            ...booking.invoice,
            issuedAt: booking.invoice.issuedAt.toISOString(),
            dueDate: booking.invoice.dueDate.toISOString(),
            paidAt: booking.invoice.paidAt?.toISOString() || null,
          }
        : null,
    }));

    return safeBookings;
  } catch (error: any) {
    throw new Error(error);
  }
}
