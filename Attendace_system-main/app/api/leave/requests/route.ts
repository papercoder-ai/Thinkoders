import {
  calculateLeaveDays,
  isValidDurationType,
  isValidLeaveType,
  type LeaveDurationType,
  type LeaveType,
} from "@/lib/leave-domain-common"
import { isLeaveApproverRole, leaveSchemaNotReady, requireLeaveAuthContext } from "../_lib"

export async function GET(request: Request) {
  const auth = await requireLeaveAuthContext()
  if (auth.response) {
    return auth.response
  }

  const { admin, profile } = auth.context!
  const status = new URL(request.url).searchParams.get("status")

  let query = admin
    .from("leave_requests")
    .select("id, profile_id, start_date, end_date, days, leave_type, duration_type, reason, status, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (status) {
    query = query.eq("status", status)
  }

  if (!isLeaveApproverRole(profile.role)) {
    query = query.eq("profile_id", profile.id)
  }

  const { data, error } = await query

  if (error) {
    return leaveSchemaNotReady(error.message)
  }

  return Response.json({
    requests: data || [],
    scope: isLeaveApproverRole(profile.role) ? "approver" : "self",
    viewer: {
      profileId: profile.id,
      role: profile.role,
      canReview: isLeaveApproverRole(profile.role),
    },
  })
}

export async function POST(request: Request) {
  const auth = await requireLeaveAuthContext()
  if (auth.response) {
    return auth.response
  }

  const { admin, profile } = auth.context!

  let body: {
    startDate?: string
    endDate?: string
    leaveType?: LeaveType
    durationType?: LeaveDurationType
    reason?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const startDate = body.startDate?.trim()
  const endDate = body.endDate?.trim()
  const leaveType = body.leaveType
  const durationType = (body.durationType || "full") as LeaveDurationType
  const reason = body.reason?.trim() || null

  if (!startDate || !endDate) {
    return Response.json({ error: "startDate and endDate are required" }, { status: 400 })
  }

  if (!isValidLeaveType(leaveType)) {
    return Response.json({ error: "Invalid leaveType" }, { status: 400 })
  }

  if (!isValidDurationType(durationType)) {
    return Response.json({ error: "Invalid durationType" }, { status: 400 })
  }

  let days: number
  try {
    days = calculateLeaveDays(startDate, endDate, durationType)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid leave dates" }, { status: 400 })
  }

  const balanceYear = new Date(startDate).getFullYear()
  const ensure = await admin.rpc("ensure_leave_balance", {
    p_profile_id: profile.id,
    p_year: balanceYear,
  })

  if (ensure.error) {
    return leaveSchemaNotReady(ensure.error.message)
  }

  const { data, error } = await admin
    .from("leave_requests")
    .insert({
      profile_id: profile.id,
      start_date: startDate,
      end_date: endDate,
      days,
      leave_type: leaveType,
      duration_type: durationType,
      reason,
      status: "pending",
    })
    .select("id, profile_id, start_date, end_date, days, leave_type, duration_type, reason, status, created_at")
    .single()

  if (error) {
    return leaveSchemaNotReady(error.message)
  }

  return Response.json({ request: data }, { status: 201 })
}
