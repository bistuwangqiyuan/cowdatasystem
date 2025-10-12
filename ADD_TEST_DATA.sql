-- ===========================================================================
-- 添加测试数据脚本
-- ===========================================================================
-- 说明：为已有的奶牛数据添加额外的测试记录
-- 功能：
--   1. 添加3条健康记录
--   2. 添加3条繁殖记录  
--   3. 添加3条饲料管理记录
-- ===========================================================================

DO $$
DECLARE
  test_user_id UUID;
  cow1_id UUID;
  cow2_id UUID;
  cow3_id UUID;
  formula_id UUID;
BEGIN
  -- 获取第一个auth用户
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '错误：请先在Supabase Auth中创建至少一个用户！';
  END IF;

  -- 获取前3头奶牛的ID
  SELECT id INTO cow1_id FROM cows WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1;
  SELECT id INTO cow2_id FROM cows WHERE deleted_at IS NULL ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO cow3_id FROM cows WHERE deleted_at IS NULL ORDER BY created_at OFFSET 2 LIMIT 1;

  IF cow1_id IS NULL OR cow2_id IS NULL OR cow3_id IS NULL THEN
    RAISE EXCEPTION '错误：数据库中至少需要3头奶牛！请先添加奶牛数据。';
  END IF;

  RAISE NOTICE '使用奶牛ID: %, %, %', cow1_id, cow2_id, cow3_id;

  -- ==========================================
  -- 1. 添加3条健康记录
  -- ==========================================
  
  RAISE NOTICE '正在添加健康记录...';
  
  -- 健康记录1：正常
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES (
    cow1_id, 
    CURRENT_DATE - INTERVAL '1 day',
    38.3, 
    'good', 
    'good', 
    '正常成型', 
    '健康状况良好，无异常症状', 
    test_user_id, 
    test_user_id
  );

  -- 健康记录2：轻微异常
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES (
    cow2_id, 
    CURRENT_DATE - INTERVAL '2 days',
    38.9, 
    'fair', 
    'fair', 
    '略显稀薄', 
    '精神状态稍显疲惫，食欲一般，建议持续观察', 
    test_user_id, 
    test_user_id
  );

  -- 健康记录3：需要关注
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES (
    cow3_id, 
    CURRENT_DATE - INTERVAL '3 days',
    39.2, 
    'fair', 
    'poor', 
    '稀薄', 
    '体温偏高，食欲不佳，已通知兽医检查', 
    test_user_id, 
    test_user_id
  );

  RAISE NOTICE '✅ 成功添加3条健康记录';

  -- ==========================================
  -- 2. 添加3条繁殖记录
  -- ==========================================
  
  RAISE NOTICE '正在添加繁殖记录...';

  -- 繁殖记录1：计划中
  INSERT INTO breeding_records (
    dam_id, 
    breeding_date, 
    breeding_method, 
    semen_batch,
    created_by, 
    updated_by
  ) VALUES (
    cow1_id, 
    CURRENT_DATE - INTERVAL '10 days',
    'artificial_insemination',
    'BATCH-2025-001',
    test_user_id, 
    test_user_id
  );

  -- 繁殖记录2：已确认妊娠
  INSERT INTO breeding_records (
    dam_id, 
    breeding_date, 
    breeding_method, 
    semen_batch,
    pregnancy_check_date,
    pregnancy_result,
    expected_calving_date,
    created_by, 
    updated_by
  ) VALUES (
    cow2_id, 
    CURRENT_DATE - INTERVAL '90 days',
    'artificial_insemination',
    'BATCH-2024-125',
    CURRENT_DATE - INTERVAL '60 days',
    'confirmed',
    CURRENT_DATE + INTERVAL '190 days',
    test_user_id, 
    test_user_id
  );

  -- 繁殖记录3：自然交配
  INSERT INTO breeding_records (
    dam_id, 
    breeding_date, 
    breeding_method,
    calving_notes,
    created_by, 
    updated_by
  ) VALUES (
    cow3_id, 
    CURRENT_DATE - INTERVAL '30 days',
    'natural_mating',
    '采用自然交配方式，待确认妊娠结果',
    test_user_id, 
    test_user_id
  );

  RAISE NOTICE '✅ 成功添加3条繁殖记录';

  -- ==========================================
  -- 3. 添加饲料配方和投喂记录
  -- ==========================================
  
  RAISE NOTICE '正在添加饲料配方和投喂记录...';

  -- 首先创建一个饲料配方（如果不存在）
  INSERT INTO feed_formulas (
    formula_name,
    cattle_group,
    ingredients,
    nutrition_facts,
    unit_cost,
    is_active,
    notes,
    created_by,
    updated_by
  ) VALUES (
    '泌乳期高产配方',
    'lactating',
    '[
      {"name": "玉米青贮", "amount": 25, "unit": "kg"},
      {"name": "苜蓿干草", "amount": 8, "unit": "kg"},
      {"name": "精料补充料", "amount": 12, "unit": "kg"},
      {"name": "豆粕", "amount": 3, "unit": "kg"}
    ]'::jsonb,
    '{"crude_protein": 16.5, "energy": 7.2, "calcium": 0.8, "phosphorus": 0.45}'::jsonb,
    45.50,
    true,
    '适用于日产奶量30L以上的高产奶牛',
    test_user_id,
    test_user_id
  ) RETURNING id INTO formula_id;

  RAISE NOTICE '✅ 创建饲料配方ID: %', formula_id;

  -- 添加3条投喂记录

  -- 投喂记录1：奶牛1的个体投喂
  INSERT INTO feeding_records (
    cow_id,
    formula_id,
    feeding_datetime,
    amount,
    actual_cost,
    notes,
    created_by,
    updated_by
  ) VALUES (
    cow1_id,
    formula_id,
    NOW() - INTERVAL '1 day',
    48.00,
    45.50,
    '高产奶牛，日产奶量32L',
    test_user_id,
    test_user_id
  );

  -- 投喂记录2：奶牛2的个体投喂
  INSERT INTO feeding_records (
    cow_id,
    formula_id,
    feeding_datetime,
    amount,
    actual_cost,
    notes,
    created_by,
    updated_by
  ) VALUES (
    cow2_id,
    formula_id,
    NOW() - INTERVAL '2 days',
    48.00,
    45.50,
    '妊娠中期，营养需求增加',
    test_user_id,
    test_user_id
  );

  -- 投喂记录3：按群体投喂
  INSERT INTO feeding_records (
    formula_id,
    feeding_datetime,
    amount,
    actual_cost,
    cattle_group,
    notes,
    created_by,
    updated_by
  ) VALUES (
    formula_id,
    NOW() - INTERVAL '3 days',
    240.00,
    227.50,
    'lactating',
    '泌乳牛群集体投喂，共5头',
    test_user_id,
    test_user_id
  );

  RAISE NOTICE '✅ 成功添加3条饲料投喂记录';

  -- ==========================================
  -- 数据验证
  -- ==========================================
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '数据添加完成！';
  RAISE NOTICE '==========================================';

END $$;

-- 验证添加的数据
SELECT 
  '健康记录' as 记录类型,
  COUNT(*) as 总数,
  COUNT(*) FILTER (WHERE recorded_date >= CURRENT_DATE - INTERVAL '7 days') as 最近7天
FROM health_records
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '繁殖记录',
  COUNT(*),
  COUNT(*) FILTER (WHERE breeding_date >= CURRENT_DATE - INTERVAL '30 days')
FROM breeding_records
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '投喂记录',
  COUNT(*),
  COUNT(*) FILTER (WHERE feeding_datetime >= CURRENT_DATE - INTERVAL '7 days')
FROM feeding_records
WHERE deleted_at IS NULL;

-- ===========================================================================
-- 使用说明：
-- 1. 确保数据库中已有至少3头奶牛
-- 2. 确保至少有一个auth用户
-- 3. 在Supabase Dashboard的SQL Editor中执行此脚本
-- 4. 脚本会自动使用现有的奶牛和用户数据
-- ===========================================================================

