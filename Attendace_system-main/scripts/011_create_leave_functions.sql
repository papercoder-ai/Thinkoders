-- LeaveFlow -> Attendance Unification (Phase 2)
-- Helper and transactional functions for native leave processing

-- Ensure yearly leave balance exists for a profile
CREATE OR REPLACE FUNCTION ensure_leave_balance(
  p_profile_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO leave_balances (profile_id, year)
  VALUES (p_profile_id, p_year)
  ON CONFLICT (profile_id, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic decision processor for leave requests
CREATE OR REPLACE FUNCTION process_leave_request_decision(
  p_request_id UUID,
  p_reviewer_id UUID,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_request leave_requests%ROWTYPE;
  v_year INTEGER;
  v_new_balance NUMERIC(5,2);
  v_balance leave_balances%ROWTYPE;
BEGIN
  IF p_action NOT IN ('approve', 'reject', 'cancel') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  SELECT * INTO v_request
  FROM leave_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found: %', p_request_id;
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be processed. Current status: %', v_request.status;
  END IF;

  IF p_action = 'approve' THEN
    v_year := EXTRACT(YEAR FROM v_request.start_date)::INTEGER;

    PERFORM ensure_leave_balance(v_request.profile_id, v_year);

    SELECT * INTO v_balance
    FROM leave_balances
    WHERE profile_id = v_request.profile_id AND year = v_year
    FOR UPDATE;

    IF v_request.leave_type = 'casual' THEN
      IF v_balance.casual_balance < v_request.days THEN
        RAISE EXCEPTION 'Insufficient casual balance';
      END IF;
      v_new_balance := v_balance.casual_balance - v_request.days;
      UPDATE leave_balances
      SET casual_balance = v_new_balance, updated_at = NOW()
      WHERE id = v_balance.id;
    ELSIF v_request.leave_type = 'sick' THEN
      IF v_balance.sick_balance < v_request.days THEN
        RAISE EXCEPTION 'Insufficient sick balance';
      END IF;
      v_new_balance := v_balance.sick_balance - v_request.days;
      UPDATE leave_balances
      SET sick_balance = v_new_balance, updated_at = NOW()
      WHERE id = v_balance.id;
    ELSE
      IF v_balance.special_balance < v_request.days THEN
        RAISE EXCEPTION 'Insufficient special balance';
      END IF;
      v_new_balance := v_balance.special_balance - v_request.days;
      UPDATE leave_balances
      SET special_balance = v_new_balance, updated_at = NOW()
      WHERE id = v_balance.id;
    END IF;

    INSERT INTO leave_balance_history (
      profile_id,
      leave_type,
      days_changed,
      balance_after,
      reason,
      leave_request_id
    ) VALUES (
      v_request.profile_id,
      v_request.leave_type,
      -v_request.days,
      v_new_balance,
      'Leave approved',
      v_request.id
    );

    UPDATE leave_requests
    SET
      status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      rejection_reason = NULL,
      updated_at = NOW()
    WHERE id = v_request.id
    RETURNING * INTO v_request;

  ELSIF p_action = 'reject' THEN
    UPDATE leave_requests
    SET
      status = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      rejection_reason = COALESCE(p_rejection_reason, 'Rejected'),
      updated_at = NOW()
    WHERE id = v_request.id
    RETURNING * INTO v_request;

  ELSE
    -- cancel
    UPDATE leave_requests
    SET
      status = 'cancelled',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_request.id
    RETURNING * INTO v_request;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'status', v_request.status,
    'profile_id', v_request.profile_id,
    'days', v_request.days,
    'leave_type', v_request.leave_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION ensure_leave_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION process_leave_request_decision(UUID, UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION ensure_leave_balance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_leave_balance(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION process_leave_request_decision(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_leave_request_decision(UUID, UUID, TEXT, TEXT) TO service_role;
