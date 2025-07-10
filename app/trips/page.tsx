// app/trips/page.tsx
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import getBookings from "../actions/getBookings";
import TripsClient from "./TripsClient";

const TripsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState title="Unauthorized" subTitle="Please Login" />
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

  return (
    <ClientOnly>
      <TripsClient bookings={bookings} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default TripsPage;
