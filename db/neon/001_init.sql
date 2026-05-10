-- ============================================================================
-- Cow Experiment Data Management System - Neon (vanilla Postgres) schema
-- ============================================================================
-- Adapted from supabase/migrations/001_initial_schema.sql for plain Postgres:
--   * dropped all references to auth.users / auth.uid()
--   * dropped Supabase-specific RLS (handled at app layer)
--   * replaced created_by/updated_by FKs to point at the local users table
--   * removed health_alert_notification trigger (depends on app-level auth)
-- Idempotent-ish: CREATE EXTENSION IF NOT EXISTS, but enums/tables assume a
-- clean database (drop & re-run the file if you need to reset).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
DO $$ BEGIN CREATE TYPE gender_type        AS ENUM ('male', 'female'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cow_status         AS ENUM ('active', 'culled', 'sold', 'dead'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE breed_type         AS ENUM ('holstein', 'jersey', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE health_status      AS ENUM ('good', 'fair', 'poor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE milking_session    AS ENUM ('morning', 'afternoon', 'evening'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE breeding_method    AS ENUM ('artificial_insemination', 'natural_mating'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pregnancy_result   AS ENUM ('confirmed', 'not_pregnant', 'pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cattle_group_type  AS ENUM ('lactating', 'dry', 'calf', 'heifer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE medical_type       AS ENUM ('vaccination', 'treatment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type  AS ENUM ('health_alert', 'breeding_reminder', 'inventory_warning', 'medical_reminder'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit_action       AS ENUM ('INSERT', 'UPDATE', 'DELETE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 用户表（独立，不依赖 auth.users）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(200) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'guest')),
  phone VARCHAR(20),
  farm_name VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- 奶牛档案
CREATE TABLE IF NOT EXISTS cows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  breed breed_type NOT NULL,
  gender gender_type NOT NULL,
  birth_date DATE NOT NULL,
  sire_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  dam_id  UUID REFERENCES cows(id) ON DELETE SET NULL,
  status cow_status DEFAULT 'active' NOT NULL,
  entry_date DATE NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT birth_before_entry CHECK (birth_date <= entry_date),
  CONSTRAINT valid_photo_url    CHECK (photo_url IS NULL OR photo_url ~* '^https?://')
);
CREATE INDEX IF NOT EXISTS idx_cows_number  ON cows(cow_number);
CREATE INDEX IF NOT EXISTS idx_cows_status  ON cows(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cows_breed   ON cows(breed);
CREATE INDEX IF NOT EXISTS idx_cows_sire    ON cows(sire_id) WHERE sire_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cows_dam     ON cows(dam_id)  WHERE dam_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cows_deleted ON cows(deleted_at) WHERE deleted_at IS NULL;

-- 健康记录
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  recorded_date DATE NOT NULL,
  temperature NUMERIC(4,1) CHECK (temperature BETWEEN 35.0 AND 45.0),
  mental_status health_status,
  appetite      health_status,
  fecal_condition VARCHAR(100),
  symptoms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_recorded_date CHECK (recorded_date <= CURRENT_DATE)
);
CREATE INDEX IF NOT EXISTS idx_health_cow     ON health_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_health_date    ON health_records(recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_temp    ON health_records(temperature) WHERE temperature >= 39.5;
CREATE INDEX IF NOT EXISTS idx_health_deleted ON health_records(deleted_at) WHERE deleted_at IS NULL;

-- 产奶记录
CREATE TABLE IF NOT EXISTS milk_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  recorded_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  session milking_session NOT NULL,
  amount NUMERIC(6,2) NOT NULL CHECK (amount >= 0),
  fat_rate NUMERIC(4,2) CHECK (fat_rate BETWEEN 0 AND 15),
  protein_rate NUMERIC(4,2) CHECK (protein_rate BETWEEN 0 AND 10),
  somatic_cell_count INTEGER CHECK (somatic_cell_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_recorded_datetime CHECK (recorded_datetime <= NOW())
);
CREATE INDEX IF NOT EXISTS idx_milk_cow      ON milk_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_milk_datetime ON milk_records(recorded_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_milk_deleted  ON milk_records(deleted_at) WHERE deleted_at IS NULL;

-- 繁殖记录
CREATE TABLE IF NOT EXISTS breeding_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dam_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  sire_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  calf_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  estrus_date DATE,
  breeding_date DATE NOT NULL,
  breeding_method breeding_method NOT NULL,
  semen_batch VARCHAR(100),
  pregnancy_check_date DATE,
  pregnancy_result pregnancy_result,
  expected_calving_date DATE,
  actual_calving_date DATE,
  is_difficult_birth BOOLEAN DEFAULT FALSE,
  calving_notes TEXT,
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT breeding_date_order CHECK (
    (estrus_date IS NULL OR estrus_date <= breeding_date) AND
    (pregnancy_check_date IS NULL OR breeding_date <= pregnancy_check_date) AND
    (expected_calving_date IS NULL OR breeding_date < expected_calving_date) AND
    (actual_calving_date IS NULL OR breeding_date < actual_calving_date)
  ),
  CONSTRAINT semen_batch_required CHECK (
    breeding_method = 'natural_mating' OR semen_batch IS NOT NULL
  )
);
CREATE INDEX IF NOT EXISTS idx_breeding_dam     ON breeding_records(dam_id);
CREATE INDEX IF NOT EXISTS idx_breeding_sire    ON breeding_records(sire_id);
CREATE INDEX IF NOT EXISTS idx_breeding_calf    ON breeding_records(calf_id);
CREATE INDEX IF NOT EXISTS idx_breeding_date    ON breeding_records(breeding_date DESC);
CREATE INDEX IF NOT EXISTS idx_breeding_calving ON breeding_records(expected_calving_date) WHERE pregnancy_result = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_breeding_deleted ON breeding_records(deleted_at) WHERE deleted_at IS NULL;

-- 饲料配方
CREATE TABLE IF NOT EXISTS feed_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_name VARCHAR(200) NOT NULL,
  cattle_group cattle_group_type NOT NULL,
  ingredients JSONB NOT NULL,
  nutrition_facts JSONB,
  unit_cost NUMERIC(10,2) CHECK (unit_cost >= 0),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_ingredients CHECK (jsonb_typeof(ingredients) = 'array'),
  CONSTRAINT valid_nutrition   CHECK (nutrition_facts IS NULL OR jsonb_typeof(nutrition_facts) = 'object')
);
CREATE INDEX IF NOT EXISTS idx_formula_group       ON feed_formulas(cattle_group);
CREATE INDEX IF NOT EXISTS idx_formula_active      ON feed_formulas(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_formula_deleted     ON feed_formulas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_formula_ingredients ON feed_formulas USING GIN (ingredients);

-- 投喂记录
CREATE TABLE IF NOT EXISTS feeding_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_id UUID REFERENCES cows(id) ON DELETE RESTRICT,
  formula_id UUID NOT NULL REFERENCES feed_formulas(id) ON DELETE RESTRICT,
  feeding_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC(8,2) NOT NULL CHECK (amount > 0),
  actual_cost NUMERIC(10,2),
  cattle_group cattle_group_type,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_feeding_datetime CHECK (feeding_datetime <= NOW()),
  CONSTRAINT cow_or_group CHECK (
    (cow_id IS NOT NULL AND cattle_group IS NULL) OR
    (cow_id IS NULL AND cattle_group IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_feeding_cow      ON feeding_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_feeding_formula  ON feeding_records(formula_id);
CREATE INDEX IF NOT EXISTS idx_feeding_datetime ON feeding_records(feeding_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_group    ON feeding_records(cattle_group);
CREATE INDEX IF NOT EXISTS idx_feeding_deleted  ON feeding_records(deleted_at) WHERE deleted_at IS NULL;

-- 医疗记录
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  veterinarian_id UUID REFERENCES users(id) ON DELETE SET NULL,
  record_type medical_type NOT NULL,
  performed_date DATE NOT NULL,
  vaccine_name VARCHAR(200),
  disease_diagnosis VARCHAR(200),
  treatment_plan TEXT,
  medications JSONB,
  next_appointment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_performed_date CHECK (performed_date <= CURRENT_DATE),
  CONSTRAINT vaccine_or_disease CHECK (
    (record_type = 'vaccination' AND vaccine_name IS NOT NULL) OR
    (record_type = 'treatment'   AND disease_diagnosis IS NOT NULL)
  ),
  CONSTRAINT valid_medications CHECK (medications IS NULL OR jsonb_typeof(medications) = 'array')
);
CREATE INDEX IF NOT EXISTS idx_medical_cow         ON medical_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_medical_vet         ON medical_records(veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_medical_date        ON medical_records(performed_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_type        ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_appointment ON medical_records(next_appointment_date) WHERE next_appointment_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_deleted     ON medical_records(deleted_at) WHERE deleted_at IS NULL;

-- 通知
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  related_cow_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_record_id UUID,
  related_table_name VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_type    ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);

-- 审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table     ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record    ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_logs(action);

-- ============================================================================
-- TRIGGERS (vanilla Postgres only — no auth.uid())
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_cows_updated_at      BEFORE UPDATE ON cows             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_health_updated_at    BEFORE UPDATE ON health_records   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_milk_updated_at      BEFORE UPDATE ON milk_records     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_breeding_updated_at  BEFORE UPDATE ON breeding_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_formula_updated_at   BEFORE UPDATE ON feed_formulas    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_feeding_updated_at   BEFORE UPDATE ON feeding_records  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_medical_updated_at   BEFORE UPDATE ON medical_records  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at     BEFORE UPDATE ON users            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
