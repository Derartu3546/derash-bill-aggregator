// src/shared/components/layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface LinkItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface Props {
  links: LinkItem[];
}

export default function Sidebar({ links }: Props) {
  const location = useLocation();

  return (
    <aside className="w-72 bg-white shadow-md flex flex-col p-6">
      
      <ul className="flex-1">
        {links.map((link) => (
          <li key={link.path} className="mb-2">
            <Link
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 hover:bg-gray-100 ${
                location.pathname === link.path ? "bg-blue-600 text-white font-bold" : "text-gray-700"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <button className="w-full bg-red-500 text-white py-2 rounded-lg mt-auto hover:bg-red-600 transition">
        Logout
      </button>
    </aside>
  );
}