// app/bookings/BookingsClient.tsx
"use client";

import axios from "axios";
import { toast } from "react-hot-toast";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SafeBooking, SafeUser, BookingStatus } from "../types";
import Heading from "../components/Heading";
import Container from "../components/Container";
import SpaceCard from "../components/spaces/SpaceCard";
import { format } from "date-fns";

interface BookingsClientProps {
  bookings: SafeBooking[];
  currentUser: SafeUser | null;
  isProvider?: boolean; // True if viewing as space provider
}

const BookingsClient: React.FC<BookingsClientProps> = ({
  bookings,
  currentUser,
  isProvider = false,
}) => {
  const router = useRouter();
  const [processingId, setProcessingId] = useState("");

  const onCancel = useCallback(
    (id: string) => {
      setProcessingId(id);

      axios
        .delete(`/api/bookings/${id}`)
        .then(() => {
          toast.success("Booking cancelled successfully");
          router.refresh();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.error || "Something went wrong");
        })
        .finally(() => {
          setProcessingId("");
        });
    },
    [router]
  );

  const onApprove = useCallback(
    (id: string) => {
      setProcessingId(id);

      axios
        .patch(`/api/bookings/${id}`, { status: BookingStatus.APPROVED })
        .then(() => {
          toast.success("Booking approved successfully");
          router.refresh();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.error || "Something went wrong");
        })
        .finally(() => {
          setProcessingId("");
        });
    },
    [router]
  );

  const onReject = useCallback(
    (id: string) => {
      setProcessingId(id);

      axios
        .patch(`/api/bookings/${id}`, { status: BookingStatus.REJECTED })
        .then(() => {
          toast.success("Booking rejected");
          router.refresh();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.error || "Something went wrong");
        })
        .finally(() => {
          setProcessingId("");
        });
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
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {status}
      </span>
    );
  };

  const getBookingInfo = (booking: SafeBooking) => {
    const start = new Date(booking.startDateTime);
    const end = new Date(booking.endDateTime);

    return (
      <div className="text-sm text-gray-600">
        <p className="font-semibold text-gray-900">
          {format(start, "MMM dd, yyyy")}
        </p>
        <p>
          {format(start, "h:mm a")} - {format(end, "h:mm a")}
        </p>
        <p className="mt-1">
          {booking.attendeeCount} attendee{booking.attendeeCount > 1 ? "s" : ""}
        </p>
        {booking.eventType && (
          <p className="mt-1 italic">{booking.eventType}</p>
        )}
        <p className="mt-2 font-semibold text-gray-900">
          ${booking.totalPrice.toFixed(2)}
        </p>
      </div>
    );
  };

  const groupedBookings = bookings.reduce((acc, booking) => {
    const status = booking.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(booking);
    return acc;
  }, {} as Record<BookingStatus, SafeBooking[]>);

  return (
    <Container>
      <Heading
        title={isProvider ? "Space Bookings" : "My Bookings"}
        subtitle={
          isProvider
            ? "Manage bookings for your spaces"
            : "View and manage your space bookings"
        }
      />

      {/* Status Tabs */}
      <div className="mt-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {Object.entries(groupedBookings).map(([status, statusBookings]) => (
            <button
              key={status}
              className="border-b-2 border-transparent pb-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              {status} ({statusBookings.length})
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings Grid */}
      {Object.entries(groupedBookings).map(([status, statusBookings]) => (
        <div key={status} className="mt-10">
          <h3 className="text-lg font-semibold mb-4">{status} Bookings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
            {statusBookings.map((booking) => (
              <div key={booking.id} className="col-span-1">
                {booking.space && (
                  <SpaceCard
                    data={booking.space}
                    disabled={processingId === booking.id}
                    currentUser={currentUser}
                  />
                )}
                <div className="mt-2 p-4 border rounded-lg">
                  {getStatusBadge(booking.status)}
                  <div className="mt-2">{getBookingInfo(booking)}</div>

                  {/* Booking Actions */}
                  <div className="mt-4 space-y-2">
                    {isProvider && booking.status === BookingStatus.PENDING && (
                      <>
                        <button
                          onClick={() => onApprove(booking.id)}
                          disabled={processingId === booking.id}
                          className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(booking.id)}
                          disabled={processingId === booking.id}
                          className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {booking.status === BookingStatus.APPROVED &&
                      new Date(booking.startDateTime) > new Date() && (
                        <button
                          onClick={() => onCancel(booking.id)}
                          disabled={processingId === booking.id}
                          className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          Cancel Booking
                        </button>
                      )}

                    {booking.invoice && (
                      <button
                        onClick={() =>
                          booking.invoice &&
                          router.push(`/invoices/${booking.invoice.id}`)
                        }
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View Invoice
                      </button>
                    )}

                    {booking.status === BookingStatus.COMPLETED &&
                      !booking.review && (
                        <button
                          onClick={() =>
                            router.push(`/bookings/${booking.id}/review`)
                          }
                          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Leave Review
                        </button>
                      )}
                  </div>

                  {/* Additional Booking Details */}
                  {(booking.companyName || booking.specialRequests) && (
                    <div className="mt-4 pt-4 border-t text-sm">
                      {booking.companyName && (
                        <p className="text-gray-600">
                          <span className="font-medium">Company:</span>{" "}
                          {booking.companyName}
                        </p>
                      )}
                      {booking.specialRequests && (
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Special Requests:</span>
                          <br />
                          {booking.specialRequests}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {bookings.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-gray-500">No bookings found</p>
          {!isProvider && (
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Spaces
            </button>
          )}
        </div>
      )}
    </Container>
  );
};

export default BookingsClient;
