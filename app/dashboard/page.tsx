import getCurrentUser from "@/app/actions/getCurrentUser";
import Container from "@/app/components/Container";
import DashboardOverview from "./DashboardOverview";

const DashboardPage = async () => {
  const currentUser = await getCurrentUser();

  return (
    <Container>
      <DashboardOverview currentUser={currentUser!} />
    </Container>
  );
};

export default DashboardPage;
