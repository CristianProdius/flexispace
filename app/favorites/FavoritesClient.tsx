// app/favorites/FavoritesClient.tsx
"use client";

import Container from "../components/Container";
import Heading from "../components/Heading";
import SpaceCard from "../components/spaces/SpaceCard";
import { SafeSpace, SafeUser } from "../types";

interface FavoritesClientProps {
  spaces: SafeSpace[];
  currentUser?: SafeUser | null;
}

const FavoritesClient: React.FC<FavoritesClientProps> = ({
  spaces,
  currentUser,
}) => {
  return (
    <Container>
      <Heading title="Favorites" subtitle="List of spaces you favorited" />
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {spaces.map((space) => (
          <SpaceCard key={space.id} currentUser={currentUser} data={space} />
        ))}
      </div>
    </Container>
  );
};

export default FavoritesClient;
