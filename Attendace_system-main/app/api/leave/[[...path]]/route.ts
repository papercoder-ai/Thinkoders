import { type NextRequest, NextResponse } from "next/server"
import {
	buildLeaveflowTargetUrl,
	getLeaveflowBaseUrl,
	pickForwardHeaders,
} from "@/lib/leaveflow-proxy-common"

async function proxyRequest(request: NextRequest, path: string[] | undefined, method: string) {
	const base = getLeaveflowBaseUrl(process.env.LEAVEFLOW_API_URL)

	if (!base) {
		return NextResponse.json(
			{
				error: "LeaveFlow bridge is not configured",
				hint: "Set LEAVEFLOW_API_URL in your environment",
			},
			{ status: 503 },
		)
	}

	const targetUrl = buildLeaveflowTargetUrl(base, path, request.nextUrl.search || "")

	try {
		const headers = new Headers(pickForwardHeaders((name) => request.headers.get(name)))
		const init: RequestInit = { method, headers }

		if (!["GET", "HEAD"].includes(method)) {
			const rawBody = await request.text()
			if (rawBody) {
				init.body = rawBody
			}
		}

		const response = await fetch(targetUrl, init)
		const responseText = await response.text()

		const passthroughHeaders = new Headers()
		const contentType = response.headers.get("content-type")
		if (contentType) {
			passthroughHeaders.set("content-type", contentType)
		}

		return new NextResponse(responseText, {
			status: response.status,
			headers: passthroughHeaders,
		})
	} catch (error) {
		console.error("LeaveFlow proxy error:", error)
		return NextResponse.json({ error: "Failed to reach LeaveFlow backend" }, { status: 502 })
	}
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return proxyRequest(request, path, "GET")
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return proxyRequest(request, path, "POST")
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return proxyRequest(request, path, "PUT")
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return proxyRequest(request, path, "PATCH")
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return proxyRequest(request, path, "DELETE")
}
