import { leaveSchemaNotReady, requireLeaveAuthContext } from "../../../_lib"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireLeaveAuthContext()
  if (auth.response) {
    return auth.response
  }

  const { admin, profile } = auth.context!
  const { id } = await context.params

  const existing = await admin
    .from("leave_requests")
    .select("id, profile_id, status")
    .eq("id", id)
    .single()

  if (existing.error || !existing.data) {
    return leaveSchemaNotReady(existing.error?.message || "Leave request not found")
  }

  if (existing.data.profile_id !== profile.id) {
    return Response.json({ error: "You can only cancel your own leave request" }, { status: 403 })
  }

  if (existing.data.status !== "pending") {
    return Response.json({ error: "Only pending requests can be cancelled" }, { status: 400 })
  }

  const { data, error } = await admin.rpc("process_leave_request_decision", {
    p_request_id: id,
    p_reviewer_id: profile.id,
    p_action: "cancel",
    p_rejection_reason: null,
  })

  if (error) {
    return leaveSchemaNotReady(error.message)
  }

  return Response.json({ result: data })
}
