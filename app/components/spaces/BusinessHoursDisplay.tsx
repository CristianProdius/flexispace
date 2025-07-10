// app/components/spaces/BusinessHoursDisplay.tsx
"use client";

import { BusinessHour, DayOfWeek } from "@prisma/client";
import { format, parse } from "date-fns";

interface BusinessHoursDisplayProps {
  businessHours: BusinessHour[];
  className?: string;
}

const dayOrder: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const BusinessHoursDisplay: React.FC<BusinessHoursDisplayProps> = ({
  businessHours,
  className = "",
}) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const getDayDisplay = (day: DayOfWeek) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  const isToday = (day: DayOfWeek) => {
    const today = format(new Date(), "EEEE").toUpperCase();
    return today === day;
  };

  const isOpen24Hours = (hours: BusinessHour) => {
    return hours.openTime === "00:00" && hours.closeTime === "23:59";
  };

  // Group consecutive days with same hours
  const groupedHours = () => {
    const groups: Array<{
      days: DayOfWeek[];
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }> = [];

    dayOrder.forEach((day) => {
      const dayHours = businessHours.find((bh) => bh.dayOfWeek === day);
      if (!dayHours) return;

      const lastGroup = groups[groups.length - 1];

      if (
        lastGroup &&
        lastGroup.openTime === dayHours.openTime &&
        lastGroup.closeTime === dayHours.closeTime &&
        lastGroup.isClosed === dayHours.isClosed
      ) {
        lastGroup.days.push(day);
      } else {
        groups.push({
          days: [day],
          openTime: dayHours.openTime,
          closeTime: dayHours.closeTime,
          isClosed: dayHours.isClosed,
        });
      }
    });

    return groups;
  };

  const formatDayRange = (days: DayOfWeek[]) => {
    if (days.length === 1) {
      return getDayDisplay(days[0]);
    } else if (days.length === 2) {
      return `${getDayDisplay(days[0])} & ${getDayDisplay(days[1])}`;
    } else {
      return `${getDayDisplay(days[0])} - ${getDayDisplay(
        days[days.length - 1]
      )}`;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="font-semibold text-gray-900">Business Hours</h3>

      {/* Grouped display for compact view */}
      <div className="space-y-1">
        {groupedHours().map((group, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{formatDayRange(group.days)}</span>
            <span className="font-medium text-gray-900">
              {group.isClosed
                ? "Closed"
                : isOpen24Hours({
                    ...group,
                    dayOfWeek: group.days[0],
                    id: "",
                    spaceId: "",
                  })
                ? "24 Hours"
                : `${formatTime(group.openTime)} - ${formatTime(
                    group.closeTime
                  )}`}
            </span>
          </div>
        ))}
      </div>

      {/* Current status indicator */}
      <div className="pt-2 border-t">
        {(() => {
          const now = new Date();
          const currentDay = format(now, "EEEE").toUpperCase() as DayOfWeek;
          const todayHours = businessHours.find(
            (bh) => bh.dayOfWeek === currentDay
          );

          if (!todayHours || todayHours.isClosed) {
            return (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600 font-medium">
                  Closed now
                </span>
              </div>
            );
          }

          const [openHour, openMinute] = todayHours.openTime
            .split(":")
            .map(Number);
          const [closeHour, closeMinute] = todayHours.closeTime
            .split(":")
            .map(Number);

          const openTime = new Date();
          openTime.setHours(openHour, openMinute, 0, 0);

          const closeTime = new Date();
          closeTime.setHours(closeHour, closeMinute, 0, 0);

          const isOpenNow = now >= openTime && now <= closeTime;

          if (isOpenNow) {
            return (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  Open now • Closes at {formatTime(todayHours.closeTime)}
                </span>
              </div>
            );
          } else if (now < openTime) {
            return (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-600 font-medium">
                  Opens at {formatTime(todayHours.openTime)}
                </span>
              </div>
            );
          } else {
            return (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600 font-medium">
                  Closed now
                </span>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default BusinessHoursDisplay;
