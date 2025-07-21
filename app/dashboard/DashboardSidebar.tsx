"use client";

import { usePathname, useRouter } from "next/navigation";
import { SafeUser } from "@/app/types";
import {
  CalendarIcon,
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

interface DashboardSidebarProps {
  currentUser: SafeUser;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ currentUser }) => {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: HomeIcon },
    { name: "Bookings", href: "/dashboard/bookings", icon: CalendarIcon },
    { name: "My Spaces", href: "/dashboard/spaces", icon: BuildingOfficeIcon },
    { name: "Analytics", href: "/dashboard/analytics", icon: ChartBarIcon },
    { name: "Settings", href: "/dashboard/settings", icon: CogIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 mt-5 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 flex-shrink-0 h-6 w-6
                    ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* User info */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div>
            <img
              className="inline-block h-9 w-9 rounded-full"
              src={currentUser.image || "/images/placeholder.jpg"}
              alt=""
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {currentUser.name}
            </p>
            <p className="text-xs font-medium text-gray-500">
              {currentUser.userType === "BUSINESS" ? "Business" : "Individual"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
