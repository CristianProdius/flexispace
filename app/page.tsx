// app/page.tsx
export const dynamic = "force-dynamic";
import getCurrentUser from "./actions/getCurrentUser";
import getSpaces, { ISpaceParams } from "./actions/getSpaces";
import ClientOnly from "./components/ClientOnly";
import Container from "./components/Container";
import EmptyState from "./components/EmptyState";
import SpaceCard from "./components/spaces/SpaceCard";

interface HomeProps {
  searchParams: ISpaceParams;
}

const Home = async ({ searchParams }: HomeProps) => {
  const spaces = await getSpaces(searchParams);
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
          {spaces.map((space) => {
            return (
              <SpaceCard
                key={space.id}
                data={space}
                currentUser={currentUser}
              />
            );
          })}
        </div>
      </Container>
    </ClientOnly>
  );
};

export default Home;
