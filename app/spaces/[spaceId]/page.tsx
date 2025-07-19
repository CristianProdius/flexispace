// app/spaces/[spaceId]/page.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import getSpaceById from "@/app/actions/getSpaceById";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import SpaceClient from "./SpaceClient";
import getBookings from "@/app/actions/getBookings";
import { SafeBooking } from "@/app/types";

interface IParams {
  spaceId?: string;
}

const SpacePage = async ({ params }: { params: IParams }) => {
  const space = await getSpaceById(params);
  const bookingsData = await getBookings(params);
  const currentUser = await getCurrentUser();

  // Transform bookings to SafeBooking type
  let bookings: SafeBooking[] = [];

  if (bookingsData && Array.isArray(bookingsData)) {
    bookings = bookingsData.map((booking) => ({
      ...booking,
      // Convert Date objects to ISO strings
      createdAt: booking.createdAt.toString(),
      updatedAt: booking.updatedAt.toString(),
      startDateTime: booking.startDateTime.toString(),
      endDateTime: booking.endDateTime.toString(),
      // Handle review transformation
      review: booking.review
        ? {
            ...booking.review,
            createdAt: booking.review.createdAt.toString(),
            updatedAt: booking.review.updatedAt.toString(),
          }
        : undefined,
      invoice: booking.invoice
        ? {
            ...booking.invoice,
            issuedAt: booking.invoice.issuedAt.toString(),
            dueDate: booking.invoice.dueDate.toString(),
            paidAt: booking.invoice.paidAt
              ? booking.invoice.paidAt.toString()
              : null,
          }
        : undefined,
      // Handle space transformation if needed
      space: booking.space
        ? {
            ...booking.space,
            createdAt: booking.space.createdAt.toString(),
            updatedAt: booking.space.updatedAt.toString(),
            // Transform nested user if it exists
            user: booking.space.user
              ? {
                  ...booking.space.user,
                  createdAt: booking.space.user.createdAt.toString(),
                  updatedAt: booking.space.user.updatedAt.toString(),
                }
              : undefined,
          }
        : undefined,
    }));
  }

  if (!space) {
    return (
      <ClientOnly>
        <EmptyState />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <SpaceClient
        space={space}
        currentUser={currentUser}
        bookings={bookings}
      />
    </ClientOnly>
  );
};

export default SpacePage;
