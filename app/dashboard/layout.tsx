import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subTitle="Please login to access the dashboard"
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div className="flex h-screen pt-20">
        <DashboardSidebar currentUser={currentUser} />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </ClientOnly>
  );
}
