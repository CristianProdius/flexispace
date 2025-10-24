// app/api/invoices/[invoiceId]/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { InvoiceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface IParams {
  invoiceId: string;
}

export async function PATCH(request: Request, { params }: { params: IParams }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { invoiceId } = params;
  const body = await request.json();

  if (!invoiceId || typeof invoiceId !== "string") {
    throw new Error("Invalid ID");
  }

  const { status, paidAt } = body;

  try {
    // Get the invoice to check permissions
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          include: {
            space: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if user has permission to update this invoice
    const isSpaceOwner = invoice.booking.space.userId === currentUser.id;
    const isBookingOwner = invoice.booking.userId === currentUser.id;

    // Only space owners can mark invoices as paid
    if (status === InvoiceStatus.PAID && !isSpaceOwner) {
      return NextResponse.json(
        { error: "Only space owners can mark invoices as paid" },
        { status: 403 }
      );
    }

    // Update invoice
    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt);
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
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
    });

    // If marking as paid, update the booking payment status
    if (status === InvoiceStatus.PAID) {
      await prisma.booking.update({
        where: { id: invoice.booking.id },
        data: {
          paymentStatus: "PAID",
        },
      });
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: { params: IParams }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { invoiceId } = params;

  if (!invoiceId || typeof invoiceId !== "string") {
    throw new Error("Invalid ID");
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
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
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check permissions
    const isBookingOwner = invoice.booking.userId === currentUser.id;
    const isSpaceOwner = invoice.booking.space.userId === currentUser.id;

    if (!isBookingOwner && !isSpaceOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
