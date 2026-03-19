import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";

export const adminLinks = [
  { label: "Dashboard", path: "/admin", icon: HomeIcon },
  { label: "Billers", path: "/admin/Billers", icon: UserGroupIcon },
  { label: "Agents", path: "/admin/agents", icon: UsersIcon },
  { label: "Users", path: "/admin/Users", icon: BanknotesIcon },
  { label: "Reports", path: "/admin/reports", icon: ChartBarIcon }
];