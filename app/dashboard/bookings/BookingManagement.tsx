"use client";

import {
  SafeBookingWithSpace,
  SafeUser,
  SafeSpace,
  BookingStatus,
} from "@/app/types";
import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BookingManagementProps {
  bookings: SafeBookingWithSpace[];
  currentUser: SafeUser;
  spaces?: SafeSpace[];
  initialSpaceId?: string;
  initialStatus?: BookingStatus;
}

const BookingManagement: React.FC<BookingManagementProps> = ({
  bookings,
  currentUser,
  spaces = [],
  initialSpaceId,
  initialStatus,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BookingStatus | "ALL">(
    initialStatus || "PENDING"
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | "ALL">(
    initialSpaceId || "ALL"
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSpaceId !== "ALL") {
      params.set("spaceId", selectedSpaceId);
    }
    if (activeTab !== "ALL") {
      params.set("status", activeTab);
    }
    const queryString = params.toString();
    router.push(`/dashboard/bookings${queryString ? `?${queryString}` : ""}`);
  }, [selectedSpaceId, activeTab, router]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = activeTab === "ALL" || booking.status === activeTab;
    const matchesSpace =
      selectedSpaceId === "ALL" || booking.spaceId === selectedSpaceId;
    return matchesStatus && matchesSpace;
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  const handleApprove = useCallback(
    async (bookingId: string) => {
      setIsLoading(bookingId);

      try {
        await axios.post(`/api/bookings/${bookingId}/approve`);
        toast.success("Booking approved successfully!");
        router.refresh();
      } catch (error) {
        toast.error("Failed to approve booking");
      } finally {
        setIsLoading(null);
      }
    },
    [router]
  );

  const handleReject = useCallback(
    async (bookingId: string, reason?: string) => {
      setIsLoading(bookingId);

      try {
        await axios.post(`/api/bookings/${bookingId}/reject`, { reason });
        toast.success("Booking rejected");
        router.refresh();
      } catch (error) {
        toast.error("Failed to reject booking");
      } finally {
        setIsLoading(null);
      }
    },
    [router]
  );

  const getStatusBadge = (status: BookingStatus) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {status.toLowerCase()}
      </span>
    );
  };

  return (
    <div className="pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <p className="text-gray-600 mt-2">
          Manage booking requests for your spaces
        </p>
      </div>

      {/* Space Filter */}
      {spaces && spaces.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Space
          </label>
          <select
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Spaces</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "PENDING"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "APPROVED"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "ALL"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            All Bookings
          </button>
        </nav>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              No {activeTab.toLowerCase()} bookings found
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Space Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.space.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.space.address}, {booking.space.city}
                    </p>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Date & Time</p>
                      <p className="text-gray-900">
                        {format(new Date(booking.startDateTime), "PPP")}
                      </p>
                      <p className="text-gray-600">
                        {format(new Date(booking.startDateTime), "p")} -{" "}
                        {format(new Date(booking.endDateTime), "p")}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Booking Info</p>
                      <p className="text-gray-900">
                        {booking.attendeeCount} attendees
                      </p>
                      {booking.eventType && (
                        <p className="text-gray-600">{booking.eventType}</p>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Customer</p>
                      {booking.companyName && (
                        <p className="text-gray-900">{booking.companyName}</p>
                      )}
                      <p className="text-gray-600">
                        Booked {format(new Date(booking.createdAt), "PP")}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Total</p>
                      <p className="text-gray-900 text-lg font-semibold">
                        ${booking.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-gray-600">
                        {booking.totalHours} hours @ ${booking.hourlyRate}/hr
                      </p>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">
                        Special Requests:
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {booking.specialRequests}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="ml-6">{getStatusBadge(booking.status)}</div>
              </div>

              {/* Action Buttons */}
              {booking.status === "PENDING" && (
                <div className="mt-6 flex gap-3 border-t pt-4">
                  <button
                    onClick={() => handleApprove(booking.id)}
                    disabled={isLoading === booking.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isLoading === booking.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt(
                        "Reason for rejection (optional):"
                      );
                      if (reason !== null) {
                        handleReject(booking.id, reason);
                      }
                    }}
                    disabled={isLoading === booking.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isLoading === booking.id ? "Processing..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
