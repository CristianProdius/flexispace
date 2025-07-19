import {
  Space,
  Booking,
  User,
  PricingTier,
  Review,
  BusinessHour,
  Invoice,
  SpaceType,
  PricingType,
  BookingStatus,
  PaymentStatus,
  CancellationPolicy,
  UserType,
  DayOfWeek,
  InvoiceStatus,
} from "@prisma/client";

// Safe types that convert Date objects to strings for client-side usage
export type SafeSpace = Omit<Space, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeBooking = Omit<
  Booking,
  "createdAt" | "updatedAt" | "startDateTime" | "endDateTime"
> & {
  createdAt: string;
  updatedAt: string;
  startDateTime: string;
  endDateTime: string;
  space?: SafeSpace;
  invoice?: SafeInvoice | undefined;
  review?: SafeReview | null;
};

export type SafeUser = Omit<
  User,
  "createdAt" | "updatedAt" | "emailVerified"
> & {
  createdAt: string;
  updatedAt: string;
  emailVerified?: string | null;
};

export type SafePricingTier = Omit<PricingTier, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeReview = Omit<Review, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  user?: SafeUser;
};

export type SafeInvoice = Omit<Invoice, "issuedAt" | "dueDate" | "paidAt"> & {
  issuedAt: string;
  dueDate: string;
  paidAt?: string | null;
};

export type SafeInvoiceWithBooking = SafeInvoice & {
  booking: SafeBookingWithSpace;
  isIncoming?: boolean;
  isOutgoing?: boolean;
};

// Extended types with relations
export type SafeSpaceWithRelations = SafeSpace & {
  user: SafeUser;
  pricing?: SafePricingTier[];
  businessHours?: BusinessHour[];
  reviews?: SafeReview[];
};

export type SafeBookingWithSpace = SafeBooking & {
  space: SafeSpace;
  invoice?: SafeInvoice;
};

// Form/Search parameter interfaces
export interface ISpaceParams {
  userId?: string;
  capacity?: number;
  minCapacity?: number;
  spaceType?: SpaceType;
  category?: string;
  startDateTime?: string;
  endDateTime?: string;
  locationValue?: string;
  city?: string;
  instantBooking?: boolean;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  pricingType?: PricingType;
}

export interface IBookingParams {
  spaceId?: string;
  userId?: string;
  providerId?: string;
  status?: BookingStatus;
  startDateTime?: string;
  endDateTime?: string;
}

// Component prop interfaces
export interface SpaceCardProps {
  data: SafeSpace;
  booking?: SafeBooking;
  onAction?: (id: string) => void;
  disabled?: boolean;
  actionLabel?: string;
  actionId?: string;
  currentUser?: SafeUser | null;
}

export interface BookingFormData {
  spaceId: string;
  startDateTime: Date;
  endDateTime: Date;
  attendeeCount: number;
  eventType?: string;
  companyName?: string;
  specialRequests?: string;
  pricingType: PricingType;
  addons?: string[];
}

// Enums re-exports for convenience
export {
  SpaceType,
  PricingType,
  BookingStatus,
  PaymentStatus,
  CancellationPolicy,
  UserType,
  DayOfWeek,
  InvoiceStatus,
};

// Backward compatibility types (to be removed after full migration)
export type SafeListing = SafeSpace;
export type SafeReservation = SafeBooking;
export type TimeSlot = {
  start: string; // "09:00"
  end: string; // "17:00"
  available: boolean;
};

export type DateTimeRange = {
  startDateTime: Date;
  endDateTime: Date;
};

export type PriceCalculation = {
  basePrice: number;
  hours: number;
  subtotal: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxes: number;
  total: number;
  pricingType: PricingType;
};
