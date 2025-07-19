import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import getBookings from "../actions/getBookings";
import BookingsClient from "./BookingsClient";

const BookingsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState title="Unauthorized" subTitle="Please login" />
      </ClientOnly>
    );
  }

  const bookings = await getBookings({ userId: currentUser.id });

  if (bookings.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No bookings found"
          subTitle="Looks like you haven't booked any spaces yet."
        />
      </ClientOnly>
    );
  }

  // Map bookings to ensure invoice is undefined instead of null
  const safeBookings = bookings.map((booking: any) => ({
    ...booking,
    invoice: booking.invoice === null ? undefined : booking.invoice,
  }));

  return (
    <ClientOnly>
      <BookingsClient bookings={safeBookings} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default BookingsPage;
