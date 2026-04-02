import { type NextRequest, NextResponse } from "next/server"

const NATIVE_ENDPOINTS = [
	"GET /api/leave/health",
	"GET /api/leave/balance",
	"GET /api/leave/requests",
	"POST /api/leave/requests",
	"POST /api/leave/requests/:id/approve",
	"POST /api/leave/requests/:id/reject",
	"POST /api/leave/requests/:id/cancel",
]

async function notImplemented(path: string[] | undefined) {
	const suffix = (path || []).join("/")
	const requested = suffix ? `/api/leave/${suffix}` : "/api/leave"

	return NextResponse.json(
		{
			error: "Route not implemented in native leave backend",
			requested,
			backend: "attendance-next-api",
			nativeEndpoints: NATIVE_ENDPOINTS,
		},
		{ status: 404 },
	)
}

export async function GET(_request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return notImplemented(path)
}

export async function POST(_request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return notImplemented(path)
}

export async function PUT(_request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return notImplemented(path)
}

export async function PATCH(_request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return notImplemented(path)
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path } = await context.params
	return notImplemented(path)
}
