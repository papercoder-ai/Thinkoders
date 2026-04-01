import { redirect } from "next/navigation"
import Link from "next/link"
import { CalendarDays, MessageCircle, ShieldCheck } from "lucide-react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LEAVE_MODULE_CARDS, LEAVE_MODULE_OVERVIEW } from "@/lib/leave-module-shared"
import { createClient } from "@/lib/server"

export default async function LeaveModulePage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect("/login")
	}

	return (
		<>
			<Header title="Leave Module" />
			<div className="p-6 space-y-6">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<CalendarDays className="h-5 w-5" />
								{LEAVE_MODULE_OVERVIEW.title}
							</CardTitle>
							<Badge variant="secondary">Phase 1</Badge>
						</div>
						<CardDescription>{LEAVE_MODULE_OVERVIEW.subtitle}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-muted-foreground">
						<p>
							This page confirms the first integration slice is active. Leave endpoints are available via
							<span className="font-medium text-foreground"> /api/leave/*</span> and can be consumed by unified UI screens.
						</p>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="rounded-lg border p-4">
								<p className="font-medium text-foreground mb-1">Bridge Health Check</p>
								<p>{LEAVE_MODULE_OVERVIEW.bridgeHealthPath}</p>
							</div>
							<div className="rounded-lg border p-4">
								<p className="font-medium text-foreground mb-1">WhatsApp Leave Webhook</p>
								<p>{LEAVE_MODULE_OVERVIEW.webhookNote}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<MessageCircle className="h-4 w-4" />
								{LEAVE_MODULE_CARDS[0].title}
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">{LEAVE_MODULE_CARDS[0].description}</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<ShieldCheck className="h-4 w-4" />
								{LEAVE_MODULE_CARDS[1].title}
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">{LEAVE_MODULE_CARDS[1].description}</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">{LEAVE_MODULE_CARDS[2].title}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground space-y-2">
							<p>{LEAVE_MODULE_CARDS[2].description}</p>
							<Link href="/leave/requests" className="text-primary hover:underline block">
								Open Leave Requests
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	)
}
