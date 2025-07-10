// app/invoices/page.tsx
import EmptyState from "../components/EmptyState";
import ClientOnly from "../components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import getInvoices from "../actions/getInvoices";
import InvoicesClient from "./InvoicesClient";

const InvoicesPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subTitle="Please login to view your invoices"
        />
      </ClientOnly>
    );
  }

  const invoices = await getInvoices({ userId: currentUser.id });

  if (invoices.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No invoices found"
          subTitle="You don't have any invoices yet."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <InvoicesClient invoices={invoices} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default InvoicesPage;
