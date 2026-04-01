"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, memo, useCallback, useMemo } from "react";

export default memo(function PendingAccountsPage() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
    // Only Admin can access this page
    if (!authLoading && currentUser && currentUser.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  const { data: pendingAccounts, isLoading } = useQuery({
    queryKey: ['pending-accounts'],
    queryFn: () => api.getPendingAccounts(),
    enabled: isAuthenticated && currentUser?.role === 'admin',
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  const accountsList = useMemo(() => pendingAccounts ?? [], [pendingAccounts]);
  const accountCount = useMemo(() => accountsList.length, [accountsList]);

  const approveMutation = useMutation({
    mutationFn: (userId: number) => api.approveAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: 'Account approved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message || 'Failed to approve account' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => api.rejectAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setMessage({ type: 'success', text: 'Account rejected successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message || 'Failed to reject account' });
    },
  });

  const handleApprove = useCallback((userId: number) => {
    approveMutation.mutate(userId);
  }, [approveMutation]);

  const handleReject = useCallback((userId: number) => {
    rejectMutation.mutate(userId);
  }, [rejectMutation]);

  if (authLoading || isLoading) {
    return (
      <main className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pending Account Approvals</h1>
        <p className="text-muted-foreground">
          Approve or reject manager and HR account creation requests
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30'
              : 'bg-red-50 text-red-800 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {!pendingAccounts || pendingAccounts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-muted-foreground">No pending account approvals</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{account.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        account.role === 'manager'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                          : account.role === 'hr'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
                      }`}
                    >
                      {account.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Phone:</span> {account.phone}
                    </div>
                    {account.email && (
                      <div>
                        <span className="font-medium">Email:</span> {account.email}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Requested:</span>{' '}
                      {new Date(account.created_at).toLocaleDateString()} at{' '}
                      {new Date(account.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => approveMutation.mutate(account.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to reject ${account.name}'s account request?`)) {
                        rejectMutation.mutate(account.id);
                      }
                    }}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
});
