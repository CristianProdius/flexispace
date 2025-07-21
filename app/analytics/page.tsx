// app/components/analytics/SpaceAnalyticsDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

import { FaDollarSign } from "@react-icons/all-files/fa/FaDollarSign";

import { FaCalendarCheck } from "@react-icons/all-files/fa/FaCalendarCheck";
import { FaStar } from "@react-icons/all-files/fa/FaStar";

import { FaPercentage } from "@react-icons/all-files/fa/FaPercentage";
import { FaArrowUp } from "@react-icons/all-files/fa/FaArrowUp";
import { FaArrowDown } from "@react-icons/all-files/fa/FaArrowDown";
import { SafeBooking, SafeSpace, BookingStatus } from "@/app/types";

interface SpaceAnalyticsDashboardProps {
  spaces: (SafeSpace & { bookings: SafeBooking[]; reviews: any[] })[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

type TimeFrame = "week" | "month" | "year" | "all";

const SpaceAnalyticsDashboard: React.FC<SpaceAnalyticsDashboardProps> = ({
  spaces,
}) => {
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("month");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | "all">("all");

  // Filter bookings based on selected timeframe and space
  const filteredBookings = useMemo(() => {
    let allBookings = spaces.flatMap((space) =>
      space.bookings.map((booking) => ({
        ...booking,
        spaceName: space.title,
        spaceId: space.id,
      }))
    );

    if (selectedSpaceId !== "all") {
      allBookings = allBookings.filter((b) => b.spaceId === selectedSpaceId);
    }

    // Filter by date range
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (selectedTimeFrame) {
      case "week":
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return allBookings;
    }

    return allBookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }, [spaces, selectedTimeFrame, selectedSpaceId]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredBookings
      .filter(
        (b) =>
          b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.APPROVED
      )
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const totalBookings = filteredBookings.length;
    const completedBookings = filteredBookings.filter(
      (b) => b.status === BookingStatus.COMPLETED
    ).length;
    const cancelledBookings = filteredBookings.filter(
      (b) => b.status === BookingStatus.CANCELLED
    ).length;

    const totalHours = filteredBookings
      .filter(
        (b) =>
          b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.APPROVED
      )
      .reduce((sum, b) => sum + b.totalHours, 0);

    const averageBookingValue =
      totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const occupancyRate = (totalHours / (spaces.length * 8 * 30)) * 100; // Assuming 8 hours/day, 30 days
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Calculate average rating
    const allReviews = spaces.flatMap((s) => s.reviews);
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    return {
      totalRevenue,
      totalBookings,
      completedBookings,
      totalHours,
      averageBookingValue,
      occupancyRate,
      cancellationRate,
      averageRating,
      totalReviews: allReviews.length,
    };
  }, [filteredBookings, spaces]);

  // Revenue by day for chart
  const revenueByDay = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    });

    return days.map((day) => {
      const dayBookings = filteredBookings.filter(
        (b) =>
          isSameDay(new Date(b.createdAt), day) &&
          (b.status === BookingStatus.COMPLETED ||
            b.status === BookingStatus.APPROVED)
      );

      const revenue = dayBookings.reduce((sum, b) => sum + b.totalPrice, 0);

      return {
        date: format(day, "MMM dd"),
        revenue,
      };
    });
  }, [filteredBookings]);

  // Popular spaces
  const popularSpaces = useMemo(() => {
    return spaces
      .map((space) => ({
        ...space,
        bookingCount: space.bookings.filter(
          (b) =>
            b.status === BookingStatus.COMPLETED ||
            b.status === BookingStatus.APPROVED
        ).length,
        revenue: space.bookings
          .filter(
            (b) =>
              b.status === BookingStatus.COMPLETED ||
              b.status === BookingStatus.APPROVED
          )
          .reduce((sum, b) => sum + b.totalPrice, 0),
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);
  }, [spaces]);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    change,
    format: formatType = "number",
  }: {
    title: string;
    value: number;
    icon: any;
    change?: number;
    format?: "number" | "currency" | "percent";
  }) => {
    const formattedValue = () => {
      switch (formatType) {
        case "currency":
          return `$${value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        case "percent":
          return `${value.toFixed(1)}%`;
        default:
          return value.toLocaleString();
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formattedValue()}
            </p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {change > 0 ? (
                  <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <FaArrowDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h2>
        <div className="flex space-x-4">
          {/* Space Filter */}
          <select
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Spaces</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.title}
              </option>
            ))}
          </select>

          {/* Time Frame Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["week", "month", "year", "all"] as TimeFrame[]).map((frame) => (
              <button
                key={frame}
                onClick={() => setSelectedTimeFrame(frame)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  selectedTimeFrame === frame
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {frame === "all" ? "All Time" : frame}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          icon={FaDollarSign}
          format="currency"
          change={12.5}
        />
        <MetricCard
          title="Total Bookings"
          value={metrics.totalBookings}
          icon={FaCalendarCheck}
          change={8.3}
        />
        <MetricCard
          title="Occupancy Rate"
          value={metrics.occupancyRate}
          icon={FaPercentage}
          format="percent"
          change={-2.1}
        />
        <MetricCard
          title="Average Rating"
          value={metrics.averageRating}
          icon={FaStar}
          change={0.3}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trend
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {revenueByDay.map((day, index) => {
            const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenue));
            const height =
              maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${height}%` }}
                  title={`$${day.revenue.toFixed(2)}`}
                />
                <span className="text-xs text-gray-600 mt-2 rotate-45 origin-left">
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Spaces */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Spaces
          </h3>
          <div className="space-y-4">
            {popularSpaces.map((space, index) => (
              <div key={space.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-400">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{space.title}</p>
                    <p className="text-sm text-gray-600">
                      {space.bookingCount} bookings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${space.revenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Key Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Booking Value</span>
              <span className="font-semibold">
                ${metrics.averageBookingValue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Hours Booked</span>
              <span className="font-semibold">
                {metrics.totalHours.toFixed(0)} hours
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Bookings</span>
              <span className="font-semibold">{metrics.completedBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cancellation Rate</span>
              <span className="font-semibold text-red-600">
                {metrics.cancellationRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Reviews</span>
              <span className="font-semibold">{metrics.totalReviews}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceAnalyticsDashboard;
