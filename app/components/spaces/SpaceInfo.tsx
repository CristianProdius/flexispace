"use client";

import useCountries from "@/app/hooks/useCountries";
import { SafeUser, CancellationPolicy, DayOfWeek } from "@/app/types";
import { IconType } from "react-icons";
import Avatar from "../Avatar";
import ListingCategory from "./ListingCategory";
import dynamic from "next/dynamic";
import { BusinessHour } from "@prisma/client";

const Map = dynamic(() => import("../Map"), { ssr: false });

interface SpaceInfoProps {
  user: SafeUser;
  description: string;
  capacity: number;
  minCapacity: number;
  squareFootage?: number | null;
  amenities?: string[] | null;
  equipment?: string[] | null;
  businessHours?: BusinessHour[] | null;
  rules?: string[] | null;
  cancellationPolicy: CancellationPolicy;
  category:
    | {
        icon: IconType;
        label: string;
        description: string;
      }
    | undefined;
  locationValue?: string;
}

const SpaceInfo: React.FC<SpaceInfoProps> = ({
  user,
  description,
  capacity,
  minCapacity,
  squareFootage,
  amenities,
  equipment,
  businessHours,
  rules,
  cancellationPolicy,
  category,
  locationValue,
}) => {
  const { getByValue } = useCountries();
  const coordinates = locationValue
    ? getByValue(locationValue)?.latlng
    : undefined;

  const formatBusinessHours = (hours: BusinessHour[]) => {
    const daysOrder: DayOfWeek[] = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    return hours
      .sort(
        (a, b) =>
          daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek)
      )
      .map((hour) => ({
        day: hour.dayOfWeek.charAt(0) + hour.dayOfWeek.slice(1).toLowerCase(),
        open: hour.openTime,
        close: hour.closeTime,
        isClosed: hour.isClosed,
      }));
  };

  const getCancellationPolicyText = (policy: CancellationPolicy) => {
    switch (policy) {
      case "FLEXIBLE":
        return "Free cancellation up to 24 hours before the booking";
      case "MODERATE":
        return "Free cancellation up to 48 hours before the booking";
      case "STRICT":
        return "Free cancellation up to 7 days before the booking";
      case "SUPER_STRICT":
        return "Free cancellation up to 30 days before the booking";
      default:
        return "Contact host for cancellation policy";
    }
  };

  return (
    <div className="col-span-4 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="text-xl font-semibold flex flex-row items-center gap-2">
          <div>Space provided by {user?.name}</div>
          <Avatar src={user?.image} />
        </div>
        <div className="flex flex-row items-center gap-4 font-light text-neutral-500">
          <div>
            {minCapacity}-{capacity} attendees
          </div>
          {squareFootage && <div>{squareFootage} sq ft</div>}
        </div>
      </div>

      <hr />

      {category && (
        <>
          <ListingCategory
            icon={category.icon}
            label={category.label}
            description={category.description}
          />
          <hr />
        </>
      )}

      <div className="text-lg font-light text-neutral-500">{description}</div>

      {amenities && amenities.length > 0 && (
        <>
          <hr />
          <div>
            <h3 className="text-lg font-semibold mb-2">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((amenity, index) => (
                <div key={index} className="text-neutral-600">
                  • {amenity}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {equipment && equipment.length > 0 && (
        <>
          <hr />
          <div>
            <h3 className="text-lg font-semibold mb-2">Equipment</h3>
            <div className="grid grid-cols-2 gap-2">
              {equipment.map((item, index) => (
                <div key={index} className="text-neutral-600">
                  • {item}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {businessHours && businessHours.length > 0 && (
        <>
          <hr />
          <div>
            <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
            <div className="space-y-1">
              {formatBusinessHours(businessHours).map((hour) => (
                <div
                  key={hour.day}
                  className="flex justify-between text-neutral-600"
                >
                  <span>{hour.day}</span>
                  <span>
                    {hour.isClosed ? "Closed" : `${hour.open} - ${hour.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {rules && rules.length > 0 && (
        <>
          <hr />
          <div>
            <h3 className="text-lg font-semibold mb-2">Space Rules</h3>
            <ul className="space-y-1">
              {rules.map((rule, index) => (
                <li key={index} className="text-neutral-600">
                  • {rule}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <hr />
      <div>
        <h3 className="text-lg font-semibold mb-2">Cancellation Policy</h3>
        <p className="text-neutral-600">
          {getCancellationPolicyText(cancellationPolicy)}
        </p>
      </div>

      {locationValue && coordinates && (
        <>
          <hr />
          <Map center={coordinates} />
        </>
      )}
    </div>
  );
};

export default SpaceInfo;
