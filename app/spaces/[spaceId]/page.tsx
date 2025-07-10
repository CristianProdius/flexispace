import getCurrentUser from "@/app/actions/getCurrentUser";
import getSpaceById from "@/app/actions/getSpaceById";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import SpaceClient from "./SpaceClient";
import getBookings from "@/app/actions/getBookings";

interface IParams {
  spaceId?: string;
}

const SpacePage = async ({ params }: { params: IParams }) => {
  const space = await getSpaceById(params);
  const bookings = await getBookings(params);
  const currentUser = await getCurrentUser();

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
