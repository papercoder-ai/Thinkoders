export const LEAVE_MODULE_OVERVIEW = {
  title: "Attendance + LeaveFlow Integration",
  subtitle: "LeaveFlow is reachable through unified Attendance API routes.",
  bridgeHealthPath: "GET /api/leave/health",
  webhookNote: "Route via LeaveFlow backend while Attendance remains primary shell",
}

export const LEAVE_MODULE_CARDS = [
  {
    title: "API Proxy Live",
    description: "Attendance now exposes LeaveFlow APIs from one domain and one session context.",
  },
  {
    title: "Safe Migration",
    description: "Existing Attendance flows stay unchanged while Leave features are progressively moved in.",
  },
  {
    title: "Next Step",
    description: "Add unified leave pages for requests, approvals, and balances.",
  },
]
