// app/components/inputs/TimeSlotPicker.tsx
"use client";

import {
  format,
  addHours,
  isSameDay,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { BusinessHour, DayOfWeek } from "@prisma/client";
import { useMemo } from "react";

interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedSlots: string[];
  onSelectSlots: (slots: string[]) => void;
  disabledSlots: { [key: string]: string[] };
  businessHours: BusinessHour[];
  minBookingHours?: number;
  maxBookingHours?: number;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  selectedSlots,
  onSelectSlots,
  disabledSlots,
  businessHours,
  minBookingHours = 1,
  maxBookingHours,
}) => {
  const dayOfWeek = format(selectedDate, "EEEE").toUpperCase() as DayOfWeek;
  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // Get business hours for selected day
  const todayHours = useMemo(() => {
    return businessHours.find((bh) => bh.dayOfWeek === dayOfWeek);
  }, [businessHours, dayOfWeek]);

  // Generate available time slots
  const timeSlots = useMemo(() => {
    if (!todayHours || todayHours.isClosed) {
      return [];
    }

    const slots: { time: string; display: string; available: boolean }[] = [];
    const [openHour, openMinute] = todayHours.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = todayHours.closeTime
      .split(":")
      .map(Number);

    const openTime = new Date(selectedDate);
    openTime.setHours(openHour, openMinute, 0, 0);

    const closeTime = new Date(selectedDate);
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    let currentTime = openTime;
    const now = new Date();

    while (isBefore(currentTime, closeTime)) {
      const slotKey = format(currentTime, "yyyy-MM-dd'T'HH:mm:ss");
      const hourKey = format(currentTime, "HH:00");

      // Check if slot is available
      const isPast = isBefore(currentTime, now);
      const isDisabled = disabledSlots[dateKey]?.includes(hourKey);
      const available = !isPast && !isDisabled;

      slots.push({
        time: slotKey,
        display: format(currentTime, "h:mm a"),
        available,
      });

      currentTime = addHours(currentTime, 1);
    }

    return slots;
  }, [selectedDate, todayHours, disabledSlots, dateKey]);

  const handleSlotClick = (slotTime: string) => {
    const isSelected = selectedSlots.includes(slotTime);

    if (isSelected) {
      // Deselect
      onSelectSlots(selectedSlots.filter((s) => s !== slotTime));
    } else {
      // Select - check if consecutive
      if (selectedSlots.length === 0) {
        onSelectSlots([slotTime]);
      } else {
        // For simplicity, we'll allow selecting multiple slots
        // In production, you might want to enforce consecutive slots
        const newSlots = [...selectedSlots, slotTime].sort();

        // Check max booking hours
        if (maxBookingHours && newSlots.length > maxBookingHours) {
          return;
        }

        onSelectSlots(newSlots);
      }
    }
  };

  const getSlotClassName = (slot: { time: string; available: boolean }) => {
    const baseClass =
      "p-3 text-center rounded-lg cursor-pointer transition-all text-sm font-medium";

    if (!slot.available) {
      return `${baseClass} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    if (selectedSlots.includes(slot.time)) {
      return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
    }

    return `${baseClass} bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50`;
  };

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No available time slots for this date</p>
        {todayHours?.isClosed && (
          <p className="text-sm mt-2">
            Space is closed on {dayOfWeek.toLowerCase()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">
          Select Time Slots for {format(selectedDate, "MMMM d, yyyy")}
        </h3>
        {selectedSlots.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedSlots.length} hour{selectedSlots.length > 1 ? "s" : ""}{" "}
            selected
          </span>
        )}
      </div>

      {minBookingHours > 1 && (
        <p className="text-sm text-gray-600">
          Minimum booking: {minBookingHours} hours
        </p>
      )}

      <div className="grid grid-cols-4 gap-2">
        {timeSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => slot.available && handleSlotClick(slot.time)}
            disabled={!slot.available}
            className={getSlotClassName(slot)}
          >
            {slot.display}
          </button>
        ))}
      </div>

      {selectedSlots.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Selected: {format(parseISO(selectedSlots[0]), "h:mm a")} -{" "}
            {format(
              addHours(parseISO(selectedSlots[selectedSlots.length - 1]), 1),
              "h:mm a"
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
