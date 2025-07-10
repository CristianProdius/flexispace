// app/components/invoice/InvoiceDisplay.tsx
"use client";

import { SafeInvoice, SafeBookingWithSpace } from "@/app/types";
import { format } from "date-fns";
import { FaDownload } from "@react-icons/all-files/fa/FaDownload";
import { FaPrint } from "@react-icons/all-files/fa/FaPrint";
import { FaEnvelope } from "@react-icons/all-files/fa/FaEnvelope";
import { useRef } from "react";

interface InvoiceDisplayProps {
  invoice: SafeInvoice & {
    booking: SafeBookingWithSpace;
  };
  companyDetails?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
  };
}

const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({
  invoice,
  companyDetails = {
    name: "FlexiSpace Inc.",
    address: "123 Business Ave, Suite 100, New York, NY 10001",
    phone: "(555) 123-4567",
    email: "billing@flexispace.com",
    taxId: "TAX-123456789",
  },
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // In production, you'd generate a proper PDF
    // For now, we'll trigger the print dialog
    window.print();
  };

  const handleEmailInvoice = () => {
    // In production, this would send an email
    alert("Invoice sent to " + invoice.billingEmail);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-100";
      case "OVERDUE":
        return "text-red-600 bg-red-100";
      case "SENT":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="mb-6 flex justify-end space-x-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaPrint className="w-4 h-4 mr-2" />
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaDownload className="w-4 h-4 mr-2" />
          Download PDF
        </button>
        <button
          onClick={handleEmailInvoice}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaEnvelope className="w-4 h-4 mr-2" />
          Email Invoice
        </button>
      </div>

      {/* Invoice Content */}
      <div
        ref={printRef}
        className="bg-white p-8 rounded-lg shadow-sm border print:shadow-none print:border-0"
      >
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-600 mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">
              {companyDetails.name}
            </h2>
            <p className="text-sm text-gray-600">{companyDetails.address}</p>
            <p className="text-sm text-gray-600">{companyDetails.phone}</p>
            <p className="text-sm text-gray-600">{companyDetails.email}</p>
            {companyDetails.taxId && (
              <p className="text-sm text-gray-600">
                Tax ID: {companyDetails.taxId}
              </p>
            )}
          </div>
        </div>

        {/* Status and Dates */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Issue Date</p>
            <p className="font-medium">
              {format(new Date(invoice.issuedAt), "MMM dd, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className="font-medium">
              {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO</h3>
          <div className="border-l-4 border-blue-600 pl-4">
            <p className="font-semibold">{invoice.billingName}</p>
            <p className="text-gray-600">{invoice.billingEmail}</p>
            {invoice.billingAddress && (
              <p className="text-gray-600">{invoice.billingAddress}</p>
            )}
            {invoice.taxId && (
              <p className="text-gray-600">Tax ID: {invoice.taxId}</p>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">
            BOOKING DETAILS
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Details
                </th>
                <th className="text-right py-2 text-sm font-semibold text-gray-900">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4">
                  <p className="font-medium">{invoice.booking.space.title}</p>
                  <p className="text-sm text-gray-600">
                    {invoice.booking.space.address}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(
                      new Date(invoice.booking.startDateTime),
                      "MMM dd, yyyy h:mm a"
                    )}{" "}
                    -{format(new Date(invoice.booking.endDateTime), "h:mm a")}
                  </p>
                </td>
                <td className="py-4 text-right">
                  <p className="text-sm">{invoice.booking.totalHours} hours</p>
                  <p className="text-sm text-gray-600">
                    @ ${invoice.booking.hourlyRate}/hour
                  </p>
                  <p className="text-sm text-gray-600">
                    {invoice.booking.attendeeCount} attendees
                  </p>
                </td>
                <td className="py-4 text-right font-medium">
                  $
                  {(
                    invoice.booking.hourlyRate * invoice.booking.totalHours
                  ).toFixed(2)}
                </td>
              </tr>

              {/* Additional Services */}
              {invoice.booking.addons && invoice.booking.addons.length > 0 && (
                <tr className="border-b">
                  <td colSpan={2} className="py-2 text-sm">
                    Additional Services
                  </td>
                  <td className="py-2 text-right">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">
                ${invoice.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">${invoice.taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-900">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-xl">
                ${invoice.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {invoice.status === "PAID" && invoice.paidAt && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">
              Paid on {format(new Date(invoice.paidAt), "MMMM dd, yyyy")}
            </p>
          </div>
        )}

        {/* Terms */}
        <div className="mt-8 pt-8 border-t text-sm text-gray-600">
          <p className="font-semibold mb-2">Terms & Conditions</p>
          <p>
            Payment is due within 7 days of invoice date. Late payments may
            incur additional charges.
          </p>
          <p className="mt-2">Thank you for choosing FlexiSpace!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDisplay;
