"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function UserDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
    // Only HR and Admin can access this page
    if (!authLoading && currentUser && currentUser.role !== 'hr' && currentUser.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
    enabled: isAuthenticated && !!id && (currentUser?.role === 'hr' || currentUser?.role === 'admin'),
  });

  const { data: managers, isError: managersError } = useQuery({
    queryKey: ['managers'],
    queryFn: () => api.getManagers(),
    enabled: isAuthenticated && (currentUser?.role === 'hr' || currentUser?.role === 'admin'),
    retry: 1,
  });

  const { data: leaveHistory } = useQuery({
    queryKey: ['user-leave-history', id],
    queryFn: () => api.getLeaveHistory(undefined, id),
    enabled: isAuthenticated && !!id && (currentUser?.role === 'hr' || currentUser?.role === 'admin'),
  });

  useEffect(() => {
    if (user) {
      setSelectedManager(user.manager_id || null);
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <main className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (error || !user) {
    return <div className="text-red-600">Failed to load user or not found.</div>;
  }

  const handleManagerUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      await api.adminUpdateUser(user.id, {
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        role: user.role,
        manager_id: selectedManager
      });

      setUpdateMessage({ type: 'success', text: 'Manager assigned successfully!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('Manager update error:', err);
      setUpdateMessage({ type: 'error', text: 'Failed to assign manager. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const balance = user.leave_balance;
  const stats = {
    total: leaveHistory?.length || 0,
    approved: leaveHistory?.filter(l => l.status === 'approved').length || 0,
    pending: leaveHistory?.filter(l => l.status === 'pending').length || 0,
    rejected: leaveHistory?.filter(l => l.status === 'rejected').length || 0,
  };

  return (
    <main className="space-y-6">
      <Link href="/users" className="text-sm text-blue-600 hover:underline">
        ← Back to Users
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.phone}</p>
            {user.email && <p className="text-muted-foreground text-sm">{user.email}</p>}
          </div>
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${roleColor(user.role)}`}>
            {user.role}
          </span>
        </div>

        {updateMessage && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            updateMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
          }`}>
            {updateMessage.text}
          </div>
        )}

        {/* Manager Assignment Section - Only for Workers */}
        {user.role === 'worker' && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-semibold mb-3">Assign Manager</h3>
            {managersError && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-700 dark:text-red-300">
                Failed to load managers. Please refresh the page or contact support.
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Select Manager</label>
                <select
                  value={selectedManager || ''}
                  onChange={(e) => setSelectedManager(e.target.value ? Number(e.target.value) : null)}
                  disabled={isUpdating || managersError || !managers}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- No Manager --</option>
                  {managers?.map((manager: any) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.phone})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleManagerUpdate}
                disabled={isUpdating || managersError || !managers}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
            {selectedManager && managers && (
              <p className="text-sm text-muted-foreground mt-2">
                Current manager: <strong>{managers.find((m: any) => m.id === selectedManager)?.name}</strong>
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Leave Balance */}
          <div>
            <h3 className="font-semibold mb-3">Leave Balance ({new Date().getFullYear()})</h3>
            {balance ? (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Casual Leave</span>
                  <span className="font-medium">{balance.casual} days</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Sick Leave</span>
                  <span className="font-medium">{balance.sick} days</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Special Leave</span>
                  <span className="font-medium">{balance.special} days</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No balance data available</p>
            )}
          </div>

          {/* Leave Statistics */}
          <div>
            <h3 className="font-semibold mb-3">Leave Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded p-3 text-center border">
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Requests</div>
              </div>
              <div className="bg-green-500/10 rounded p-3 text-center border border-green-500/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Approved</div>
              </div>
              <div className="bg-amber-500/10 rounded p-3 text-center border border-amber-500/20">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Pending</div>
              </div>
              <div className="bg-red-500/10 rounded p-3 text-center border border-red-500/20">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                <div className="text-xs text-red-600 dark:text-red-400">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leave History */}
      <div className="card">
        <h3 className="font-semibold mb-4">Recent Leave Requests</h3>
        {!leaveHistory || leaveHistory.length === 0 ? (
          <p className="text-muted-foreground">No leave requests yet.</p>
        ) : (
          <div className="space-y-2">
            {leaveHistory.slice(0, 10).map((leave) => (
              <div key={leave.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">#{leave.id}</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="text-sm">{leave.start_date} → {leave.end_date}</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="text-sm capitalize">{leave.leave_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                  <Link href={`/requests/${leave.id}`} className="text-blue-600 hover:underline text-sm">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function roleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
    case 'hr':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    case 'manager':
      return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
    case 'worker':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
    case 'cancelled':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
