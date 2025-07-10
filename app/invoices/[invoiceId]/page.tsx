// app/invoices/[invoiceId]/page.tsx
import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import InvoiceDisplay from "@/app/components/invoice/InvoiceDisplay";
import getInvoiceById from "@/app/actions/getInvoiceById";

interface IParams {
  invoiceId: string;
}

const InvoicePage = async ({ params }: { params: IParams }) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <ClientOnly>
        <EmptyState
          title="Unauthorized"
          subTitle="Please login to view this invoice"
        />
      </ClientOnly>
    );
  }

  const invoice = await getInvoiceById({
    invoiceId: params.invoiceId,
    userId: currentUser.id,
  });

  if (!invoice) {
    return (
      <ClientOnly>
        <EmptyState
          title="Invoice not found"
          subTitle="This invoice doesn't exist or you don't have permission to view it"
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvoiceDisplay
          invoice={invoice}
          companyDetails={{
            name: "FlexiSpace Inc.",
            address: "123 Business Ave, Suite 100, New York, NY 10001",
            phone: "(555) 123-4567",
            email: "billing@flexispace.com",
            taxId: "TAX-123456789",
          }}
        />
      </div>
    </ClientOnly>
  );
};

export default InvoicePage;
