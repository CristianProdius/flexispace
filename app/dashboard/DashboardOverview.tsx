// app/dashboard/DashboardOverview.tsx
"use client";

import { useEffect, useState } from "react";
import { SafeUser } from "@/app/types";
import axios from "axios";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useRouter } from "next/navigation";

interface DashboardOverviewProps {
  currentUser: SafeUser;
}

interface DashboardStats {
  totalSpaces: number;
  activeSpaces: number;
  totalBookings: number;
  pendingBookings: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  upcomingBookings: number;
  completedBookings: number;
  averageRating: number;
  totalReviews: number;
  occupancyRate: number;
  popularSpaces: Array<{
    id: string;
    title: string;
    bookingCount: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: string;
    spaceName: string;
    customerName: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
    totalPrice: number;
  }>;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  currentUser,
}) => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get("/api/dashboard/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Revenue (This Month)",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: "bg-green-500",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      name: "Active Bookings",
      value: stats.upcomingBookings,
      icon: CalendarIcon,
      color: "bg-blue-500",
      subtext: `${stats.pendingBookings} pending approval`,
    },
    {
      name: "Total Spaces",
      value: stats.totalSpaces,
      icon: BuildingOfficeIcon,
      color: "bg-purple-500",
      subtext: `${stats.activeSpaces} active`,
    },
    {
      name: "Average Rating",
      value: stats.averageRating.toFixed(1),
      icon: ChartBarIcon,
      color: "bg-yellow-500",
      subtext: `from ${stats.totalReviews} reviews`,
    },
  ];

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentUser.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your spaces today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              if (stat.name.includes("Bookings")) {
                router.push("/dashboard/bookings");
              } else if (stat.name.includes("Spaces")) {
                router.push("/dashboard/spaces");
              }
            }}
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    {stat.trend && (
                      <span
                        className={`ml-2 text-sm font-medium ${
                          stat.trendUp ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.trend}
                      </span>
                    )}
                  </dd>
                  {stat.subtext && (
                    <dd className="text-sm text-gray-500">{stat.subtext}</dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Bookings
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {stats.recentBookings.length > 0 ? (
                stats.recentBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push("/dashboard/bookings")}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {booking.spaceName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.customerName} •{" "}
                        {format(
                          new Date(booking.startDateTime),
                          "MMM d, h:mm a"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${booking.totalPrice.toFixed(2)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No recent bookings
                </p>
              )}
            </div>
            {stats.recentBookings.length > 5 && (
              <div className="mt-4">
                <button
                  onClick={() => router.push("/dashboard/bookings")}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all bookings →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Popular Spaces */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Top Performing Spaces
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {stats.popularSpaces.length > 0 ? (
                stats.popularSpaces.slice(0, 5).map((space, index) => (
                  <div
                    key={space.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-medium text-gray-400 w-6">
                        {index + 1}
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {space.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {space.bookingCount} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${space.revenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No space data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/dashboard/bookings")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Bookings</p>
          </button>
          <button
            onClick={() => router.push("/spaces/new")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Add New Space</p>
          </button>
          <button
            onClick={() => router.push("/dashboard/analytics")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Analytics</p>
          </button>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Manage Profile</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
