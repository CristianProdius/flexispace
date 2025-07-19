// app/spaces/[spaceId]/SpaceClient.tsx
"use client";

import Container from "@/app/components/Container";
import SpaceHead from "@/app/components/spaces/SpaceHead";
import SpaceInfo from "@/app/components/spaces/SpaceInfo";
import SpaceBooking from "@/app/components/spaces/SpaceBooking";
import { categories } from "@/app/components/navbar/Categories";
import useLoginModal from "@/app/hooks/useLoginModal";
import { SafeSpace, SafeBooking, SafeUser, PricingType } from "@/app/types";
import axios from "axios";
import {
  differenceInHours,
  eachHourOfInterval,
  format,
  isWithinInterval,
} from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Range } from "react-date-range";
import { toast } from "react-hot-toast";

const initialDateRange = {
  startDate: new Date(),
  endDate: new Date(),
  key: "selection",
};

interface SpaceClientProps {
  bookings?: SafeBooking[];
  space: SafeSpace & {
    user: SafeUser;
    pricing: any[];
    businessHours: any[];
  };
  currentUser?: SafeUser | null;
}

const SpaceClient: React.FC<SpaceClientProps> = ({
  space,
  currentUser,
  bookings = [],
}) => {
  const loginModal = useLoginModal();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<Range>(initialDateRange);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [eventType, setEventType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>(
    PricingType.HOURLY
  );
  const [totalPrice, setTotalPrice] = useState(0);

  // Get the category details
  const category = useMemo(() => {
    return categories.find((item) => item.label === space.category);
  }, [space.category]);

  // Get pricing for selected type
  const selectedPricing = useMemo(() => {
    return (
      space.pricing.find((p) => p.pricingType === pricingType) ||
      space.pricing[0]
    );
  }, [space.pricing, pricingType]);

  // Calculate disabled time slots based on existing bookings
  const disabledTimeSlots = useMemo(() => {
    const slots: { [key: string]: string[] } = {};

    bookings.forEach((booking) => {
      if (booking.status === "CANCELLED" || booking.status === "REJECTED")
        return;

      const hours = eachHourOfInterval({
        start: new Date(booking.startDateTime),
        end: new Date(booking.endDateTime),
      });

      hours.forEach((hour) => {
        const dateKey = format(hour, "yyyy-MM-dd");
        const hourKey = format(hour, "HH:00");

        if (!slots[dateKey]) {
          slots[dateKey] = [];
        }
        slots[dateKey].push(hourKey);
      });
    });

    return slots;
  }, [bookings]);

  // Calculate total price based on selected hours and pricing
  useEffect(() => {
    if (!selectedPricing || selectedHours.length === 0) {
      setTotalPrice(0);
      return;
    }

    let basePrice = 0;
    const hourCount = selectedHours.length;

    switch (pricingType) {
      case PricingType.HOURLY:
        basePrice = selectedPricing.price * hourCount;
        break;
      case PricingType.DAILY:
        const days = Math.ceil(hourCount / 8);
        basePrice = selectedPricing.price * days;
        break;
      case PricingType.WEEKLY:
        const weeks = Math.ceil(hourCount / 40);
        basePrice = selectedPricing.price * weeks;
        break;
      case PricingType.MONTHLY:
        const months = Math.ceil(hourCount / 160);
        basePrice = selectedPricing.price * months;
        break;
      default:
        basePrice = selectedPricing.price * hourCount;
    }

    // Add additional fees
    if (selectedPricing.cleaningFee) {
      basePrice += selectedPricing.cleaningFee;
    }
    if (selectedPricing.serviceFee) {
      basePrice += selectedPricing.serviceFee;
    }

    setTotalPrice(basePrice);
  }, [selectedHours, selectedPricing, pricingType]);

  const onCreateBooking = useCallback(() => {
    if (!currentUser) {
      return loginModal.onOpen();
    }

    if (selectedHours.length === 0) {
      toast.error("Please select booking hours");
      return;
    }

    if (attendeeCount < space.minCapacity || attendeeCount > space.capacity) {
      toast.error(
        `Attendee count must be between ${space.minCapacity} and ${space.capacity}`
      );
      return;
    }

    setIsLoading(true);

    // Convert selected hours to start and end datetime
    const sortedHours = [...selectedHours].sort();
    const startDateTime = new Date(sortedHours[0]);
    const endDateTime = new Date(sortedHours[sortedHours.length - 1]);
    endDateTime.setHours(endDateTime.getHours() + 1); // Add 1 hour to get end time

    axios
      .post("/api/bookings", {
        spaceId: space.id,
        startDateTime,
        endDateTime,
        attendeeCount,
        eventType,
        companyName,
        specialRequests,
        pricingType,
        totalPrice,
      })
      .then(() => {
        toast.success("Space booked successfully!");
        setDateRange(initialDateRange);
        setSelectedHours([]);
        setAttendeeCount(1);
        setEventType("");
        setCompanyName("");
        setSpecialRequests("");
        router.push("/bookings");
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    currentUser,
    selectedHours,
    attendeeCount,
    space,
    eventType,
    companyName,
    specialRequests,
    pricingType,
    totalPrice,
    loginModal,
    router,
  ]);

  return (
    <Container>
      <div className="max-w-screen-lg mx-auto">
        <div className="flex flex-col gap-6">
          <SpaceHead
            title={space.title}
            imageSrc={space.imageSrc}
            locationValue={space.locationValue}
            id={space.id}
            currentUser={currentUser}
          />
          <div className="grid grid-cols-1 md:grid-cols-7 md:gap-10 mt-6">
            <SpaceInfo
              user={space.user}
              category={category}
              description={space.description}
              capacity={space.capacity}
              minCapacity={space.minCapacity}
              squareFootage={space.squareFootage}
              amenities={space.amenities}
              equipment={space.equipment}
              businessHours={space.businessHours}
              rules={space.rules}
              cancellationPolicy={space.cancellationPolicy}
            />
            <div className="order-first mb-10 md:order-last md:col-span-3">
              <SpaceBooking
                pricing={space.pricing}
                dateRange={dateRange}
                totalPrice={totalPrice}
                onChangeDate={(value) => setDateRange(value)}
                onSelectHours={setSelectedHours}
                selectedHours={selectedHours}
                disabledTimeSlots={disabledTimeSlots}
                businessHours={space.businessHours}
                disabled={isLoading}
                onSubmit={onCreateBooking}
                attendeeCount={attendeeCount}
                onChangeAttendeeCount={setAttendeeCount}
                maxCapacity={space.capacity}
                minCapacity={space.minCapacity}
                eventType={eventType}
                onChangeEventType={setEventType}
                companyName={companyName}
                onChangeCompanyName={setCompanyName}
                specialRequests={specialRequests}
                onChangeSpecialRequests={setSpecialRequests}
                pricingType={pricingType}
                onChangePricingType={setPricingType}
                instantBooking={space.instantBooking}
                requiresApproval={space.requiresApproval}
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default SpaceClient;
