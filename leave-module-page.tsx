export const LEAVE_MODULE_OVERVIEW = {
  title: "Attendance Leave Module (Unified)",
  subtitle: "Leave management now runs natively on Attendance backend and Supabase.",
  bridgeHealthPath: "GET /api/leave/health (native)",
  webhookNote: "WhatsApp leave handling is served through Attendance backend APIs",
}

export const LEAVE_MODULE_CARDS = [
  {
    title: "Single Backend Active",
    description: "All supported leave APIs are served by Attendance Next.js route handlers.",
  },
  {
    title: "Single Database Active",
    description: "Leave data is stored in Supabase PostgreSQL under Attendance-managed schema.",
  },
  {
    title: "Run Everything",
    description: "Start unified app from root with one frontend and one backend runtime.",
  },
]
