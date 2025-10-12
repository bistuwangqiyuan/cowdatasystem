-- ============================================================================
-- Cow Experiment Data Management System - Database Migration Script
-- ============================================================================
-- Feature: 001-netlify
-- Date: 2025-10-12
-- Database: Supabase PostgreSQL
-- Description: Complete database schema with tables, enums, indexes, and triggers
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm extension for full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================

CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE cow_status AS ENUM ('active', 'culled', 'sold', 'dead');
CREATE TYPE breed_type AS ENUM ('holstein', 'jersey', 'other');
CREATE TYPE health_status AS ENUM ('good', 'fair', 'poor');
CREATE TYPE milking_session AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE breeding_method AS ENUM ('artificial_insemination', 'natural_mating');
CREATE TYPE pregnancy_result AS ENUM ('confirmed', 'not_pregnant', 'pending');
CREATE TYPE cattle_group_type AS ENUM ('lactating', 'dry', 'calf', 'heifer');
CREATE TYPE medical_type AS ENUM ('vaccination', 'treatment');
CREATE TYPE notification_type AS ENUM ('health_alert', 'breeding_reminder', 'inventory_warning', 'medical_reminder');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- 2.1 users (扩展 Supabase Auth 用户信息)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'guest')),
  phone VARCHAR(20),
  farm_name VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
COMMENT ON TABLE users IS '用户扩展信息表，存储角色和养殖场信息';

-- 2.2 cows (奶牛档案)
CREATE TABLE cows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  breed breed_type NOT NULL,
  gender gender_type NOT NULL,
  birth_date DATE NOT NULL,
  sire_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  dam_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  status cow_status DEFAULT 'active' NOT NULL,
  entry_date DATE NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT birth_before_entry CHECK (birth_date <= entry_date),
  CONSTRAINT valid_photo_url CHECK (photo_url IS NULL OR photo_url ~* '^https?://')
);

CREATE INDEX idx_cows_number ON cows(cow_number);
CREATE INDEX idx_cows_status ON cows(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cows_breed ON cows(breed);
CREATE INDEX idx_cows_sire ON cows(sire_id) WHERE sire_id IS NOT NULL;
CREATE INDEX idx_cows_dam ON cows(dam_id) WHERE dam_id IS NOT NULL;
CREATE INDEX idx_cows_deleted ON cows(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_cows_search ON cows USING GIN (
  to_tsvector('simple', coalesce(cow_number, '') || ' ' || coalesce(name, ''))
);
COMMENT ON TABLE cows IS '奶牛档案表，存储基本信息和系谱';

-- 2.3 health_records (健康记录)
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  recorded_date DATE NOT NULL,
  temperature NUMERIC(4,1) CHECK (temperature BETWEEN 35.0 AND 45.0),
  mental_status health_status,
  appetite health_status,
  fecal_condition VARCHAR(100),
  symptoms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_cow_date UNIQUE (cow_id, recorded_date, deleted_at),
  CONSTRAINT valid_recorded_date CHECK (recorded_date <= CURRENT_DATE)
);

CREATE INDEX idx_health_cow ON health_records(cow_id);
CREATE INDEX idx_health_date ON health_records(recorded_date DESC);
CREATE INDEX idx_health_temp ON health_records(temperature) WHERE temperature >= 39.5;
CREATE INDEX idx_health_deleted ON health_records(deleted_at) WHERE deleted_at IS NULL;
COMMENT ON TABLE health_records IS '奶牛每日健康监测记录';

-- 2.4 milk_records (产奶记录)
CREATE TABLE milk_records (
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_recorded_datetime CHECK (recorded_datetime <= NOW())
);

CREATE INDEX idx_milk_cow ON milk_records(cow_id);
CREATE INDEX idx_milk_datetime ON milk_records(recorded_datetime DESC);
CREATE INDEX idx_milk_date ON milk_records(DATE(recorded_datetime) DESC);
CREATE INDEX idx_milk_deleted ON milk_records(deleted_at) WHERE deleted_at IS NULL;
COMMENT ON TABLE milk_records IS '产奶记录表，记录每次挤奶的产量和质量';

-- 2.5 breeding_records (繁殖记录)
CREATE TABLE breeding_records (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
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

CREATE INDEX idx_breeding_dam ON breeding_records(dam_id);
CREATE INDEX idx_breeding_sire ON breeding_records(sire_id);
CREATE INDEX idx_breeding_calf ON breeding_records(calf_id);
CREATE INDEX idx_breeding_date ON breeding_records(breeding_date DESC);
CREATE INDEX idx_breeding_calving ON breeding_records(expected_calving_date) WHERE pregnancy_result = 'confirmed';
CREATE INDEX idx_breeding_deleted ON breeding_records(deleted_at) WHERE deleted_at IS NULL;
COMMENT ON TABLE breeding_records IS '繁殖记录表，跟踪从发情到产犊的完整周期';

-- 2.6 feed_formulas (饲料配方)
CREATE TABLE feed_formulas (
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_ingredients CHECK (jsonb_typeof(ingredients) = 'array'),
  CONSTRAINT valid_nutrition CHECK (nutrition_facts IS NULL OR jsonb_typeof(nutrition_facts) = 'object')
);

CREATE INDEX idx_formula_group ON feed_formulas(cattle_group);
CREATE INDEX idx_formula_active ON feed_formulas(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_formula_deleted ON feed_formulas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_formula_ingredients ON feed_formulas USING GIN (ingredients);
COMMENT ON TABLE feed_formulas IS '饲料配方表，定义各类牛群的饲料组成';

-- 2.7 feeding_records (投喂记录)
CREATE TABLE feeding_records (
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_feeding_datetime CHECK (feeding_datetime <= NOW()),
  CONSTRAINT cow_or_group CHECK (
    (cow_id IS NOT NULL AND cattle_group IS NULL) OR
    (cow_id IS NULL AND cattle_group IS NOT NULL)
  )
);

CREATE INDEX idx_feeding_cow ON feeding_records(cow_id);
CREATE INDEX idx_feeding_formula ON feeding_records(formula_id);
CREATE INDEX idx_feeding_datetime ON feeding_records(feeding_datetime DESC);
CREATE INDEX idx_feeding_group ON feeding_records(cattle_group);
CREATE INDEX idx_feeding_deleted ON feeding_records(deleted_at) WHERE deleted_at IS NULL;
COMMENT ON TABLE feeding_records IS '投喂记录表，记录每次饲料投喂';

-- 2.8 medical_records (疫苗与治疗记录)
CREATE TABLE medical_records (
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_performed_date CHECK (performed_date <= CURRENT_DATE),
  CONSTRAINT vaccine_or_disease CHECK (
    (record_type = 'vaccination' AND vaccine_name IS NOT NULL) OR
    (record_type = 'treatment' AND disease_diagnosis IS NOT NULL)
  ),
  CONSTRAINT valid_medications CHECK (medications IS NULL OR jsonb_typeof(medications) = 'array')
);

CREATE INDEX idx_medical_cow ON medical_records(cow_id);
CREATE INDEX idx_medical_vet ON medical_records(veterinarian_id);
CREATE INDEX idx_medical_date ON medical_records(performed_date DESC);
CREATE INDEX idx_medical_type ON medical_records(record_type);
CREATE INDEX idx_medical_appointment ON medical_records(next_appointment_date) WHERE next_appointment_date IS NOT NULL;
CREATE INDEX idx_medical_deleted ON medical_records(deleted_at) WHERE deleted_at IS NULL;
COMMENT ON TABLE medical_records IS '医疗记录表，包括疫苗接种和疾病治疗';

-- 2.9 notifications (通知)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_cow_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_record_id UUID,
  related_table_name VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_type ON notifications(notification_type);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);
COMMENT ON TABLE notifications IS '系统通知表，推送健康预警、繁殖提醒等';

-- 2.10 audit_logs (审计日志)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_old_value ON audit_logs USING GIN (old_value);
CREATE INDEX idx_audit_new_value ON audit_logs USING GIN (new_value);
COMMENT ON TABLE audit_logs IS '审计日志表，记录所有数据变更操作，永久保留';

-- ============================================================================
-- SECTION 3: VIEWS
-- ============================================================================

CREATE VIEW active_cows AS
SELECT * FROM cows
WHERE deleted_at IS NULL AND status = 'active';

CREATE VIEW recent_health_records AS
SELECT hr.*, c.cow_number, c.name AS cow_name, u.full_name AS recorded_by_name
FROM health_records hr
JOIN cows c ON hr.cow_id = c.id
JOIN users u ON hr.created_by = u.id
WHERE hr.deleted_at IS NULL
  AND hr.recorded_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY hr.recorded_date DESC, c.cow_number;

CREATE VIEW monthly_milk_stats AS
SELECT
  c.id AS cow_id,
  c.cow_number,
  c.name AS cow_name,
  DATE_TRUNC('month', mr.recorded_datetime) AS month,
  COUNT(*) AS record_count,
  SUM(mr.amount) AS total_amount,
  AVG(mr.amount) AS avg_amount,
  MAX(mr.amount) AS max_amount,
  MIN(mr.amount) AS min_amount
FROM milk_records mr
JOIN cows c ON mr.cow_id = c.id
WHERE mr.deleted_at IS NULL
GROUP BY c.id, c.cow_number, c.name, DATE_TRUNC('month', mr.recorded_datetime)
ORDER BY month DESC, c.cow_number;

-- ============================================================================
-- SECTION 4: FUNCTIONS
-- ============================================================================

-- Audit log function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, ip_address)
    VALUES (
      auth.uid(),
      TG_OP::audit_action,
      TG_TABLE_NAME,
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
      row_to_json(NEW),
      inet_client_addr()
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, ip_address)
    VALUES (auth.uid(), 'DELETE'::audit_action, TG_TABLE_NAME, OLD.id, row_to_json(OLD), NULL, inet_client_addr());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Health alert notification function
CREATE OR REPLACE FUNCTION health_alert_notification()
RETURNS TRIGGER AS $$
DECLARE
  cow_record RECORD;
  admin_user_id UUID;
BEGIN
  IF NEW.temperature >= 39.5 THEN
    SELECT cow_number, name INTO cow_record FROM cows WHERE id = NEW.cow_id;
    FOR admin_user_id IN SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = TRUE
    LOOP
      INSERT INTO notifications (user_id, related_cow_id, notification_type, title, content, related_record_id, related_table_name)
      VALUES (
        admin_user_id, NEW.cow_id, 'health_alert', '健康预警：体温异常',
        format('奶牛 %s (%s) 体温达到 %s°C，请立即检查！', cow_record.cow_number, COALESCE(cow_record.name, '未命名'), NEW.temperature),
        NEW.id, 'health_records'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cow pedigree function
CREATE OR REPLACE FUNCTION get_cow_pedigree(target_cow_id UUID, generations INT DEFAULT 3)
RETURNS TABLE (cow_id UUID, cow_number VARCHAR(50), cow_name VARCHAR(100), generation INT, relationship VARCHAR(20))
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE pedigree AS (
    SELECT c.id, c.cow_number, c.name, 0 AS gen, 'self'::VARCHAR(20) AS rel
    FROM cows c WHERE c.id = target_cow_id
    UNION ALL
    SELECT c.id, c.cow_number, c.name, p.gen + 1,
      CASE WHEN p.gen = 0 THEN
        CASE WHEN c.id = (SELECT sire_id FROM cows WHERE id = p.id) THEN 'father' ELSE 'mother' END
      ELSE 'ancestor' END
    FROM cows c
    JOIN pedigree p ON c.id IN (SELECT sire_id FROM cows WHERE id = p.id AND sire_id IS NOT NULL UNION SELECT dam_id FROM cows WHERE id = p.id AND dam_id IS NOT NULL)
    WHERE p.gen < generations
  )
  SELECT * FROM pedigree ORDER BY gen, rel;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: TRIGGERS
-- ============================================================================

-- Audit log triggers
CREATE TRIGGER audit_log_trigger_cows AFTER INSERT OR UPDATE OR DELETE ON cows FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_log_trigger_health AFTER INSERT OR UPDATE OR DELETE ON health_records FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_log_trigger_milk AFTER INSERT OR UPDATE OR DELETE ON milk_records FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_log_trigger_breeding AFTER INSERT OR UPDATE OR DELETE ON breeding_records FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_log_trigger_formula AFTER INSERT OR UPDATE OR DELETE ON feed_formulas FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_log_trigger_feeding AFTER INSERT OR UPDATE OR DELETE ON feeding_records FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_log_trigger_medical AFTER INSERT OR UPDATE OR DELETE ON medical_records FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Update updated_at triggers
CREATE TRIGGER update_cows_updated_at BEFORE UPDATE ON cows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_health_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_milk_updated_at BEFORE UPDATE ON milk_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_breeding_updated_at BEFORE UPDATE ON breeding_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_formula_updated_at BEFORE UPDATE ON feed_formulas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_feeding_updated_at BEFORE UPDATE ON feeding_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_medical_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Health alert trigger
CREATE TRIGGER health_alert_trigger
AFTER INSERT OR UPDATE OF temperature ON health_records
FOR EACH ROW WHEN (NEW.temperature >= 39.5)
EXECUTE FUNCTION health_alert_notification();

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================

