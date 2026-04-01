-- LeaveFlow -> Attendance Unification (Phase 2)
-- Create native leave-management schema in Attendance Supabase DB

-- -------------------------------------------------------
-- 1) Enum types
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type') THEN
    CREATE TYPE leave_type AS ENUM ('casual', 'sick', 'special');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_duration_type') THEN
    CREATE TYPE leave_duration_type AS ENUM ('full', 'half_morning', 'half_afternoon');
  END IF;
END$$;

-- -------------------------------------------------------
-- 2) Core leave tables
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(5,2) NOT NULL CHECK (days > 0),
  leave_type leave_type NOT NULL,
  duration_type leave_duration_type NOT NULL DEFAULT 'full',
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_dates_valid CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  casual_balance NUMERIC(5,2) NOT NULL DEFAULT 12.0 CHECK (casual_balance >= 0),
  sick_balance NUMERIC(5,2) NOT NULL DEFAULT 12.0 CHECK (sick_balance >= 0),
  special_balance NUMERIC(5,2) NOT NULL DEFAULT 5.0 CHECK (special_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, year)
);

CREATE TABLE IF NOT EXISTS leave_balance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  days_changed NUMERIC(5,2) NOT NULL,
  balance_after NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL,
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_date DATE NOT NULL UNIQUE,
  holiday_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT,
  message TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_processed_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 3) Indexes
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leave_requests_profile ON leave_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_profile_year ON leave_balances(profile_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_history_profile ON leave_balance_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_leave_conversation_profile ON leave_conversation_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_leave_processed_message_id ON leave_processed_messages(message_id);

-- -------------------------------------------------------
-- 4) Updated-at trigger support for leave tables
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_leave_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_leave_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_balances_updated_at ON leave_balances;
CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_leave_updated_at_column();

-- -------------------------------------------------------
-- 5) Seed default balances for existing profiles (current year)
-- -------------------------------------------------------
INSERT INTO leave_balances (profile_id, year)
SELECT p.id, EXTRACT(YEAR FROM NOW())::INTEGER
FROM profiles p
ON CONFLICT (profile_id, year) DO NOTHING;
