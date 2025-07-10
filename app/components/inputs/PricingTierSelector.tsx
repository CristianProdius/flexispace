// app/components/inputs/PricingTierSelector.tsx
"use client";

import { PricingType } from "@prisma/client";
import { useState } from "react";
import { FaClock } from "@react-icons/all-files/fa/FaClock";
import { FaCalendarDay } from "@react-icons/all-files/fa/FaCalendarDay";
import { FaCalendarWeek } from "@react-icons/all-files/fa/FaCalendarWeek";
import { FaCalendarAlt } from "@react-icons/all-files/fa/FaCalendarAlt";

interface PricingTier {
  pricingType: PricingType;
  price: number;
  currency?: string;
  cleaningFee?: number;
  serviceFee?: number;
  overtimeFee?: number;
}

interface PricingTierSelectorProps {
  pricing: PricingTier[];
  selectedType: PricingType;
  onSelectType: (type: PricingType) => void;
  totalHours?: number;
  className?: string;
}

const pricingIcons = {
  HOURLY: FaClock,
  DAILY: FaCalendarDay,
  WEEKLY: FaCalendarWeek,
  MONTHLY: FaCalendarAlt,
  EVENT_PACKAGE: FaCalendarAlt,
};

const pricingLabels = {
  HOURLY: "Hourly",
  DAILY: "Daily (8 hours)",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  EVENT_PACKAGE: "Event Package",
};

const PricingTierSelector: React.FC<PricingTierSelectorProps> = ({
  pricing,
  selectedType,
  onSelectType,
  totalHours = 1,
  className = "",
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const calculatePrice = (tier: PricingTier) => {
    let basePrice = tier.price;

    switch (tier.pricingType) {
      case PricingType.HOURLY:
        basePrice = tier.price * totalHours;
        break;
      case PricingType.DAILY:
        const days = Math.ceil(totalHours / 8);
        basePrice = tier.price * days;
        break;
      case PricingType.WEEKLY:
        const weeks = Math.ceil(totalHours / 40);
        basePrice = tier.price * weeks;
        break;
      case PricingType.MONTHLY:
        const months = Math.ceil(totalHours / 160);
        basePrice = tier.price * months;
        break;
      default:
        basePrice = tier.price;
    }

    return basePrice;
  };

  const calculateSavings = (tier: PricingTier) => {
    const hourlyTier = pricing.find(
      (p) => p.pricingType === PricingType.HOURLY
    );
    if (!hourlyTier || tier.pricingType === PricingType.HOURLY) return 0;

    const hourlyTotal = hourlyTier.price * totalHours;
    const tierTotal = calculatePrice(tier);
    const savings = hourlyTotal - tierTotal;

    return savings > 0 ? savings : 0;
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Select Pricing Option</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? "Hide" : "Show"} details
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pricing.map((tier) => {
          const Icon = pricingIcons[tier.pricingType] || FaClock;
          const isSelected = selectedType === tier.pricingType;
          const savings = calculateSavings(tier);
          const totalPrice = calculatePrice(tier);

          return (
            <div
              key={tier.pricingType}
              onClick={() => onSelectType(tier.pricingType)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }
              `}
            >
              {/* Best Value Badge */}
              {savings > 50 && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                  Save {formatCurrency(savings)}
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isSelected ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {pricingLabels[tier.pricingType]}
                  </h4>

                  <div className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(tier.price, tier.currency)}
                    </span>
                    <span className="text-gray-600 text-sm ml-1">
                      /{tier.pricingType.toLowerCase()}
                    </span>
                  </div>

                  {totalHours > 1 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Total: {formatCurrency(totalPrice, tier.currency)}
                    </p>
                  )}

                  {showDetails && (
                    <div className="mt-3 space-y-1 text-sm">
                      {tier.cleaningFee && tier.cleaningFee > 0 && (
                        <p className="text-gray-600">
                          + {formatCurrency(tier.cleaningFee)} cleaning fee
                        </p>
                      )}
                      {tier.serviceFee && tier.serviceFee > 0 && (
                        <p className="text-gray-600">
                          + {formatCurrency(tier.serviceFee)} service fee
                        </p>
                      )}
                      {tier.overtimeFee && tier.overtimeFee > 0 && (
                        <p className="text-gray-600">
                          Overtime: {formatCurrency(tier.overtimeFee)}/hour
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Summary */}
      {showDetails && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Pricing Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Selected option:</span>
              <span className="font-medium">{pricingLabels[selectedType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {totalHours} hour{totalHours > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Estimated total:</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  calculatePrice(
                    pricing.find((p) => p.pricingType === selectedType)!
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingTierSelector;
