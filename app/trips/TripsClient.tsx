// app/trips/TripsClient.tsx
"use client";
import { useRouter } from "next/navigation";
import Container from "../components/Container";
import Heading from "../components/Heading";
import { SafeBooking, SafeUser } from "../types";
import { useCallback, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import SpaceCard from "../components/spaces/SpaceCard";

interface TripsClientProps {
  bookings: SafeBooking[];
  currentUser?: SafeUser | null;
}

const TripsClient: React.FC<TripsClientProps> = ({ bookings, currentUser }) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState("");

  const onCancel = useCallback(
    (id: string) => {
      setDeletingId(id);
      axios
        .delete(`/api/bookings/${id}`)
        .then(() => {
          toast.success("Booking cancelled");
          router.refresh();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.error);
        })
        .finally(() => {
          setDeletingId("");
        });
    },
    [router]
  );

  return (
    <Container>
      <Heading
        title="My Bookings"
        subtitle="Where you've been and where you're going"
      />
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {bookings.map((booking) =>
          booking.space ? (
            <SpaceCard
              key={booking.id}
              data={booking.space}
              booking={booking}
              actionId={booking.id}
              onAction={onCancel}
              disabled={deletingId === booking.id}
              actionLabel="Cancel Booking"
              currentUser={currentUser}
            />
          ) : null
        )}
      </div>
    </Container>
  );
};

export default TripsClient;
