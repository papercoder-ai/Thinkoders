"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LeaveRequestRow = {
  id: string
  profile_id: string
  start_date: string
  end_date: string
  days: number
  leave_type: "casual" | "sick" | "special"
  duration_type: "full" | "half_morning" | "half_afternoon"
  reason: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

type RequestsResponse = {
  requests: LeaveRequestRow[]
  scope: "self" | "approver"
  viewer: {
    profileId: string
    role: string
    canReview: boolean
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function statusVariant(status: LeaveRequestRow["status"]): "default" | "destructive" | "secondary" | "outline" {
  if (status === "approved") return "default"
  if (status === "rejected") return "destructive"
  if (status === "cancelled") return "secondary"
  return "outline"
}

export function LeaveRequestsClient() {
  const [items, setItems] = useState<LeaveRequestRow[]>([])
  const [viewer, setViewer] = useState<RequestsResponse["viewer"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [leaveType, setLeaveType] = useState<"casual" | "sick" | "special">("casual")
  const [durationType, setDurationType] = useState<"full" | "half_morning" | "half_afternoon">("full")
  const [reason, setReason] = useState("")

  const handleStartDateChange = (event: ChangeEvent<HTMLInputElement>) => setStartDate(event.target.value)
  const handleEndDateChange = (event: ChangeEvent<HTMLInputElement>) => setEndDate(event.target.value)
  const handleLeaveTypeChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setLeaveType(event.target.value as "casual" | "sick" | "special")
  const handleDurationTypeChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setDurationType(event.target.value as "full" | "half_morning" | "half_afternoon")
  const handleReasonChange = (event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)

  async function loadRequests() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/leave/requests", { cache: "no-store" })
      const data = (await response.json()) as Partial<RequestsResponse> & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load leave requests")
      }

      setItems(data.requests || [])
      setViewer(data.viewer || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests()
  }, [])

  const pendingCount = useMemo(() => items.filter((row: LeaveRequestRow) => row.status === "pending").length, [items])

  async function submitRequest() {
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/leave/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          leaveType,
          durationType,
          reason,
        }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit leave request")
      }

      setReason("")
      await loadRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request")
    } finally {
      setSubmitting(false)
    }
  }

  async function reviewRequest(id: string, action: "approve" | "reject") {
    setSubmitting(true)
    setError(null)

    try {
      const payload =
        action === "reject"
          ? {
              reason: window.prompt("Rejection reason") || "Rejected",
            }
          : undefined

      const response = await fetch(`/api/leave/requests/${id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} request`)
      }

      await loadRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} request`)
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelRequest(id: string) {
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/leave/requests/${id}/cancel`, { method: "POST" })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel request")
      }
      await loadRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply Leave</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leave-start">Start Date</Label>
            <Input id="leave-start" type="date" value={startDate} onChange={handleStartDateChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-end">End Date</Label>
            <Input id="leave-end" type="date" value={endDate} onChange={handleEndDateChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <select
              id="leave-type"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={leaveType}
              onChange={handleLeaveTypeChange}
            >
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="special">Special</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-duration">Duration</Label>
            <select
              id="leave-duration"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={durationType}
              onChange={handleDurationTypeChange}
            >
              <option value="full">Full Day(s)</option>
              <option value="half_morning">Half Day Morning</option>
              <option value="half_afternoon">Half Day Afternoon</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="leave-reason">Reason</Label>
            <textarea
              id="leave-reason"
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              value={reason}
              onChange={handleReasonChange}
              placeholder="Reason for leave"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <Button onClick={submitRequest} disabled={submitting || !startDate || !endDate}>
              Submit Leave Request
            </Button>
            {viewer?.canReview ? <Badge variant="secondary">Approver Mode</Badge> : <Badge variant="outline">Self Mode</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leave Requests</span>
            <Badge variant="outline">Pending: {pendingCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading leave requests...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Dates</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Days</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Reason</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row: LeaveRequestRow) => {
                    const isOwner = viewer?.profileId === row.profile_id
                    const canReview = Boolean(viewer?.canReview && row.status === "pending")
                    const canCancel = Boolean(isOwner && row.status === "pending")

                    return (
                      <tr key={row.id} className="border-b align-top">
                        <td className="py-3 pr-3">
                          <div>{formatDate(row.start_date)}</div>
                          <div className="text-muted-foreground">to {formatDate(row.end_date)}</div>
                        </td>
                        <td className="py-3 pr-3 capitalize">{row.leave_type.replace("_", " ")}</td>
                        <td className="py-3 pr-3">{row.days}</td>
                        <td className="py-3 pr-3">
                          <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="max-w-xs">{row.reason || "-"}</div>
                          {row.status === "rejected" && row.rejection_reason ? (
                            <div className="text-xs text-red-600 mt-1">Rejected: {row.rejection_reason}</div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-2">
                            {canReview ? (
                              <>
                                <Button size="sm" onClick={() => reviewRequest(row.id, "approve")} disabled={submitting}>
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => reviewRequest(row.id, "reject")}
                                  disabled={submitting}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}

                            {canCancel ? (
                              <Button size="sm" variant="secondary" onClick={() => cancelRequest(row.id)} disabled={submitting}>
                                Cancel
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
