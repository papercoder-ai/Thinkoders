import { spawn, spawnSync } from "node:child_process"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"

function needsShell(command) {
  return process.platform === "win32" && command.toLowerCase().includes("npm")
}

function printHelp() {
  console.log(`Usage: node scripts/dev-unified.mjs [options]

Options:
  --with-legacy-leaveflow  Start legacy LeaveFlow backend sidecar with Attendance
  --with-dashboard         Start LeaveFlow dashboard (requires --with-legacy-leaveflow)
  --help             Show this help message
`)
}

function runSync(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: needsShell(command),
  })

  if (result.error) {
    console.error(`[unified] Failed to run ${command}: ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function resolvePython() {
  const candidates = process.platform === "win32"
    ? [
        { cmd: "py", prefix: ["-3"] },
        { cmd: "python", prefix: [] },
      ]
    : [
        { cmd: "python3", prefix: [] },
        { cmd: "python", prefix: [] },
      ]

  for (const candidate of candidates) {
    const test = spawnSync(candidate.cmd, [...candidate.prefix, "--version"], {
      cwd: root,
      stdio: "ignore",
    })
    if (test.status === 0) {
      return candidate
    }
  }

  throw new Error("Python runtime not found. Install Python 3 and ensure it is available in PATH.")
}

const args = new Set(process.argv.slice(2))

if (args.has("--help")) {
  printHelp()
  process.exit(0)
}

const withLegacyLeaveflow = args.has("--with-legacy-leaveflow")
const withDashboard = args.has("--with-dashboard")

if (withDashboard && !withLegacyLeaveflow) {
  console.error("[unified] --with-dashboard requires --with-legacy-leaveflow")
  process.exit(1)
}

console.log("[unified] Syncing root common files...")
runSync(npmCmd, ["run", "sync:common"])

const processes = []
let shuttingDown = false

function start(name, command, commandArgs, cwd = root) {
  const child = spawn(command, commandArgs, {
    cwd,
    stdio: "inherit",
    shell: needsShell(command),
  })

  child.on("exit", (code, signal) => {
    if (shuttingDown) return
    console.log(`[unified] ${name} exited (code=${code ?? "null"}, signal=${signal ?? "null"})`)
    shutdown(code ?? 0)
  })

  processes.push({ name, child })
  console.log(`[unified] started ${name}`)
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const proc of processes) {
    if (!proc.child.killed) {
      proc.child.kill("SIGTERM")
    }
  }

  setTimeout(() => process.exit(code), 300)
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

start("attendance", npmCmd, ["--prefix", "Attendace_system-main", "run", "dev"], root)

if (withLegacyLeaveflow) {
  const python = resolvePython()
  start(
    "leaveflow-backend",
    python.cmd,
    [...python.prefix, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
    path.join(root, "LeaveFlow-main", "backend"),
  )

  if (withDashboard) {
    start("leaveflow-dashboard", npmCmd, ["--prefix", "LeaveFlow-main/dashboard", "run", "dev"], root)
  }
}

console.log("[unified] running. Press Ctrl+C to stop all services.")
