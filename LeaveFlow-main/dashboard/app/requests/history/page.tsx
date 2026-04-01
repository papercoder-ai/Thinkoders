"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: requests, isLoading, error } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-history', statusFilter],
    queryFn: () => api.getLeaveHistory(statusFilter || undefined),
    enabled: isAuthenticated,
  });

  const handleExportCSV = () => {
    if (!requests || requests.length === 0) return;

    const headers = ['ID', 'Employee', 'Start Date', 'End Date', 'Days', 'Type', 'Duration', 'Status', 'Reason', 'Created At'];
    const csvData: (string | number)[][] = requests.map((req: LeaveRequest) => [
      req.id,
      req.user?.name || 'Unknown',
      req.start_date,
      req.end_date,
      req.days,
      req.leave_type,
      req.duration_type,
      req.status,
      `"${(req.reason || '').replace(/"/g, '""')}"`,
      req.created_at,
    ]);

    const csv = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || isLoading) {
    return (
      <main className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (error) {
    return <div className="text-red-600">Failed to load history.</div>;
  }

  const rows: LeaveRequest[] = requests ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Request History</h1>
          <p className="text-sm text-muted-foreground mt-1">View and export past leave requests</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="btn text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
          >
            📥 Export CSV
          </button>
          <Link href="/requests" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">
            📋 View Pending
          </Link>
        </div>
      </div>

      {!rows.length ? (
        <div className="card text-center py-8 text-muted-foreground">
          No historical requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((req) => (
            <HistoryCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </main>
  );
}

function HistoryCard({ req }: { req: LeaveRequest }) {
  const badge = badgeForStatus(req.status);
  return (
    <div className="card hover:shadow-lg hover:border-primary/50 transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-lg font-bold">{req.id}</span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
            <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full font-medium">{req.days} day(s)</span>
          </div>
          <div className="text-sm font-semibold mb-1">
            {req.user?.name || "Unknown"}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              📅 {req.start_date} → {req.end_date}
            </span>
            <span>•</span>
            <span className="capitalize">{req.leave_type}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-2 line-clamp-1">{req.reason}</div>
        </div>
        <Link href={`/requests/${req.id}`} className="btn btn-ghost border text-sm hover:border-primary transition-all whitespace-nowrap">
          View →
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
