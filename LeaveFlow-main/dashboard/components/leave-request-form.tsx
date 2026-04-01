"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, AlertCircle } from "lucide-react";

interface LeaveFormProps {
  onSubmit?: (data: LeaveFormData) => Promise<void>;
}

interface LeaveFormData {
  leaveType: "casual" | "sick" | "special" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
}

export function LeaveRequestForm({ onSubmit }: LeaveFormProps) {
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSuccess(true);
      setFormData({
        leaveType: "casual",
        startDate: "",
        endDate: "",
        reason: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit leave request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Leave</CardTitle>
        <CardDescription>
          Submit a new leave request. Your manager will be notified immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  Error
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="flex gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
              <div className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <p className="font-medium text-teal-600 dark:text-teal-400">
                  Request submitted
                </p>
                <p className="text-sm text-teal-600 dark:text-teal-400">
                  Your manager has been notified and will review your request
                  soon.
                </p>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Leave Type
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  leaveType: e.target.value as LeaveFormData["leaveType"],
                })
              }
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="special">Special Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
              Select the type of leave you want to request
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                    })
                  }
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value,
                    })
                  }
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Reason (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reason: e.target.value,
                  })
                }
                placeholder="Let your manager know why you need this leave..."
                rows={4}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
              Providing a reason increases approval chances
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="reset"
              variant="outline"
              className="flex-1"
              onClick={() =>
                setFormData({
                  leaveType: "casual",
                  startDate: "",
                  endDate: "",
                  reason: "",
                })
              }
            >
              Clear
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              💡 <strong>Tip:</strong> Submit requests at least 5 days in advance for better approval chances.
            </p>
            <p>
              📱 <strong>Tip:</strong> You'll receive WhatsApp notifications about your request status.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
