import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import SpaceAnalyticsDashboard from "./SpaceAnalyticsDashboard";

const AnalyticsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState title="Unauthorized" subTitle="Please login" />
      </ClientOnly>
    );
  }

  // Get spaces owned by the current user with bookings and reviews
  const spaces = await prisma.space.findMany({
    where: {
      userId: currentUser.id,
    },
    include: {
      bookings: {
        orderBy: {
          createdAt: "desc",
        },
      },
      reviews: true,
    },
  });

  // Transform to safe format
  const safeSpaces = spaces.map((space) => ({
    ...space,
    createdAt: space.createdAt.toISOString(),
    updatedAt: space.updatedAt.toISOString(),
    bookings: space.bookings.map((booking) => ({
      ...booking,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      startDateTime: booking.startDateTime.toISOString(),
      endDateTime: booking.endDateTime.toISOString(),
    })),
    reviews: space.reviews,
  }));

  if (safeSpaces.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No spaces found"
          subTitle="You haven't created any spaces yet."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <SpaceAnalyticsDashboard spaces={safeSpaces} />
    </ClientOnly>
  );
};

export default AnalyticsPage;
