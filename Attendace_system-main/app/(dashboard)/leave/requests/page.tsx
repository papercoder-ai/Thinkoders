import { Header } from "@/components/header"
import { LeaveRequestsClient } from "@/components/leave-requests-client"

export default function LeaveRequestsPage() {
  return (
    <>
      <Header title="Leave Requests" />
      <div className="p-6">
        <LeaveRequestsClient />
      </div>
    </>
  )
}
