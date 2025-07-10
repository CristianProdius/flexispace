// app/actions/getInvoiceById.ts
import prisma from "@/app/libs/prismadb";

interface IParams {
  invoiceId: string;
  userId: string;
}

export default async function getInvoiceById(params: IParams) {
  try {
    const { invoiceId, userId } = params;

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        booking: {
          include: {
            space: {
              include: {
                user: true,
                pricing: true,
              },
            },
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    // Check if user has permission to view this invoice
    const isBookingOwner = invoice.booking.userId === userId;
    const isSpaceOwner = invoice.booking.space.userId === userId;

    if (!isBookingOwner && !isSpaceOwner) {
      return null;
    }

    // Transform to safe invoice
    return {
      ...invoice,
      issuedAt: invoice.issuedAt.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString() || null,
      booking: {
        ...invoice.booking,
        createdAt: invoice.booking.createdAt.toISOString(),
        updatedAt: invoice.booking.updatedAt.toISOString(),
        startDateTime: invoice.booking.startDateTime.toISOString(),
        endDateTime: invoice.booking.endDateTime.toISOString(),
        space: {
          ...invoice.booking.space,
          createdAt: invoice.booking.space.createdAt.toISOString(),
          updatedAt: invoice.booking.space.updatedAt.toISOString(),
          user: {
            ...invoice.booking.space.user,
            createdAt: invoice.booking.space.user.createdAt.toISOString(),
            updatedAt: invoice.booking.space.user.updatedAt.toISOString(),
            emailVerified:
              invoice.booking.space.user.emailVerified?.toISOString() || null,
          },
          pricing: invoice.booking.space.pricing.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
        },
        user: {
          ...invoice.booking.user,
          createdAt: invoice.booking.user.createdAt.toISOString(),
          updatedAt: invoice.booking.user.updatedAt.toISOString(),
          emailVerified:
            invoice.booking.user.emailVerified?.toISOString() || null,
        },
      },
    };
  } catch (error: any) {
    throw new Error(error);
  }
}
