import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import Navbar from "@/shared/components/layout/Navbar";

interface LinkItem {
  label: string;
  path: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface Props {
  title: string;
  links: LinkItem[];
  children: ReactNode;
}

export default function DashboardLayout({ title, links, children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 font-bold text-xl border-b">
          {title}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-red-500 text-white"
                    : "text-gray-700 hover:bg-red-100"
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar
          userName={user?.name || "User"}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}