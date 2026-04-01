import { isLeaveApproverRole, leaveSchemaNotReady, requireLeaveAuthContext } from "../../../_lib"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireLeaveAuthContext()
  if (auth.response) {
    return auth.response
  }

  const { admin, profile } = auth.context!

  if (!isLeaveApproverRole(profile.role)) {
    return Response.json({ error: "Only admin/HOD can reject leave" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const reason = typeof body.reason === "string" ? body.reason.trim() : "Rejected"

  const { id } = await context.params

  const { data, error } = await admin.rpc("process_leave_request_decision", {
    p_request_id: id,
    p_reviewer_id: profile.id,
    p_action: "reject",
    p_rejection_reason: reason || "Rejected",
  })

  if (error) {
    return leaveSchemaNotReady(error.message)
  }

  return Response.json({ result: data })
}
