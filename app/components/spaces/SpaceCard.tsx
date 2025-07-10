// app/components/spaces/SpaceCard.tsx
"use client";
import useCountries from "@/app/hooks/useCountries";
import { SafeSpace, SafeBooking, SafeUser } from "@/app/types";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { format } from "date-fns";
import Image from "next/image";
import HeartButton from "../HeartButton";
import Button from "../Button";

interface SpaceCardProps {
  data: SafeSpace;
  booking?: SafeBooking;
  onAction?: (id: string) => void;
  disabled?: boolean;
  actionLabel?: string;
  actionId?: string;
  currentUser?: SafeUser | null;
}

const SpaceCard: React.FC<SpaceCardProps> = ({
  data,
  booking,
  onAction,
  disabled,
  actionLabel,
  actionId = "",
  currentUser,
}) => {
  const router = useRouter();
  const { getByValue } = useCountries();
  const location = getByValue(data.locationValue);

  const handleCancel = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (disabled) return;

      onAction?.(actionId);
    },
    [onAction, actionId, disabled]
  );

  // Get base price (hourly rate) - this would come from pricing data in real implementation
  const price = useMemo(() => {
    if (booking) {
      return booking.totalPrice;
    }
    // Return a base price - in production this would come from data.pricing
    return (data as any).price || 50; // Default hourly rate
  }, [booking, data]);

  const bookingDate = useMemo(() => {
    if (!booking) {
      return null;
    }

    const start = new Date(booking.startDateTime);
    const end = new Date(booking.endDateTime);

    return `${format(start, "MMM dd")} • ${format(start, "h:mm a")} - ${format(
      end,
      "h:mm a"
    )}`;
  }, [booking]);

  return (
    <div
      onClick={() => router.push(`/spaces/${data.id}`)}
      className="col-span-1 cursor-pointer group"
    >
      <div className="flex flex-col gap-2 w-full">
        <div className="aspect-square w-full relative overflow-hidden rounded-xl">
          <Image
            alt="Space"
            src={data.imageSrc}
            className="object-cover h-full w-full group-hover:scale-110 transition"
            fill
          />
          <div className="absolute top-3 right-3">
            <HeartButton spaceId={data.id} currentUser={currentUser} />
          </div>
        </div>
        <div className="font-semibold text-lg">
          {data.title || `${location?.region}, ${location?.label}`}
        </div>
        <div className="font-light text-neutral-500">
          {bookingDate || data.category}
        </div>
        <div className="flex flex-row items-center gap-1">
          <div className="font-semibold">${price}</div>
          {!booking && <div className="font-light">per hour</div>}
        </div>
        {data.capacity && (
          <div className="text-sm text-neutral-500">
            Up to {data.capacity} people
          </div>
        )}
        {onAction && actionLabel && (
          <Button
            disabled={disabled}
            small
            label={actionLabel}
            onClick={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default SpaceCard;
