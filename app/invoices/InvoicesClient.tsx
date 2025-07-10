// app/invoices/InvoicesClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Container from "../components/Container";
import Heading from "../components/Heading";
import { SafeUser, InvoiceStatus } from "../types";
import { FaFileInvoice } from "@react-icons/all-files/fa/FaFileInvoice";
import { FaDownload } from "@react-icons/all-files/fa/FaDownload";
import { FaEye } from "@react-icons/all-files/fa/FaEye";
import { FaCheckCircle } from "@react-icons/all-files/fa/FaCheckCircle";
import { FaClock } from "@react-icons/all-files/fa/FaClock";
import { FaExclamationCircle } from "@react-icons/all-files/fa/FaExclamationCircle";
import axios from "axios";
import { toast } from "react-hot-toast";

interface SafeInvoiceWithBooking {
  id: string;
  invoiceNumber: string;
  billingName: string;
  billingEmail: string;
  billingAddress?: string | null;
  taxId?: string | null;
  subtotal: number;
  taxes: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paidAt?: string | null;
  booking: any; // Full booking with space details
  isIncoming: boolean;
  isOutgoing: boolean;
}

interface InvoicesClientProps {
  invoices: SafeInvoiceWithBooking[];
  currentUser: SafeUser | null;
}

const InvoicesClient: React.FC<InvoicesClientProps> = ({
  invoices,
  currentUser,
}) => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "ALL">(
    "ALL"
  );
  const [filterType, setFilterType] = useState<"ALL" | "INCOMING" | "OUTGOING">(
    "ALL"
  );
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    if (filterStatus !== "ALL" && invoice.status !== filterStatus) {
      return false;
    }
    if (filterType === "INCOMING" && !invoice.isIncoming) {
      return false;
    }
    if (filterType === "OUTGOING" && !invoice.isOutgoing) {
      return false;
    }
    return true;
  });

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case "OVERDUE":
        return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FaClock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-50";
      case "OVERDUE":
        return "text-red-600 bg-red-50";
      case "SENT":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setIsLoading(invoiceId);
    try {
      await axios.patch(`/api/invoices/${invoiceId}`, {
        status: "PAID",
        paidAt: new Date().toISOString(),
      });
      toast.success("Invoice marked as paid");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update invoice");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDownload = async (invoice: SafeInvoiceWithBooking) => {
    // In production, this would generate and download a PDF
    router.push(`/invoices/${invoice.id}`);
  };

  // Calculate summary stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    pending: invoices.filter((i) => i.status === "SENT").length,
    overdue: invoices.filter((i) => i.status === "OVERDUE").length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
    paidAmount: invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.total, 0),
    pendingAmount: invoices
      .filter((i) => i.status !== "PAID")
      .reduce((sum, i) => sum + i.total, 0),
  };

  return (
    <Container>
      <Heading
        title="Invoices"
        subtitle="Manage your billing and payment history"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FaFileInvoice className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              <p className="text-sm text-gray-500 mt-1">
                ${stats.paidAmount.toFixed(2)}
              </p>
            </div>
            <FaCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ${stats.pendingAmount.toFixed(2)}
              </p>
            </div>
            <FaClock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <FaExclamationCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <div className="flex gap-2">
            {["ALL", "INCOMING", "OUTGOING"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type === "ALL"
                  ? "All"
                  : type === "INCOMING"
                  ? "Received"
                  : "Sent"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex gap-2">
            {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "ALL" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Space / Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        Issued:{" "}
                        {format(new Date(invoice.issuedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.booking.space.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.isIncoming
                          ? `Client: ${
                              invoice.booking.user.name || invoice.billingName
                            }`
                          : `Provider: ${invoice.booking.space.user.name}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(
                        new Date(invoice.booking.startDateTime),
                        "MMM dd, yyyy"
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(
                        new Date(invoice.booking.startDateTime),
                        "h:mm a"
                      )}{" "}
                      -{format(new Date(invoice.booking.endDateTime), "h:mm a")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    {invoice.status === "PAID" && invoice.paidAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Paid: {format(new Date(invoice.paidAt), "MMM dd")}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${invoice.total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      +${invoice.taxes.toFixed(2)} tax
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Invoice"
                      >
                        <FaEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download PDF"
                      >
                        <FaDownload className="w-5 h-5" />
                      </button>
                      {invoice.isIncoming && invoice.status === "SENT" && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          disabled={isLoading === invoice.id}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No invoices found</p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default InvoicesClient;
