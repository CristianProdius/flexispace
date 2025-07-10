// app/properties/page.tsx
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import PropertiesClient from "./PropertiesClient";
import getSpaces from "../actions/getSpaces";

const PropertiesPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState title="Unauthorized" subTitle="Please Login" />
      </ClientOnly>
    );
  }

  const spaces = await getSpaces({ userId: currentUser.id });

  if (spaces.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No spaces found"
          subTitle="Looks like you haven't created any spaces yet."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <PropertiesClient spaces={spaces} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default PropertiesPage;
