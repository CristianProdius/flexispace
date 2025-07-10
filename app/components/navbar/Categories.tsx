// app/components/navbar/Categories.tsx
"use client";

import Container from "../Container";

// Workspace Icons
import { FaBriefcase } from "@react-icons/all-files/fa/FaBriefcase";
import { FaDesktop } from "@react-icons/all-files/fa/FaDesktop";
import { FaUsers } from "@react-icons/all-files/fa/FaUsers";
import { FaChalkboardTeacher } from "@react-icons/all-files/fa/FaChalkboardTeacher";
import { FaUserTie } from "@react-icons/all-files/fa/FaUserTie";
import { FaHome } from "@react-icons/all-files/fa/FaHome";

// Event Venue Icons
import { FaGlassCheers } from "@react-icons/all-files/fa/FaGlassCheers";
import { FaRing } from "@react-icons/all-files/fa/FaRing";
import { FaMicrophone } from "@react-icons/all-files/fa/FaMicrophone";
import { FaGraduationCap } from "@react-icons/all-files/fa/FaGraduationCap";
import { FaTheaterMasks } from "@react-icons/all-files/fa/FaTheaterMasks";
import { FaPalette } from "@react-icons/all-files/fa/FaPalette";

import CategoryBox from "../CategoryBox";
import { usePathname, useSearchParams } from "next/navigation";

export const categories = [
  // Workspace Categories
  {
    label: "Private Office",
    icon: FaBriefcase,
    description: "Dedicated private office space for focused work",
    spaceType: "WORKSPACE",
  },
  {
    label: "Open Workspace",
    icon: FaHome,
    description: "Shared open workspace with flexible seating",
    spaceType: "WORKSPACE",
  },
  {
    label: "Meeting Room",
    icon: FaUsers,
    description: "Professional meeting rooms for team collaboration",
    spaceType: "WORKSPACE",
  },
  {
    label: "Conference Room",
    icon: FaChalkboardTeacher,
    description: "Large conference rooms with presentation equipment",
    spaceType: "WORKSPACE",
  },
  {
    label: "Coworking Desk",
    icon: FaDesktop,
    description: "Individual desk in a shared coworking environment",
    spaceType: "WORKSPACE",
  },
  {
    label: "Executive Suite",
    icon: FaUserTie,
    description: "Premium executive office with exclusive amenities",
    spaceType: "WORKSPACE",
  },
  // Event Venue Categories
  {
    label: "Wedding Venue",
    icon: FaRing,
    description: "Beautiful venues for wedding ceremonies and receptions",
    spaceType: "EVENT_VENUE",
  },
  {
    label: "Conference Hall",
    icon: FaMicrophone,
    description: "Large halls for conferences and corporate events",
    spaceType: "EVENT_VENUE",
  },
  {
    label: "Banquet Hall",
    icon: FaGlassCheers,
    description: "Elegant spaces for banquets and formal dinners",
    spaceType: "EVENT_VENUE",
  },
  {
    label: "Party Space",
    icon: FaTheaterMasks,
    description: "Fun venues for parties and celebrations",
    spaceType: "EVENT_VENUE",
  },
  {
    label: "Workshop Room",
    icon: FaGraduationCap,
    description: "Equipped spaces for workshops and training sessions",
    spaceType: "EVENT_VENUE",
  },
  {
    label: "Exhibition Space",
    icon: FaPalette,
    description: "Gallery spaces for exhibitions and showcases",
    spaceType: "EVENT_VENUE",
  },
];

const Categories = () => {
  const params = useSearchParams();
  const category = params?.get("category");
  const spaceType = params?.get("spaceType");
  const pathName = usePathname();

  const isMainPage = pathName === "/";

  if (!isMainPage) {
    return null;
  }

  // Filter categories based on selected space type
  const filteredCategories = spaceType
    ? categories.filter((cat) => cat.spaceType === spaceType)
    : categories;

  return (
    <Container>
      <div className="pt-4 flex flex-col gap-2">
        {/* Space Type Selector */}
        <div className="flex gap-4 mb-2">
          <button
            onClick={() => (window.location.search = "")}
            className={`px-4 py-2 rounded-full transition ${
              !spaceType
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            All Spaces
          </button>
          <button
            onClick={() => (window.location.search = "?spaceType=WORKSPACE")}
            className={`px-4 py-2 rounded-full transition ${
              spaceType === "WORKSPACE"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Workspaces
          </button>
          <button
            onClick={() => (window.location.search = "?spaceType=EVENT_VENUE")}
            className={`px-4 py-2 rounded-full transition ${
              spaceType === "EVENT_VENUE"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Event Venues
          </button>
        </div>

        {/* Category Icons */}
        <div className="flex flex-row items-center justify-between overflow-x-auto">
          {filteredCategories.map((item) => (
            <CategoryBox
              key={item.label}
              label={item.label}
              selected={category === item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Categories;
