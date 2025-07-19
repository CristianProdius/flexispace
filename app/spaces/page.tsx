// app/spaces/page.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import getSpaces from "@/app/actions/getSpaces";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import SpaceCard from "@/app/components/spaces/SpaceCard";
import Container from "@/app/components/Container";

interface SpacesPageProps {
  searchParams: {
    category?: string;
    locationValue?: string;
    startDate?: string;
    endDate?: string;
    minCapacity?: string;
    spaceType?: string;
  };
}

const SpacesPage = async ({ searchParams }: SpacesPageProps) => {
  const spaceParams = {
    category: searchParams.category,
    locationValue: searchParams.locationValue,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    minCapacity: searchParams.minCapacity
      ? parseInt(searchParams.minCapacity, 10)
      : undefined,
    spaceType: searchParams.spaceType,
  };
  const spaces = await getSpaces(spaceParams);
  const currentUser = await getCurrentUser();

  if (spaces.length === 0) {
    return (
      <ClientOnly>
        <EmptyState showReset />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <Container>
        <div className="pt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
          {spaces.map((space) => (
            <SpaceCard key={space.id} data={space} currentUser={currentUser} />
          ))}
        </div>
      </Container>
    </ClientOnly>
  );
};

export default SpacesPage;
