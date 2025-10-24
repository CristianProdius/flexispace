"use client";

import axios from "axios";
import { toast } from "react-hot-toast";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import useRentModal from "@/app/hooks/useRentModal";

import Modal from "./Modal";
import Counter from "../inputs/Counter";
import CategoryInput from "../inputs/CategoryInput";
import CountrySelect from "../inputs/CountrySelect";
import { categories } from "../navbar/Categories";
import ImageUpload from "../inputs/ImageUpload";
import Input from "../inputs/Input";
import Heading from "../Heading";

enum STEPS {
  CATEGORY = 0,
  LOCATION = 1,
  INFO = 2,
  IMAGES = 3,
  DESCRIPTION = 4,
  PRICE = 5,
}

// Define space types based on your Prisma schema
const SPACE_TYPES = {
  WORKSPACE: "WORKSPACE",
  EVENT_VENUE: "EVENT_VENUE",
};

// Define pricing types
const PRICING_TYPES = {
  HOURLY: "HOURLY",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
};

// Define days of week
const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const RentModal = () => {
  const router = useRouter();
  const rentModal = useRentModal();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(STEPS.CATEGORY);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      category: "",
      location: null,
      address: "",
      city: "",
      state: "",
      postalCode: "",
      capacity: 10,
      minCapacity: 1,
      roomCount: 1,
      squareFootage: "",
      imageSrc: "",
      images: [],
      hourlyPrice: 50,
      dailyPrice: 400,
      title: "",
      description: "",
      instantBooking: false,
      spaceType: SPACE_TYPES.WORKSPACE,
    },
  });

  const location = watch("location");
  const category = watch("category");
  const capacity = watch("capacity");
  const minCapacity = watch("minCapacity");
  const roomCount = watch("roomCount");
  const imageSrc = watch("imageSrc");
  const spaceType = watch("spaceType");
  const address = watch("address");
  const city = watch("city");

  const Map = useMemo(
    () =>
      dynamic(() => import("../Map"), {
        ssr: false,
      }),
    []
  );

  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onBack = () => {
    setStep((value) => value - 1);
  };

  const onNext = () => {
    // Validate current step before moving forward
    if (step === STEPS.LOCATION) {
      const currentLocation = watch("location");
      const currentAddress = watch("address");
      const currentCity = watch("city");

      if (!currentLocation) {
        toast.error("Please select a location");
        return;
      }

      if (!currentAddress || !currentCity) {
        toast.error("Please fill in all address fields");
        return;
      }
    }

    setStep((value) => value + 1);
  };

  // Helper function to determine space type from category
  const getSpaceTypeFromCategory = (category: string): string => {
    // Map categories to either WORKSPACE or EVENT_VENUE
    const workspaceCategories = [
      "Private Office",
      "Meeting Room",
      "Conference Room",
      "Coworking Desk",
      "Open Workspace",
      "Workshop Room",
      "Seminar Room",
      "Executive Suite",
    ];

    const eventVenueCategories = [
      "Wedding Venue",
      "Conference Hall",
      "Banquet Hall",
      "Party Space",
      "Exhibition Space",
    ];

    let spaceType = SPACE_TYPES.WORKSPACE; // Default

    if (workspaceCategories.includes(category)) {
      spaceType = SPACE_TYPES.WORKSPACE;
    } else if (eventVenueCategories.includes(category)) {
      spaceType = SPACE_TYPES.EVENT_VENUE;
    }

    return spaceType;
  };

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    if (step !== STEPS.PRICE) {
      return onNext();
    }

    // Validate required fields before submission
    if (!data.address || !data.city || !data.location) {
      toast.error("Please complete all location details");
      setStep(STEPS.LOCATION);
      return;
    }

    setIsLoading(true);

    // Create default business hours (9 AM to 6 PM, Monday to Friday)
    const businessHours = DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day,
      openTime: day === "SATURDAY" || day === "SUNDAY" ? "10:00" : "09:00",
      closeTime: day === "SATURDAY" || day === "SUNDAY" ? "17:00" : "18:00",
      isClosed: false,
    }));

    // Create pricing array with both hourly and daily rates
    const pricing = [
      {
        pricingType: PRICING_TYPES.HOURLY,
        price: data.hourlyPrice,
        currency: "USD",
        isPeakPrice: false,
        peakDays: [],
        peakHours: null,
        cleaningFee: 0,
        serviceFee: 0,
        overtimeFee: 25, // Default overtime fee
      },
      {
        pricingType: PRICING_TYPES.DAILY,
        price: data.dailyPrice,
        currency: "USD",
        isPeakPrice: false,
        peakDays: [],
        peakHours: null,
        cleaningFee: 50, // Default cleaning fee for daily bookings
        serviceFee: 0,
        overtimeFee: 0,
      },
    ];

    // Transform data to match API expectations
    const spaceData = {
      title: data.title,
      description: data.description,
      imageSrc: data.imageSrc,
      images: data.images || [],
      spaceType: getSpaceTypeFromCategory(data.category),
      category: data.category,
      capacity: data.capacity,
      minCapacity: data.minCapacity || 1,
      location: data.location, // Send the entire location object
      address: data.address,
      city: data.city || data.location?.label?.split(",")[0] || "",
      state: data.state,
      postalCode: data.postalCode,
      country: data.location?.label || "",
      squareFootage: data.squareFootage || null,
      ceilingHeight: null,
      amenities: [], // You can expand this later
      equipment: [], // You can expand this later
      instantBooking: data.instantBooking || false,
      requiresApproval: !data.instantBooking,
      minBookingHours: 1,
      maxBookingHours: null,
      cancellationPolicy: "MODERATE",
      rules: [],
      pricing: pricing,
      businessHours: businessHours,
    };

    axios
      .post("/api/spaces", spaceData)
      .then(() => {
        toast.success("Space listed successfully!");
        router.refresh();
        reset();
        setStep(STEPS.CATEGORY);
        rentModal.onClose();
      })
      .catch((error) => {
        console.error("Error creating space:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
          toast.error(error.response.data?.error || "Something went wrong.");
        } else {
          toast.error("Something went wrong.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const actionLabel = useMemo(() => {
    if (step === STEPS.PRICE) {
      return "Create";
    }

    return "Next";
  }, [step]);

  const secondaryActionLabel = useMemo(() => {
    if (step === STEPS.CATEGORY) {
      return undefined;
    }

    return "Back";
  }, [step]);

  let bodyContent = (
    <div className="flex flex-col gap-8">
      <Heading
        title="Which type of space are you listing?"
        subtitle="Pick a category"
      />
      <div
        className="
          grid 
          grid-cols-1 
          md:grid-cols-2 
          gap-3
          max-h-[50vh]
          overflow-y-auto
        "
      >
        {categories.map((item) => (
          <div key={item.label} className="col-span-1">
            <CategoryInput
              onClick={(category) => setCustomValue("category", category)}
              selected={category === item.label}
              label={item.label}
              icon={item.icon}
            />
          </div>
        ))}
      </div>
    </div>
  );

  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Where is your space located?"
          subtitle="Help businesses and event organizers find you!"
        />
        <CountrySelect
          value={location}
          onChange={(value) => setCustomValue("location", value)}
        />
        <Map center={location?.latlng} />
        <hr />
        <Input
          id="address"
          label="Street Address"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="city"
            label="City"
            disabled={isLoading}
            register={register}
            errors={errors}
            required
          />
          <Input
            id="state"
            label="State/Province"
            disabled={isLoading}
            register={register}
            errors={errors}
          />
        </div>
        <Input
          id="postalCode"
          label="Postal Code"
          disabled={isLoading}
          register={register}
          errors={errors}
        />
      </div>
    );
  }

  if (step === STEPS.INFO) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Share details about your space"
          subtitle="What features does your space offer?"
        />
        <Counter
          onChange={(value) => setCustomValue("capacity", value)}
          value={capacity}
          title="Maximum Capacity"
          subTitle="Maximum number of people"
        />
        <hr />
        <Counter
          onChange={(value) => setCustomValue("minCapacity", value)}
          value={minCapacity}
          title="Minimum Capacity"
          subTitle="Minimum number of people for booking"
        />
        <hr />
        <Input
          id="squareFootage"
          label="Square Footage (optional)"
          type="number"
          disabled={isLoading}
          register={register}
          errors={errors}
        />
        <hr />
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="instantBooking"
            {...register("instantBooking")}
            className="w-4 h-4"
          />
          <label htmlFor="instantBooking" className="text-md">
            Enable instant booking (no approval required)
          </label>
        </div>
      </div>
    );
  }

  if (step === STEPS.IMAGES) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Add photos of your space"
          subtitle="Show potential clients what your space looks like!"
        />
        <ImageUpload
          onChange={(value) => setCustomValue("imageSrc", value)}
          value={imageSrc}
        />
      </div>
    );
  }

  if (step === STEPS.DESCRIPTION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="How would you describe your space?"
          subtitle="Highlight what makes your space perfect for business or events!"
        />
        <Input
          id="title"
          label="Title"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <hr />
        <Input
          id="description"
          label="Description"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );
  }

  if (step === STEPS.PRICE) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Set your pricing"
          subtitle="Offer flexible pricing options"
        />
        <Input
          id="hourlyPrice"
          label="Hourly Rate"
          formatPrice
          type="number"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <Input
          id="dailyPrice"
          label="Daily Rate (8 hours)"
          formatPrice
          type="number"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <div className="text-sm text-gray-500">
          <p>💡 Tip: Daily rates typically offer a 15-20% discount vs hourly</p>
          <p className="mt-2">
            Default business hours: Mon-Fri 9AM-6PM, Sat-Sun 10AM-5PM
          </p>
          <p className="mt-1">
            You can customize these settings after creating your space.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Modal
      disabled={isLoading}
      isOpen={rentModal.isOpen}
      title="List your space on FlexiSpace!"
      actionLabel={actionLabel}
      onSubmit={handleSubmit(onSubmit)}
      secondaryActionLabel={secondaryActionLabel}
      secondaryAction={step === STEPS.CATEGORY ? undefined : onBack}
      onClose={rentModal.onClose}
      body={bodyContent}
    />
  );
};

export default RentModal;
