// app/actions/getInvoices.ts
import prisma from "@/app/libs/prismadb";
import { InvoiceStatus } from "@prisma/client";

interface IParams {
  userId: string;
  status?: InvoiceStatus;
  isProvider?: boolean; // If true, get invoices for spaces owned by user
}

export default async function getInvoices(params: IParams) {
  try {
    const { userId, status, isProvider = false } = params;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    let invoices;

    if (isProvider) {
      // Get invoices for spaces owned by the user
      invoices = await prisma.invoice.findMany({
        where: {
          ...query,
          booking: {
            space: {
              userId: userId,
            },
          },
        },
        include: {
          booking: {
            include: {
              space: {
                include: {
                  user: true,
                },
              },
              user: true,
            },
          },
        },
        orderBy: {
          issuedAt: "desc",
        },
      });
    } else {
      // Get invoices for bookings made by the user
      invoices = await prisma.invoice.findMany({
        where: {
          ...query,
          booking: {
            userId: userId,
          },
        },
        include: {
          booking: {
            include: {
              space: {
                include: {
                  user: true,
                },
              },
              user: true,
            },
          },
        },
        orderBy: {
          issuedAt: "desc",
        },
      });
    }

    // Get all invoices where user is either booking owner or space owner
    const allInvoices = await prisma.invoice.findMany({
      where: {
        ...query,
        OR: [
          {
            booking: {
              userId: userId,
            },
          },
          {
            booking: {
              space: {
                userId: userId,
              },
            },
          },
        ],
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
      orderBy: {
        issuedAt: "desc",
      },
    });

    // Transform to safe invoices
    const safeInvoices = allInvoices.map((invoice) => ({
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
          pricing:
            invoice.booking.space.pricing?.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
            })) || [],
        },
        user: {
          ...invoice.booking.user,
          createdAt: invoice.booking.user.createdAt.toISOString(),
          updatedAt: invoice.booking.user.updatedAt.toISOString(),
          emailVerified:
            invoice.booking.user.emailVerified?.toISOString() || null,
        },
      },
      // Add a flag to indicate if this is an incoming or outgoing invoice
      isIncoming: invoice.booking.space.userId === userId,
      isOutgoing: invoice.booking.userId === userId,
    }));

    return safeInvoices;
  } catch (error: any) {
    throw new Error(error);
  }
}
