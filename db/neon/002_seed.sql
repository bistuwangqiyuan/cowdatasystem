-- ============================================================================
-- Seed data for the Neon database
-- ============================================================================
-- Idempotent: only inserts when the relevant table is empty.
-- ============================================================================

-- 1. 默认管理员（自由演示账号，不连 Supabase Auth）
INSERT INTO users (id, email, full_name, role, farm_name, is_active)
SELECT '11111111-1111-1111-1111-111111111111'::uuid,
       'admin@bbtu.local',
       '系统管理员',
       'admin',
       '示范牧场',
       TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111');

INSERT INTO users (id, email, full_name, role, farm_name, is_active)
SELECT '22222222-2222-2222-2222-222222222222'::uuid,
       'staff@bbtu.local',
       '示范养殖员',
       'staff',
       '示范牧场',
       TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '22222222-2222-2222-2222-222222222222');

-- 2. 奶牛（仅在 cows 为空时插入）
DO $$
DECLARE
  admin_id UUID := '11111111-1111-1111-1111-111111111111';
  staff_id UUID := '22222222-2222-2222-2222-222222222222';
  cow1 UUID; cow2 UUID; cow3 UUID; cow4 UUID; cow5 UUID; cow6 UUID;
  i INT;
  d DATE;
BEGIN
  IF (SELECT COUNT(*) FROM cows) > 0 THEN
    RAISE NOTICE 'cows already populated, skipping seed';
    RETURN;
  END IF;

  INSERT INTO cows (cow_number, name, breed, gender, birth_date, entry_date, status, created_by, updated_by)
  VALUES
    ('CN001', '小花',  'holstein'::breed_type, 'female'::gender_type, DATE '2022-03-15', DATE '2022-04-01', 'active'::cow_status, admin_id, admin_id),
    ('CN002', '春雪',  'holstein'::breed_type, 'female'::gender_type, DATE '2021-09-08', DATE '2021-10-01', 'active'::cow_status, admin_id, admin_id),
    ('CN003', '阿黄',  'jersey'::breed_type,   'female'::gender_type, DATE '2022-06-21', DATE '2022-07-10', 'active'::cow_status, admin_id, admin_id),
    ('CN004', '牛王',  'holstein'::breed_type, 'male'::gender_type,   DATE '2020-12-05', DATE '2021-01-15', 'active'::cow_status, admin_id, admin_id),
    ('CN005', '小灰',  'jersey'::breed_type,   'female'::gender_type, DATE '2023-02-14', DATE '2023-03-01', 'active'::cow_status, staff_id, staff_id),
    ('CN006', '老乳牛','other'::breed_type,    'female'::gender_type, DATE '2018-05-22', DATE '2018-06-01', 'culled'::cow_status, admin_id, admin_id);

  SELECT id INTO cow1 FROM cows WHERE cow_number = 'CN001';
  SELECT id INTO cow2 FROM cows WHERE cow_number = 'CN002';
  SELECT id INTO cow3 FROM cows WHERE cow_number = 'CN003';
  SELECT id INTO cow4 FROM cows WHERE cow_number = 'CN004';
  SELECT id INTO cow5 FROM cows WHERE cow_number = 'CN005';
  SELECT id INTO cow6 FROM cows WHERE cow_number = 'CN006';

  -- 3. 健康记录：每头母牛最近 7 天每天一条
  FOR i IN 0..6 LOOP
    d := CURRENT_DATE - i;
    INSERT INTO health_records (cow_id, recorded_date, temperature, mental_status, appetite, fecal_condition, created_by, updated_by)
    VALUES
      (cow1, d, 38.5 + (i % 3) * 0.2, 'good'::health_status, 'good'::health_status, '正常', staff_id, staff_id),
      (cow2, d, 38.7,                  'good'::health_status, 'good'::health_status, '正常', staff_id, staff_id),
      (cow3, d, 38.6,                  'good'::health_status, 'good'::health_status, '正常', staff_id, staff_id),
      (cow5, d, 38.4 + CASE WHEN i = 1 THEN 1.3 ELSE 0 END,
                       (CASE WHEN i = 1 THEN 'fair' ELSE 'good' END)::health_status,
                       'good'::health_status, '正常', staff_id, staff_id);
  END LOOP;

  -- 4. 产奶记录：母牛最近 14 天，每天 2 次（早/晚）
  -- 用 NOW() - n hours 避免与 CHECK (recorded_datetime <= NOW()) 冲突
  FOR i IN 0..13 LOOP
    INSERT INTO milk_records (cow_id, recorded_datetime, session, amount, fat_rate, protein_rate, somatic_cell_count, created_by, updated_by)
    VALUES
      (cow1, NOW() - (i * INTERVAL '24 hours' + INTERVAL '12 hours'), 'morning'::milking_session,  20.5 + (i % 4), 3.6, 3.1, 180000, staff_id, staff_id),
      (cow1, NOW() - (i * INTERVAL '24 hours' + INTERVAL '1 hour'),   'evening'::milking_session,  18.2 + (i % 3), 3.5, 3.0, 175000, staff_id, staff_id),
      (cow2, NOW() - (i * INTERVAL '24 hours' + INTERVAL '12 hours'), 'morning'::milking_session,  22.0 + (i % 5), 3.7, 3.2, 165000, staff_id, staff_id),
      (cow2, NOW() - (i * INTERVAL '24 hours' + INTERVAL '1 hour'),   'evening'::milking_session,  19.8 + (i % 4), 3.6, 3.1, 170000, staff_id, staff_id),
      (cow3, NOW() - (i * INTERVAL '24 hours' + INTERVAL '12 hours'), 'morning'::milking_session,  16.5 + (i % 3), 4.5, 3.8, 150000, staff_id, staff_id),
      (cow3, NOW() - (i * INTERVAL '24 hours' + INTERVAL '1 hour'),   'evening'::milking_session,  15.2 + (i % 3), 4.4, 3.7, 155000, staff_id, staff_id);
  END LOOP;

  -- 5. 繁殖记录
  INSERT INTO breeding_records (dam_id, sire_id, breeding_date, breeding_method, semen_batch, pregnancy_check_date, pregnancy_result, expected_calving_date, status, created_by, updated_by)
  VALUES
    (cow1, cow4, CURRENT_DATE - 60, 'artificial_insemination'::breeding_method, 'SB-2025-001', CURRENT_DATE - 30, 'confirmed'::pregnancy_result,    CURRENT_DATE + 220, 'planned',  admin_id, admin_id),
    (cow2, cow4, CURRENT_DATE - 90, 'artificial_insemination'::breeding_method, 'SB-2025-002', CURRENT_DATE - 60, 'confirmed'::pregnancy_result,    CURRENT_DATE + 190, 'planned',  admin_id, admin_id),
    (cow3, cow4, CURRENT_DATE - 45, 'natural_mating'::breeding_method,          NULL,           CURRENT_DATE - 15, 'pending'::pregnancy_result,      NULL,               'planned',  admin_id, admin_id),
    (cow5, cow4, CURRENT_DATE - 120,'artificial_insemination'::breeding_method, 'SB-2024-099', CURRENT_DATE - 90, 'not_pregnant'::pregnancy_result, NULL,               'planned',  admin_id, admin_id);

  -- 6. 饲料配方
  INSERT INTO feed_formulas (formula_name, cattle_group, ingredients, nutrition_facts, unit_cost, is_active, notes, created_by, updated_by)
  VALUES
    ('泌乳期高产配方', 'lactating'::cattle_group_type,
     '[{"name":"玉米","percentage":35},{"name":"豆粕","percentage":20},{"name":"苜蓿草","percentage":25},{"name":"麸皮","percentage":15},{"name":"矿物盐","percentage":5}]'::jsonb,
     '{"protein":18,"fat":4,"fiber":17,"energy_mj":11.5}'::jsonb,
     3.20, TRUE, '适用于日产奶量 ≥ 25L 的奶牛', admin_id, admin_id),
    ('干奶期保健配方', 'dry'::cattle_group_type,
     '[{"name":"青贮玉米","percentage":50},{"name":"苜蓿草","percentage":30},{"name":"豆粕","percentage":12},{"name":"矿物盐","percentage":8}]'::jsonb,
     '{"protein":13,"fat":3,"fiber":22}'::jsonb,
     2.40, TRUE, '产前 60 天起使用', admin_id, admin_id),
    ('育成期配方', 'heifer'::cattle_group_type,
     '[{"name":"玉米","percentage":30},{"name":"豆粕","percentage":15},{"name":"苜蓿草","percentage":40},{"name":"麸皮","percentage":15}]'::jsonb,
     '{"protein":15,"fat":3,"fiber":20}'::jsonb,
     2.80, TRUE, '6-15 月龄', admin_id, admin_id);

  -- 7. 投喂记录：最近 5 天每天一次给"泌乳期"群体
  FOR i IN 0..4 LOOP
    INSERT INTO feeding_records (formula_id, feeding_datetime, amount, actual_cost, cattle_group, notes, created_by, updated_by)
    SELECT id, NOW() - (i * INTERVAL '24 hours' + INTERVAL '8 hours'), 350 + i * 10, (350 + i * 10) * 3.20, 'lactating'::cattle_group_type, '示范投喂', staff_id, staff_id
    FROM feed_formulas WHERE formula_name = '泌乳期高产配方';
  END LOOP;
END $$;
