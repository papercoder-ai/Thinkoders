import { leaveSchemaNotReady, requireLeaveAuthContext } from "../_lib"

export async function GET(request: Request) {
  const auth = await requireLeaveAuthContext()
  if (auth.response) {
    return auth.response
  }

  const { admin, profile } = auth.context!

  const yearRaw = new URL(request.url).searchParams.get("year")
  const year = yearRaw ? Number.parseInt(yearRaw, 10) : new Date().getFullYear()

  if (Number.isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Invalid year" }, { status: 400 })
  }

  const ensure = await admin.rpc("ensure_leave_balance", {
    p_profile_id: profile.id,
    p_year: year,
  })

  if (ensure.error) {
    return leaveSchemaNotReady(ensure.error.message)
  }

  const { data, error } = await admin
    .from("leave_balances")
    .select("id, profile_id, year, casual_balance, sick_balance, special_balance, updated_at")
    .eq("profile_id", profile.id)
    .eq("year", year)
    .single()

  if (error) {
    return leaveSchemaNotReady(error.message)
  }

  return Response.json({
    balance: data,
    profile: {
      id: profile.id,
      role: profile.role,
      name: profile.name,
    },
  })
}
