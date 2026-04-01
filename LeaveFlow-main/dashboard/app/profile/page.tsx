"use client";

import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

export default memo(function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const isFormValid = useMemo(() => {
    if (!formData.name.trim() || formData.name.length < 2) return false;
    if (!formData.phone.trim()) return false;
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) return false;
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) return false;
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isFormValid) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error("Not authenticated");

      await api.updateUser(user.id, formData);
      await refreshUser();

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }, [formData, user, refreshUser, isFormValid]);

  const handleCancel = useCallback(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setIsEditing(false);
    setError("");
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-4 sm:py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your account information
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl sm:text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">{user.name}</h2>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary capitalize">
                  {user.role}
                </span>
                <span className="hidden sm:inline text-muted-foreground text-sm">•</span>
                <span className="text-muted-foreground text-sm">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 rounded-lg border bg-background disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || loading}
                className="w-full px-4 py-3 rounded-lg border bg-background disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="your.email@company.com"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing || loading}
                required
                className="w-full px-4 py-3 rounded-lg border bg-background disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include country code (e.g., +1 for US, +91 for India)
              </p>
            </div>

            {/* Role Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Role
              </label>
              <input
                type="text"
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                disabled
                className="w-full px-4 py-3 rounded-lg border bg-muted text-muted-foreground cursor-not-allowed capitalize"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Contact HR to change your role
              </p>
            </div>

            {/* User ID (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                User ID
              </label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-4 py-3 rounded-lg border bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Additional Info Card */}
      <div className="mt-6 bg-card rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Account Created</p>
            <p className="font-medium">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Account Status</p>
            <p className="font-medium text-green-600 dark:text-green-400">Active</p>
          </div>
        </div>
      </div>
    </main>
  );
});
