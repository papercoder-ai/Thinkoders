# Attendance + LeaveFlow Integration (Project Local Pointer)

The root-level source of truth now lives at:

- `../INTEGRATION_ATTENDANCE_LEAVEFLOW.md`

## Local Runtime Notes

- Attendance imports shared integration helpers from `lib/*` runtime mirrors for Next build compatibility.
- Update root common files first, then run from workspace root:

```bash
npm run sync:common
```

## SQL Migration Order (Supabase)

1. `scripts/009_create_leave_schema.sql`
2. `scripts/010_enable_leave_rls.sql`
3. `scripts/011_create_leave_functions.sql`
