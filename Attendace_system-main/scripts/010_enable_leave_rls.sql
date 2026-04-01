-- LeaveFlow -> Attendance Unification (Phase 2)
-- Enable RLS and create policies for native leave tables

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_processed_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotent reruns
DROP POLICY IF EXISTS "leave_requests_read_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_read_approvers" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_own" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_own_pending" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_approvers" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_service_role_all" ON leave_requests;

DROP POLICY IF EXISTS "leave_balances_read_own" ON leave_balances;
DROP POLICY IF EXISTS "leave_balances_read_approvers" ON leave_balances;
DROP POLICY IF EXISTS "leave_balances_service_role_all" ON leave_balances;

DROP POLICY IF EXISTS "leave_history_read_own" ON leave_balance_history;
DROP POLICY IF EXISTS "leave_history_read_approvers" ON leave_balance_history;
DROP POLICY IF EXISTS "leave_history_service_role_all" ON leave_balance_history;

DROP POLICY IF EXISTS "leave_holidays_read_all" ON leave_holidays;
DROP POLICY IF EXISTS "leave_holidays_manage_approvers" ON leave_holidays;
DROP POLICY IF EXISTS "leave_holidays_service_role_all" ON leave_holidays;

DROP POLICY IF EXISTS "leave_conversation_read_own" ON leave_conversation_history;
DROP POLICY IF EXISTS "leave_conversation_service_role_all" ON leave_conversation_history;

DROP POLICY IF EXISTS "leave_processed_messages_service_role_all" ON leave_processed_messages;

-- -------------------------------------------------------
-- leave_requests
-- -------------------------------------------------------
CREATE POLICY "leave_requests_read_own"
ON leave_requests FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "leave_requests_read_approvers"
ON leave_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
);

CREATE POLICY "leave_requests_insert_own"
ON leave_requests FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "leave_requests_update_own_pending"
ON leave_requests FOR UPDATE
TO authenticated
USING (profile_id = auth.uid() AND status = 'pending')
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "leave_requests_update_approvers"
ON leave_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
);

CREATE POLICY "leave_requests_service_role_all"
ON leave_requests FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------
-- leave_balances
-- -------------------------------------------------------
CREATE POLICY "leave_balances_read_own"
ON leave_balances FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "leave_balances_read_approvers"
ON leave_balances FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
);

CREATE POLICY "leave_balances_service_role_all"
ON leave_balances FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------
-- leave_balance_history
-- -------------------------------------------------------
CREATE POLICY "leave_history_read_own"
ON leave_balance_history FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "leave_history_read_approvers"
ON leave_balance_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
);

CREATE POLICY "leave_history_service_role_all"
ON leave_balance_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------
-- leave_holidays
-- -------------------------------------------------------
CREATE POLICY "leave_holidays_read_all"
ON leave_holidays FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "leave_holidays_manage_approvers"
ON leave_holidays FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hod')
  )
);

CREATE POLICY "leave_holidays_service_role_all"
ON leave_holidays FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------
-- leave_conversation_history
-- -------------------------------------------------------
CREATE POLICY "leave_conversation_read_own"
ON leave_conversation_history FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "leave_conversation_service_role_all"
ON leave_conversation_history FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------
-- leave_processed_messages
-- -------------------------------------------------------
CREATE POLICY "leave_processed_messages_service_role_all"
ON leave_processed_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
