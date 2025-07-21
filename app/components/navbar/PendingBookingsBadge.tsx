"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface PendingBookingsBadgeProps {
  userId: string;
}

const PendingBookingsBadge: React.FC<PendingBookingsBadgeProps> = ({
  userId,
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await axios.get("/api/bookings/pending-count");
        setPendingCount(response.data.count);
      } catch (error) {
        console.error("Error fetching pending bookings count:", error);
      }
    };

    fetchPendingCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  if (pendingCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
      {pendingCount}
    </span>
  );
};

export default PendingBookingsBadge;
