import { isLeaveApproverRole, leaveSchemaNotReady, requireLeaveAuthContext } from "../../../_lib"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireLeaveAuthContext()
  if (auth.response) {
    return auth.response
  }

  const { admin, profile } = auth.context!

  if (!isLeaveApproverRole(profile.role)) {
    return Response.json({ error: "Only admin/HOD can approve leave" }, { status: 403 })
  }

  const { id } = await context.params

  const { data, error } = await admin.rpc("process_leave_request_decision", {
    p_request_id: id,
    p_reviewer_id: profile.id,
    p_action: "approve",
    p_rejection_reason: null,
  })

  if (error) {
    return leaveSchemaNotReady(error.message)
  }

  return Response.json({ result: data })
}
