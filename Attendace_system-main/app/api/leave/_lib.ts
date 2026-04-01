import { createClient } from "@/lib/server"
import { createAdminClient } from "@/lib/supabase-admin"

export interface LeaveAuthProfile {
  id: string
  name: string
  email: string
  role: "admin" | "hod" | "faculty" | "student"
}

export interface LeaveAuthContext {
  profile: LeaveAuthProfile
  admin: ReturnType<typeof createAdminClient>
}

export async function requireLeaveAuthContext(): Promise<{ context?: LeaveAuthContext; response?: Response }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const admin = createAdminClient()

  let profile: LeaveAuthProfile | null = null

  const byId = await admin
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single()

  if (!byId.error && byId.data) {
    profile = byId.data as LeaveAuthProfile
  }

  if (!profile && user.email) {
    const byEmail = await admin.from("profiles").select("id, name, email, role").eq("email", user.email).limit(1)
    if (!byEmail.error && byEmail.data && byEmail.data.length > 0) {
      profile = byEmail.data[0] as LeaveAuthProfile
    }
  }

  if (!profile) {
    return { response: Response.json({ error: "Profile not found" }, { status: 403 }) }
  }

  return { context: { profile, admin } }
}

export function isLeaveApproverRole(role: string): boolean {
  return role === "admin" || role === "hod"
}

export function leaveSchemaNotReady(errorMessage?: string): Response {
  return Response.json(
    {
      error: "Leave schema is not ready",
      hint: "Run scripts 009_create_leave_schema.sql, 010_enable_leave_rls.sql, and 011_create_leave_functions.sql",
      details: errorMessage || null,
    },
    { status: 503 },
  )
}
