// app/components/spaces/SpaceBooking.tsx
"use client";

import { Range } from "react-date-range";
import Calendar from "../inputs/Calendar";
import Button from "../Button";
import TimeSlotPicker from "../inputs/TimeSlotPicker";
import PricingTierSelector from "../inputs/PricingTierSelector";
import BusinessHoursDisplay from "./BusinessHoursDisplay";
import { PricingType, BusinessHour } from "@prisma/client";
import Counter from "../inputs/Counter";

interface SpaceBookingProps {
  pricing: any[];
  dateRange: Range;
  totalPrice: number;
  onChangeDate: (value: Range) => void;
  onSelectHours: (hours: string[]) => void;
  selectedHours: string[];
  disabledTimeSlots: { [key: string]: string[] };
  businessHours: BusinessHour[];
  disabled?: boolean;
  onSubmit: () => void;
  attendeeCount: number;
  onChangeAttendeeCount: (value: number) => void;
  maxCapacity: number;
  minCapacity: number;
  eventType: string;
  onChangeEventType: (value: string) => void;
  companyName: string;
  onChangeCompanyName: (value: string) => void;
  specialRequests: string;
  onChangeSpecialRequests: (value: string) => void;
  pricingType: PricingType;
  onChangePricingType: (type: PricingType) => void;
  instantBooking: boolean;
  requiresApproval: boolean;
}

const SpaceBooking: React.FC<SpaceBookingProps> = ({
  pricing,
  dateRange,
  totalPrice,
  onChangeDate,
  onSelectHours,
  selectedHours,
  disabledTimeSlots,
  businessHours,
  disabled,
  onSubmit,
  attendeeCount,
  onChangeAttendeeCount,
  maxCapacity,
  minCapacity,
  eventType,
  onChangeEventType,
  companyName,
  onChangeCompanyName,
  specialRequests,
  onChangeSpecialRequests,
  pricingType,
  onChangePricingType,
  instantBooking,
  requiresApproval,
}) => {
  return (
    <div className="bg-white rounded-xl border-[1px] border-neutral-200 overflow-hidden">
      <div className="p-4 border-b">
        <BusinessHoursDisplay businessHours={businessHours} />
      </div>

      <div className="p-4">
        {/* Pricing Selector */}
        <PricingTierSelector
          pricing={pricing}
          selectedType={pricingType}
          onSelectType={onChangePricingType}
          totalHours={selectedHours.length}
          className="mb-6"
        />

        <hr className="my-6" />

        {/* Date Selection */}
        <Calendar
          value={dateRange}
          onChange={(value) => onChangeDate(value.selection)}
          disabledDates={[]} // We'll handle time-based availability
        />

        <hr className="my-6" />

        {/* Time Slot Selection */}
        {dateRange.startDate && (
          <TimeSlotPicker
            selectedDate={dateRange.startDate}
            selectedSlots={selectedHours}
            onSelectSlots={onSelectHours}
            disabledSlots={disabledTimeSlots}
            businessHours={businessHours}
          />
        )}

        <hr className="my-6" />

        {/* Attendee Count */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold">Number of Attendees</h3>
              <p className="text-sm text-gray-600">
                Capacity: {minCapacity} - {maxCapacity} people
              </p>
            </div>
          </div>
          <Counter
            title=""
            subTitle=""
            value={attendeeCount}
            onChange={onChangeAttendeeCount}
          />
        </div>

        <hr className="my-6" />

        {/* Event Details */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="eventType"
              className="text-sm font-semibold block mb-2"
            >
              Event Type (Optional)
            </label>
            <input
              id="eventType"
              type="text"
              value={eventType}
              onChange={(e) => onChangeEventType(e.target.value)}
              placeholder="e.g., Team Meeting, Workshop, Conference"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="text-sm font-semibold block mb-2"
            >
              Company Name (Optional)
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => onChangeCompanyName(e.target.value)}
              placeholder="Your company name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="specialRequests"
              className="text-sm font-semibold block mb-2"
            >
              Special Requests (Optional)
            </label>
            <textarea
              id="specialRequests"
              value={specialRequests}
              onChange={(e) => onChangeSpecialRequests(e.target.value)}
              placeholder="Any special requirements or requests..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        <hr className="my-6" />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Selected hours</span>
            <span>{selectedHours.length}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            disabled={disabled || selectedHours.length === 0}
            label={
              requiresApproval
                ? "Request to Book"
                : instantBooking
                ? "Book Now"
                : "Reserve"
            }
            onClick={onSubmit}
          />
        </div>

        {/* Booking Info */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {requiresApproval && (
            <p>This space requires approval from the host</p>
          )}
          {instantBooking && !requiresApproval && (
            <p>✓ Instant booking available</p>
          )}
          <p className="mt-2">You won't be charged yet</p>
        </div>
      </div>
    </div>
  );
};

export default SpaceBooking;
