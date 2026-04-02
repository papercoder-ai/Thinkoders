# Attendance + LeaveFlow Integration (Root Unified View)

This is the root-level source of truth for common integration files.

## Architecture Status

- Frontend: one (`Attendace_system-main`, Next.js)
- Backend: one (`Attendace_system-main` Next.js API routes)
- Database: one (Supabase PostgreSQL)
- Legacy LeaveFlow backend is optional and no longer required for core leave flow.

## Root Common Files

- `leave-domain-common.ts`
- `leave-module-page.tsx`
- `.env.example`
- `package.json`
- `scripts/sync-common-files.mjs`

## Runtime Compatibility Note

Next.js production build in `Attendace_system-main` requires runtime imports from inside that project.
To keep root as source-of-truth while preserving build reliability:

- Root files stay canonical.
- `npm run sync:common` copies root common files into `Attendace_system-main/lib/*` runtime mirrors.

## Root Commands

- Install Attendance deps: `npm run install:attendance`
- Install LeaveFlow backend deps: `npm run install:leaveflow:backend`
- Install LeaveFlow dashboard deps: `npm run install:leaveflow:dashboard`
- Install all deps: `npm run install:all`
- Sync common files: `npm run sync:common`
- Run unified app (one frontend + one backend): `npm run dev`
- Run legacy Attendance + LeaveFlow backend sidecar: `npm run dev:unified:legacy`
- Run legacy sidecar + LeaveFlow dashboard: `npm run dev:unified:full`
- Build unified Attendance shell: `npm run build`

## Native Leave Migration SQL (run in order)

1. `Attendace_system-main/scripts/009_create_leave_schema.sql`
2. `Attendace_system-main/scripts/010_enable_leave_rls.sql`
3. `Attendace_system-main/scripts/011_create_leave_functions.sql`
