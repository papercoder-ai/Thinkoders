"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/lib/auth-context";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
    roles: ["worker", "manager", "hr", "admin"],
  },
  {
    label: "Leave Requests",
    href: "/requests",
    icon: ClipboardList,
    roles: ["worker", "manager", "hr", "admin"],
  },
  {
    label: "Approvals",
    href: "/requests?tab=pending",
    icon: Calendar,
    roles: ["manager", "hr", "admin"],
  },
  {
    label: "Team",
    href: "/users",
    icon: Users,
    roles: ["manager", "hr", "admin"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["hr", "admin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["worker", "manager", "hr", "admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || "worker")
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 p-0"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6">
          <div className="flex items-center space-x-2 w-full">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              LeaveFlow
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.role}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Spacer for main content on desktop */}
      <div className="hidden md:block w-64" />
    </>
  );
}
