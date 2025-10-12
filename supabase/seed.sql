-- ============================================================================
-- Seed Data for Development and Testing
-- ============================================================================
-- Feature: 001-netlify
-- Date: 2025-10-12
-- Description: Initial test data for development environment
-- ============================================================================

-- NOTE: This file assumes you have created test users in Supabase Auth first
-- Create users in Supabase Dashboard > Authentication > Users:
-- 1. admin@test.com (admin role)
-- 2. staff@test.com (staff role)
-- 3. guest@test.com (guest role)

-- ============================================================================
-- SECTION 1: TEST USERS (Extended Information)
-- ============================================================================

-- Replace these UUIDs with actual user IDs from your Supabase Auth
INSERT INTO users (id, full_name, role, phone, farm_name, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, '张三 (管理员)', 'admin', '13800138000', '阳光奶牛养殖场', TRUE),
  ('00000000-0000-0000-0000-000000000002'::uuid, '李四 (养殖员)', 'staff', '13900139000', '阳光奶牛养殖场', TRUE),
  ('00000000-0000-0000-0000-000000000003'::uuid, '王五 (访客)', 'guest', NULL, '阳光奶牛养殖场', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 2: TEST COWS
-- ============================================================================

INSERT INTO cows (id, cow_number, name, breed, gender, birth_date, entry_date, status, created_by, updated_by)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 'CN001', '小花', 'holstein', 'female', '2020-03-15', '2020-03-20', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'CN002', '大力', 'holstein', 'male', '2019-06-10', '2019-06-15', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'CN003', '美美', 'jersey', 'female', '2021-01-05', '2021-01-10', 'active', '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'CN004', '壮壮', 'holstein', 'male', '2020-08-20', '2020-08-25', 'active', '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000005'::uuid, 'CN005', '花花', 'other', 'female', '2021-05-12', '2021-05-15', 'active', '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (cow_number) DO NOTHING;

-- ============================================================================
-- SECTION 3: TEST HEALTH RECORDS
-- ============================================================================

INSERT INTO health_records (cow_id, recorded_date, temperature, mental_status, appetite, created_by, updated_by)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE, 38.5, 'good', 'good', '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000003'::uuid, CURRENT_DATE, 38.2, 'good', 'good', '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000005'::uuid, CURRENT_DATE - INTERVAL '1 day', 39.6, 'fair', 'fair', '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (cow_id, recorded_date, deleted_at) DO NOTHING;

-- ============================================================================
-- SECTION 4: TEST MILK RECORDS
-- ============================================================================

INSERT INTO milk_records (cow_id, recorded_datetime, session, amount, fat_rate, protein_rate, created_by, updated_by)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, NOW() - INTERVAL '1 hour', 'morning', 25.5, 3.8, 3.2, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000003'::uuid, NOW() - INTERVAL '1 hour', 'morning', 22.0, 4.2, 3.5, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
  ('10000000-0000-0000-0000-000000000001'::uuid, NOW() - INTERVAL '13 hours', 'afternoon', 24.8, 3.7, 3.1, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 5: TEST FEED FORMULAS
-- ============================================================================

INSERT INTO feed_formulas (
  id, formula_name, cattle_group, ingredients, nutrition_facts, unit_cost, is_active, created_by, updated_by
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001'::uuid,
    '泌乳牛精料配方1号',
    'lactating',
    '[{"name":"玉米","ratio":30,"unit":"kg"},{"name":"豆粕","ratio":20,"unit":"kg"},{"name":"麸皮","ratio":10,"unit":"kg"}]'::jsonb,
    '{"protein":18.5,"energy":2.8,"calcium":1.2,"phosphorus":0.8}'::jsonb,
    12.50,
    TRUE,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  (
    '20000000-0000-0000-0000-000000000002'::uuid,
    '犊牛专用配方',
    'calf',
    '[{"name":"代乳粉","ratio":50,"unit":"kg"},{"name":"玉米","ratio":30,"unit":"kg"}]'::jsonb,
    '{"protein":22.0,"energy":3.2,"calcium":1.5}'::jsonb,
    18.00,
    TRUE,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 6: TEST BREEDING RECORDS
-- ============================================================================

INSERT INTO breeding_records (
  dam_id, breeding_date, breeding_method, semen_batch, pregnancy_result, expected_calving_date, created_by, updated_by
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001'::uuid,
    CURRENT_DATE - INTERVAL '60 days',
    'artificial_insemination',
    'BATCH2024-001',
    'confirmed',
    CURRENT_DATE + INTERVAL '220 days',
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid
  ),
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    CURRENT_DATE - INTERVAL '30 days',
    'artificial_insemination',
    'BATCH2024-002',
    'pending',
    NULL,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check users
-- SELECT id, full_name, role FROM users;

-- Check cows
-- SELECT cow_number, name, breed, status FROM cows WHERE deleted_at IS NULL;

-- Check recent health records
-- SELECT c.cow_number, hr.recorded_date, hr.temperature FROM health_records hr
-- JOIN cows c ON hr.cow_id = c.id WHERE hr.deleted_at IS NULL;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

