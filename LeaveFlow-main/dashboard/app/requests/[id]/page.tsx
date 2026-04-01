"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, LeaveRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function RequestDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['leave-request', id],
    queryFn: () => api.getLeaveRequest(id),
    enabled: isAuthenticated && !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => api.approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-request', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-history'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.rejectLeave(id, reason),
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ['leave-request', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-history'] });
    },
  });

  if (authLoading || isLoading) {
    return (
      <main className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (error || !detail) {
    return <div className="text-red-600">Failed to load request or not found.</div>;
  }

  const badge = badgeForStatus(detail.status);
  const canAction = detail.status === 'pending' && (user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin');

  return (
    <main className="space-y-6">
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        ← Back to Pending Requests
      </Link>

      <div className="card shadow-xl border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b">
          <h1 className="text-3xl font-bold">Request #{detail.id}</h1>
          <span className={`px-4 py-2 text-sm rounded-full font-bold shadow-sm ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Employee</label>
              <p className="font-bold text-lg mt-1">{detail.user?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">{detail.user?.phone}</p>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <label className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">Leave Type</label>
              <p className="font-bold text-lg mt-1 capitalize">{detail.leave_type}</p>
            </div>

            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <label className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">Duration Type</label>
              <p className="font-bold text-lg mt-1 capitalize">{detail.duration_type.replace('_', ' ')}</p>
            </div>

            <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <label className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Date Range</label>
              <p className="font-bold text-lg mt-1">{detail.start_date} → {detail.end_date}</p>
              <p className="text-sm text-muted-foreground mt-1">{detail.days} working day(s)</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Reason</label>
              <p className="text-foreground mt-2 leading-relaxed">{detail.reason || 'No reason provided'}</p>
            </div>

            {detail.rejection_reason && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <label className="text-xs uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold">Rejection Reason</label>
                <p className="text-red-600 dark:text-red-400 mt-2 leading-relaxed">{detail.rejection_reason}</p>
              </div>
            )}

            {detail.attachments && detail.attachments.length > 0 && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <label className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold mb-3 block">
                  📎 Attachments ({detail.attachments.length})
                </label>
                <div className="space-y-2">
                  {detail.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-background rounded border hover:border-purple-500/50 transition-colors">
                      <div className="flex-shrink-0">
                        {attachment.file_type?.includes('image') ? (
                          <span className="text-2xl">🖼️</span>
                        ) : attachment.file_type?.includes('pdf') ? (
                          <span className="text-2xl">📄</span>
                        ) : attachment.file_type?.includes('video') ? (
                          <span className="text-2xl">🎥</span>
                        ) : (
                          <span className="text-2xl">📎</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.file_type || 'Attachment'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attachment.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded transition-colors"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.attachments && detail.attachments.length > 0 && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <label className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Attachments</label>
                <div className="space-y-2 mt-2">
                  {detail.attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      📎 View Attachment
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg border">
              <label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Submitted</label>
              <p className="mt-1 font-medium">{new Date(detail.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <hr className="my-6" />

        {canAction && (
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all flex-1 sm:flex-none"
            >
              {approveMutation.isPending ? 'Approving...' : '✓ Approve Request'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all flex-1 sm:flex-none"
            >
              ✕ Reject Request
            </button>
          </div>
        )}

        {!canAction && detail.status === 'pending' && (
          <p className="text-muted-foreground text-sm">You don&apos;t have permission to approve or reject this request.</p>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-md border">
            <h3 className="text-2xl font-bold mb-4">Reject Leave Request</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Please provide a reason for rejection. This will be sent to the employee via WhatsApp.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border-2 rounded-lg p-4 text-sm mb-6 bg-background focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="btn bg-muted hover:bg-muted/80 flex-1 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate(rejectReason)}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex-1 shadow-md hover:shadow-lg transition-all"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
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
