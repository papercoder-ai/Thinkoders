"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest } from "../lib/api";
import { useAuthGuard } from "../lib/use-auth-guard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, memo, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Grid3x3,
} from "lucide-react";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

function statusToBadgeVariant(status: LeaveStatus) {
  switch (status) {
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    default:
      return "default";
  }
}

function statusIcon(status: LeaveStatus) {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "approved":
      return <CheckCircle className="w-4 h-4" />;
    case "rejected":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
}

export default memo(function RequestsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard({
    allowedRoles: ["manager", "hr", "admin"],
    redirectTo: "/",
  });
  const router = useRouter();
  const [view, setView] = useState<"list" | "grid">("list");

  const {
    data: requests,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pending-requests', user?.id, user?.role],
    queryFn: () => api.getPendingRequests(),
    enabled: Boolean(isAuthenticated && user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  const rows = useMemo(() => requests ?? [], [requests]);
  const requestCount = useMemo(() => rows.length, [rows]);

  const handleViewChange = useCallback((newView: "list" | "grid") => {
    setView(newView);
  }, []);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
        </div>
        {/* Header controls skeleton */}
        <div className="flex gap-2 h-10">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md w-20 animate-pulse"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md w-20 animate-pulse"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md w-24 animate-pulse"></div>
        </div>
        {/* Request cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load requests";
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Pending Requests</h1>
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            <Button onClick={handleRefetch} className="mt-4" size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use memoized rows for rendering
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Leave Requests
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {requestCount} {requestCount === 1 ? "request" : "requests"} pending
            approval
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange("list")}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            List
          </Button>
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange("grid")}
            className="gap-2"
          >
            <Grid3x3 className="w-4 h-4" />
            Grid
          </Button>
          <Link href="/requests/history">
            <Button variant="outline" size="sm" className="gap-2">
              <History className="w-4 h-4" />
              History
            </Button>
          </Link>
        </div>
      </div>

      {!rows.length ? (
        <Card className="border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
          <CardContent className="text-center py-16">
            <div className="text-5xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No pending requests right now.
            </p>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        /* List View */
        <div className="space-y-3">
          {rows.map((request: LeaveRequest) => (
            <Card
              key={request.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/requests/${request.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {request.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {request.user?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {request.leave_type}
                        </p>
                      </div>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {request.reason}
                      </p>
                    )}
                  </div>

                  {/* Middle */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {request.start_date} to {request.end_date}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {request.days || 0} days
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex-shrink-0">
                    <Badge variant={statusToBadgeVariant(request.status as LeaveStatus)} className="gap-1">
                      {statusIcon(request.status as LeaveStatus)}
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((request: LeaveRequest) => (
            <Card
              key={request.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/requests/${request.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {request.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {request.user?.name || "Unknown User"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {request.leave_type}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={statusToBadgeVariant(request.status as LeaveStatus)}
                    className="text-xs"
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.reason && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {request.reason}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-900 dark:text-white">
                      {request.start_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {request.days || 0} days
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

function RequestCard({ req }: { req: LeaveRequest }) {
  const badge = badgeForStatus(req.status);
  return (
    <div className="card hover:border-primary/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl font-bold text-foreground">#{req.id}</span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
          </div>
          <div className="text-base text-foreground font-semibold mb-2">
            {req.user?.name || "Unknown"}
            <span className="text-muted-foreground font-normal text-sm ml-2">({req.user?.phone})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
              📅 {req.start_date} → {req.end_date}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded capitalize">
              {req.leave_type}
            </span>
            {req.duration_type !== 'full' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                {req.duration_type.replace('half_', 'Half ')}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{req.reason}</div>
        </div>
        <Link
          href={`/requests/${req.id}`}
          className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap"
        >
          Review →
        </Link>
      </div>
    </div>
  );
}

function badgeForStatus(status: LeaveStatus) {
  switch (status) {
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" };
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-muted text-muted-foreground" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}
