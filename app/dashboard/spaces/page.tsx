import getCurrentUser from "@/app/actions/getCurrentUser";
import getSpaces from "@/app/actions/getSpaces";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import Container from "@/app/components/Container";
import SpacesManagement from "./SpacesManagement";

const DashboardSpacesPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subTitle="Please login to view your spaces"
        />
      </ClientOnly>
    );
  }

  // Get spaces owned by the current user
  const spaces = await getSpaces({ userId: currentUser.id });

  return (
    <ClientOnly>
      <Container>
        <SpacesManagement spaces={spaces} currentUser={currentUser} />
      </Container>
    </ClientOnly>
  );
};

export default DashboardSpacesPage;
