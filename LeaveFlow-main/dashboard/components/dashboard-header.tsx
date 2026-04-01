"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/lib/auth-context";
import { api } from "@/app/lib/api";
import {
  Bell,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { data: pendingRequests } = useQuery({
  queryKey: ['pending-requests', user?.id, user?.role],
  queryFn: () => api.getPendingRequests(),
  enabled: Boolean(user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')),
  staleTime: 10000,
  refetchInterval: 30000,
  refetchOnWindowFocus: true,
  refetchOnMount: 'always',
  });

  const pendingCount = pendingRequests?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-4">
          {/* Notifications */}
          {["manager", "hr", "admin"].includes(user?.role || "") && (
            <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  {pendingCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-96">
                <div className="space-y-4 mt-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Pending Requests</h2>
                    {pendingRequests && pendingRequests.length > 0 ? (
                      <div className="space-y-2">
                        {pendingRequests.slice(0, 5).map((request: any) => (
                          <div
                            key={request.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <p className="font-medium text-sm">
                              {request.employee_name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {request.leave_type} • {request.start_date} to {request.end_date}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No pending requests
                      </p>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {user?.name?.charAt(0)}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-red-600 dark:text-red-400"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
