import { createAdminClient } from "@/lib/supabase-admin"

export async function GET() {
  const admin = createAdminClient()
  let dbReady = true
  let dbError: string | null = null
  const fallbackProxyConfigured = Boolean((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.LEAVEFLOW_API_URL)

  try {
    const { error } = await admin.from("leave_requests").select("id", { head: true, count: "exact" }).limit(1)
    if (error) {
      dbReady = false
      dbError = error.message
    }
  } catch (error) {
    dbReady = false
    dbError = error instanceof Error ? error.message : "Unknown error"
  }

  return Response.json({
    status: "ok",
    module: "leave-native",
    backend: "attendance-next-api",
    dbReady,
    dbError,
    fallbackProxyConfigured,
    timestamp: new Date().toISOString(),
  })
}
