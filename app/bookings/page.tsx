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
        <EmptyState title="Unauthorized" subtitle="Please login" />
      </ClientOnly>
    );
  }

  const bookings = await getBookings({ userId: currentUser.id });

  if (bookings.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No bookings found"
          subtitle="Looks like you haven't booked any spaces yet."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <BookingsClient bookings={bookings} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default BookingsPage;
