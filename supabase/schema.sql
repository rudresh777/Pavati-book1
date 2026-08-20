-- ==============================================================================
-- DIGITAL PAVTI BOOK - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor to create all required tables,
-- functions, indexes, and initial configuration.
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. MANDAL SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mandal_settings (
  id TEXT PRIMARY KEY DEFAULT 'mandal-settings-default',
  mandal_name_marathi TEXT NOT NULL DEFAULT 'मोरया गणेशोत्सव मंडळ',
  mandal_name_english TEXT NOT NULL DEFAULT 'Morya Ganeshotsav Mandal',
  reg_number TEXT DEFAULT '',
  location_marathi TEXT DEFAULT 'अकोला, महाराष्ट्र',
  location_english TEXT DEFAULT 'Akola, Maharashtra',
  address_marathi TEXT DEFAULT 'तापडिया नगर अकोला 444001',
  address_english TEXT DEFAULT 'Tapadia Nagar Akola 444001',
  contact_number TEXT DEFAULT '',
  alternate_contact TEXT DEFAULT '',
  whatsapp_group_link TEXT DEFAULT '',
  default_whatsapp_message TEXT DEFAULT '॥ श्री गणेशाय नमः ॥\n\nसस्नेह नमस्कार {donor_name} जी,\n\n{mandal_name} तर्फे सन {year} च्या गणेशोत्सवासाठी आपली ₹{amount}/- ची देणगी / वर्गणी अधिकृतपणे जमा झाली आहे.\n\nपावती क्र: {receipt_no}\nदिनांक: {date}\n\nआपली डिजिटल पावती सोबत जोडली आहे. बाप्पाच्या कृपेने आपल्या सर्व मनोकामना पूर्ण होवोत हीच प्रार्थना!\n\n॥ गणपती बाप्पा मोरया ॥',
  year TEXT DEFAULT '२०२६',
  logo_url TEXT,
  tagline_marathi TEXT DEFAULT '॥ श्री गणेशाय नमः ॥',
  slogan_marathi TEXT DEFAULT '॥ गणपती बाप्पा मोरया ॥',
  receipt_prefix TEXT DEFAULT '',
  starting_receipt_number INT DEFAULT 1,
  enable_partial_payments BOOLEAN DEFAULT TRUE,
  enable_whatsapp_group_invite BOOLEAN DEFAULT TRUE,
  designations JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'HOST')),
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. DONORS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT DEFAULT '',
  address TEXT DEFAULT '',
  total_contributed NUMERIC DEFAULT 0,
  pavti_count INT DEFAULT 0,
  last_payment_date TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('LIVE', 'TEST')),
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast donor searches and mobile lookups
CREATE INDEX IF NOT EXISTS idx_donors_mode ON donors(mode);
CREATE INDEX IF NOT EXISTS idx_donors_mobile ON donors(mobile);
CREATE INDEX IF NOT EXISTS idx_donors_name ON donors(name);

-- ------------------------------------------------------------------------------
-- 4. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  receipt_number TEXT,
  numeric_receipt_number INT,
  donor_id TEXT REFERENCES donors(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_mobile TEXT DEFAULT '',
  donor_address TEXT DEFAULT '',
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  received_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DUE', 'PAID', 'CANCELLED', 'PENDING', 'PARTIALLY_PAID')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'DUE')),
  transaction_reference TEXT DEFAULT '',
  date TEXT NOT NULL,
  host_id TEXT,
  host_name TEXT,
  notes TEXT DEFAULT '',
  mode TEXT NOT NULL CHECK (mode IN ('LIVE', 'TEST')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_mode ON payments(mode);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_donor_id ON payments(donor_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- ------------------------------------------------------------------------------
-- 5. PAVTIS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pavtis (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  numeric_receipt_number INT,
  payment_id TEXT REFERENCES payments(id) ON DELETE CASCADE,
  donor_id TEXT,
  donor_name TEXT NOT NULL,
  donor_mobile TEXT DEFAULT '',
  donor_address TEXT DEFAULT '',
  amount NUMERIC NOT NULL,
  amount_in_words_marathi TEXT DEFAULT '',
  amount_in_words_english TEXT DEFAULT '',
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'PAID',
  transaction_reference TEXT DEFAULT '',
  date TEXT NOT NULL,
  host_name TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('LIVE', 'TEST')),
  image_file_id TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pavtis_mode ON pavtis(mode);
CREATE INDEX IF NOT EXISTS idx_pavtis_receipt_number ON pavtis(receipt_number);
CREATE INDEX IF NOT EXISTS idx_pavtis_payment_id ON pavtis(payment_id);
CREATE INDEX IF NOT EXISTS idx_pavtis_donor_id ON pavtis(donor_id);

-- ------------------------------------------------------------------------------
-- 6. ANNOUNCEMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title_marathi TEXT NOT NULL,
  title_english TEXT DEFAULT '',
  content_marathi TEXT NOT NULL,
  content_english TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED')),
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT')),
  event_date TEXT,
  venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);

-- ------------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  userName TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('LIVE', 'TEST')),
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_mode ON audit_logs(mode);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ------------------------------------------------------------------------------
-- 8. RECEIPT COUNTERS TABLE (Atomic Sequential Numbering)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipt_counters (
  mode TEXT PRIMARY KEY CHECK (mode IN ('LIVE', 'TEST')),
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial counters
INSERT INTO receipt_counters (mode, last_number)
VALUES ('LIVE', 0), ('TEST', 0)
ON CONFLICT (mode) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. ATOMIC RECEIPT NUMBER GENERATOR FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_receipt_number_atomic(p_mode TEXT)
RETURNS JSONB AS $$
DECLARE
  v_next_num INT;
  v_prefix TEXT;
  v_formatted TEXT;
  v_start_num INT;
BEGIN
  -- Get settings prefix and starting number
  SELECT COALESCE(receipt_prefix, ''), COALESCE(starting_receipt_number, 1)
  INTO v_prefix, v_start_num
  FROM mandal_settings
  LIMIT 1;

  IF v_prefix IS NULL THEN
    v_prefix := '';
  END IF;
  IF v_start_num IS NULL THEN
    v_start_num := 1;
  END IF;

  -- Atomically increment counter with row-level lock
  UPDATE receipt_counters
  SET last_number = GREATEST(last_number, v_start_num - 1) + 1,
      updated_at = NOW()
  WHERE mode = p_mode
  RETURNING last_number INTO v_next_num;

  -- If no counter record existed, create one
  IF NOT FOUND THEN
    v_next_num := v_start_num;
    INSERT INTO receipt_counters (mode, last_number, updated_at)
    VALUES (p_mode, v_next_num, NOW())
    ON CONFLICT (mode) DO UPDATE
      SET last_number = receipt_counters.last_number + 1,
          updated_at = NOW()
    RETURNING last_number INTO v_next_num;
  END IF;

  -- Format with 6 digits (e.g. 000001 or GPB-000001)
  v_formatted := v_prefix || LPAD(v_next_num::TEXT, 6, '0');

  RETURN jsonb_build_object(
    'numeric', v_next_num,
    'formatted', v_formatted
  );
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE mandal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pavtis ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_counters ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active announcements and settings for public home page
CREATE POLICY "Public can view mandal settings" ON mandal_settings
  FOR SELECT USING (true);

CREATE POLICY "Public can view active announcements" ON announcements
  FOR SELECT USING (active = true AND status = 'PUBLISHED');

CREATE POLICY "Public can view receipts for verification" ON pavtis
  FOR SELECT USING (true);

-- Service role bypasses RLS automatically. For authenticated anon operations:
CREATE POLICY "Full access for service role on mandal_settings" ON mandal_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on donors" ON donors
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on pavtis" ON pavtis
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on announcements" ON announcements
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on audit_logs" ON audit_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Full access for service role on receipt_counters" ON receipt_counters
  FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 11. DEFAULT INITIAL SEED DATA
-- ------------------------------------------------------------------------------
INSERT INTO mandal_settings (
  id, mandal_name_marathi, mandal_name_english, reg_number,
  location_marathi, location_english, address_marathi, address_english,
  contact_number, alternate_contact, whatsapp_group_link,
  year, tagline_marathi, slogan_marathi, receipt_prefix, starting_receipt_number,
  enable_partial_payments, enable_whatsapp_group_invite, designations
)
VALUES (
  'mandal-settings-default',
  'मोरया गणेशोत्सव मंडळ',
  'Morya Ganeshotsav Mandal',
  'महा/१२३/२०२६/अकोला',
  'अकोला, महाराष्ट्र',
  'Akola, Maharashtra',
  'तापडिया नगर अकोला 444001',
  'Tapadia Nagar Akola 444001',
  '9876543210',
  '9123456789',
  'https://chat.whatsapp.com/sample-ganesh-mandal-group',
  '२०२६',
  '॥ श्री गणेशाय नमः ॥',
  '॥ गणपती बाप्पा मोरया ॥',
  '',
  1,
  true,
  true,
  '[
    {"id": "desig-1", "titleMarathi": "अध्यक्ष", "titleEnglish": "President", "name": "श्री. रमेश पाटील", "enabled": true},
    {"id": "desig-2", "titleMarathi": "सचिव", "titleEnglish": "Secretary", "name": "श्री. सुरेश जोशी", "enabled": true},
    {"id": "desig-3", "titleMarathi": "खजिनदार", "titleEnglish": "Treasurer", "name": "श्री. सचिन शिंदे", "enabled": true}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed default admin and host users (password hashes: admin123, host123)
INSERT INTO users (id, name, email, password_hash, role, phone, active)
VALUES
(
  'user-admin-1',
  'सुपर ॲडमिन (Super Admin)',
  'admin@mandal.org',
  '$2a$10$RyuEfB5e/Qk5VlwI5eYkwOpOh4WAUteeU5YhA7P/NVQKxMHW4VMmi',
  'SUPER_ADMIN',
  '9876543210',
  true
),
(
  'user-host-1',
  'मंडळ प्रतिनिधी (Field Host)',
  'host@mandal.org',
  '$2a$10$mqpl/JXOCjTIvTEy6BwUeuCsjkHw30f3f2w37/4KwXkL3IcTzNnNO',
  'HOST',
  '9822000000',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Seed initial announcement
INSERT INTO announcements (
  id, title_marathi, title_english, content_marathi, content_english,
  date, time, active, status, priority, venue
)
VALUES (
  'ann-seed-1',
  'श्री गणपती बाप्पाचे आगमन व भव्य मिरवणूक',
  'Grand Ganeshotsav Welcoming Procession',
  'सर्व गणेशभक्तांना सस्नेह जय गणेश! अत्यंत जल्लोषात आणि उत्साहात कळविण्यात येते की, आपल्या लाडक्या बाप्पाचे भव्य आगमन होणार आहे.',
  'All devotees are cordially invited for the grand welcoming procession of Lord Ganesha.',
  '2026-09-13',
  '18:00',
  true,
  'PUBLISHED',
  'NORMAL',
  'Ratan Lal Plot Chowk'
)
ON CONFLICT (id) DO NOTHING;
