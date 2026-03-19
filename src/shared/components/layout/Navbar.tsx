// src/shared/components/Navbar.tsx
import { useState, useRef, useEffect } from "react";
import { BellIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from "@heroicons/react/24/solid";

interface Props {
  userName: string;
  onLogout: () => void;
}

export default function Navbar({ userName, onLogout }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between items-center bg-white shadow px-6 py-4 rounded-xl mb-6">
      {/* Left side: search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-4 relative">
        
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
          >
            <UserCircleIcon className="w-6 h-6 text-gray-600" />
            <span className="font-medium text-gray-700">{userName}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-red-50 text-red-600"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}