"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Share2,
} from "lucide-react";
import Link from "next/link";
import AutomationStatusIndicator from "@/components/AutomationStatusIndicator";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Get username from session
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find((c) =>
      c.trim().startsWith("admin_session=")
    );

    if (sessionCookie) {
      try {
        const token = sessionCookie.split("=")[1];
        const sessionData = JSON.parse(atob(token));
        setUsername(sessionData.username);
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }
  }, []);

  // If it's the login page, render without the admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    document.cookie =
      "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/admin/login");
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin/dashboard",
    },
    {
      icon: Users,
      label: "Participants",
      href: "/admin/participants",
    },
    {
      icon: Share2,
      label: "Referrals",
      href: "/admin/referrals",
    },
    {
      icon: Calendar,
      label: "Events",
      href: "/admin/events",
    },
    {
      icon: MessageSquare,
      label: "Broadcast",
      href: "/admin/broadcast",
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/admin/notifications",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/admin/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {username}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <AutomationStatusIndicator />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
