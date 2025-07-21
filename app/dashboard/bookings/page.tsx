// app/dashboard/bookings/page.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import getBookings from "@/app/actions/getBookings";
import getSpaces from "@/app/actions/getSpaces";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import Container from "@/app/components/Container";
import BookingManagement from "./BookingManagement";
import { SafeBookingWithSpace, BookingStatus } from "@/app/types";

interface DashboardBookingsPageProps {
  searchParams: {
    spaceId?: string;
    status?: string;
  };
}

const DashboardBookingsPage = async ({
  searchParams,
}: DashboardBookingsPageProps) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subTitle="Please login to view your bookings"
        />
      </ClientOnly>
    );
  }

  // Build booking query params
  const bookingParams: any = {
    providerId: currentUser.id,
  };

  if (searchParams.spaceId) {
    bookingParams.spaceId = searchParams.spaceId;
  }

  if (searchParams.status && searchParams.status in BookingStatus) {
    bookingParams.status = searchParams.status as BookingStatus;
  }

  // Get all bookings for spaces owned by the current user
  const bookings = await getBookings(bookingParams);

  // Get user's spaces for filtering
  const spaces = await getSpaces({ userId: currentUser.id });

  return (
    <ClientOnly>
      <Container>
        <BookingManagement
          bookings={bookings as SafeBookingWithSpace[]}
          currentUser={currentUser}
          spaces={spaces}
          initialSpaceId={searchParams.spaceId}
          initialStatus={searchParams.status as BookingStatus}
        />
      </Container>
    </ClientOnly>
  );
};

export default DashboardBookingsPage;
