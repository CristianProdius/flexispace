"use client";

import { SafeSpace, SafeUser } from "@/app/types";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import EmptyState from "@/app/components/EmptyState";

interface SpacesManagementProps {
  spaces: SafeSpace[];
  currentUser: SafeUser;
}

interface SpaceStats {
  [spaceId: string]: {
    pendingBookings: number;
    totalBookings: number;
    monthlyRevenue: number;
    averageRating: number;
  };
}

const SpacesManagement: React.FC<SpacesManagementProps> = ({
  spaces,
  currentUser,
}) => {
  const router = useRouter();
  const [spaceStats, setSpaceStats] = useState<SpaceStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaceStats = async () => {
      try {
        const response = await axios.get("/api/dashboard/spaces/stats");
        setSpaceStats(response.data);
      } catch (error) {
        console.error("Error fetching space stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceStats();
  }, []);

  const handleToggleActive = async (
    spaceId: string,
    currentStatus: boolean
  ) => {
    try {
      await axios.patch(`/api/spaces/${spaceId}`, {
        isActive: !currentStatus,
      });
      toast.success(
        `Space ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      router.refresh();
    } catch (error) {
      toast.error("Failed to update space status");
    }
  };

  const handleDelete = async (spaceId: string) => {
    if (!confirm("Are you sure you want to delete this space?")) {
      return;
    }

    try {
      await axios.delete(`/api/spaces/${spaceId}`);
      toast.success("Space deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete space");
    }
  };

  if (spaces.length === 0) {
    return (
      <div className="pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Spaces</h1>
          <p className="text-gray-600 mt-2">Manage your workspace listings</p>
        </div>

        <EmptyState
          title="No spaces yet"
          subTitle="Start by creating your first space listing"
          showReset
        />
      </div>
    );
  }

  return (
    <div className="pt-24">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Spaces</h1>
          <p className="text-gray-600 mt-2">
            Manage your workspace listings and bookings
          </p>
        </div>
        <button
          onClick={() => router.push("/become-host")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add New Space
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {spaces.map((space) => {
          const stats = spaceStats[space.id] || {
            pendingBookings: 0,
            totalBookings: 0,
            monthlyRevenue: 0,
            averageRating: 0,
          };

          return (
            <div
              key={space.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Space Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={space.imageSrc}
                      alt={space.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Space Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {space.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {space.address}, {space.city}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="h-4 w-4" />
                            Capacity: {space.minCapacity}-{space.capacity}
                          </span>
                          <span className="flex items-center gap-1">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            {space.category}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {space.isActive ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Inactive
                          </span>
                        )}
                        {space.verified && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {stats.pendingBookings}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Bookings</p>
                        <p className="text-lg font-semibold">
                          {stats.totalBookings}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Revenue</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${stats.monthlyRevenue.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="text-lg font-semibold">
                          {stats.averageRating > 0
                            ? `⭐ ${stats.averageRating.toFixed(1)}`
                            : "No reviews"}
                        </p>
                      </div>
                    </div>

                    {/* Pending Bookings Alert */}
                    {stats.pendingBookings > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                            <p className="text-sm text-yellow-800">
                              You have {stats.pendingBookings} pending booking
                              {stats.pendingBookings > 1 ? "s" : ""} to review
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/bookings?spaceId=${space.id}&status=PENDING`
                              )
                            }
                            className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                          >
                            Review Now →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/spaces/${space.id}`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/spaces/${space.id}/edit`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/bookings?spaceId=${space.id}`)
                      }
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Bookings
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleToggleActive(space.id, space.isActive)
                      }
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        space.isActive
                          ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                          : "text-white bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {space.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(space.id)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpacesManagement;
