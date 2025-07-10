// app/favorites/page.tsx
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import getFavoriteSpaces from "../actions/getFavoriteSpaces";
import FavoritesClient from "./FavoritesClient";

const FavoritesPage = async () => {
  const spaces = await getFavoriteSpaces();
  const currentUser = await getCurrentUser();

  if (spaces.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No favorites found"
          subTitle="Looks like you have no favorite spaces."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <FavoritesClient spaces={spaces} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default FavoritesPage;
