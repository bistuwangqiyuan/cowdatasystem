-- ============================================================================
-- 奶牛管理系统 - 完整数据库设置脚本（包含3条测试数据）
-- ============================================================================
-- 执行方式：复制整个脚本到 Supabase Dashboard > SQL Editor 并执行
-- 网址：https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
-- ============================================================================

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 第一步：创建枚举类型
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cow_status AS ENUM ('active', 'culled', 'sold', 'dead');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE breed_type AS ENUM ('holstein', 'jersey', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE health_status AS ENUM ('good', 'fair', 'poor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE milking_session AS ENUM ('morning', 'afternoon', 'evening');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE breeding_method AS ENUM ('artificial_insemination', 'natural_mating');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pregnancy_result AS ENUM ('confirmed', 'not_pregnant', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cattle_group_type AS ENUM ('lactating', 'dry', 'calf', 'heifer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 第二步：创建核心表
-- ============================================================================

-- cows表（奶牛档案）
CREATE TABLE IF NOT EXISTS cows (
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
  CONSTRAINT birth_before_entry CHECK (birth_date <= entry_date)
);

CREATE INDEX IF NOT EXISTS idx_cows_number ON cows(cow_number);
CREATE INDEX IF NOT EXISTS idx_cows_status ON cows(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cows_breed ON cows(breed);

-- health_records表（健康记录）
CREATE TABLE IF NOT EXISTS health_records (
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
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_health_cow ON health_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_health_date ON health_records(recorded_date DESC);

-- milk_records表（产奶记录）
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_milk_cow ON milk_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_milk_datetime ON milk_records(recorded_datetime DESC);

-- breeding_records表（繁殖记录）
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_breeding_dam ON breeding_records(dam_id);
CREATE INDEX IF NOT EXISTS idx_breeding_date ON breeding_records(breeding_date DESC);

-- feed_formulas表（饲料配方）
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_formula_group ON feed_formulas(cattle_group);
CREATE INDEX IF NOT EXISTS idx_formula_active ON feed_formulas(is_active) WHERE is_active = TRUE;

-- feeding_records表（投喂记录）
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
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT cow_or_group CHECK (
    (cow_id IS NOT NULL AND cattle_group IS NULL) OR
    (cow_id IS NULL AND cattle_group IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_feeding_cow ON feeding_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_feeding_formula ON feeding_records(formula_id);
CREATE INDEX IF NOT EXISTS idx_feeding_datetime ON feeding_records(feeding_datetime DESC);

-- ============================================================================
-- 第三步：插入测试数据（3头奶牛，每头3条健康记录、3条产奶记录、1条繁殖记录）
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
  cow1_id UUID;
  cow2_id UUID;
  cow3_id UUID;
  formula1_id UUID;
  formula2_id UUID;
  formula3_id UUID;
BEGIN
  -- 获取第一个auth用户
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '错误：请先在Supabase Dashboard创建至少一个用户！路径: Authentication > Users > Add user';
  END IF;

  RAISE NOTICE '✅ 使用用户ID: %', test_user_id;

  -- ========== 插入3头奶牛 ==========
  
  -- 奶牛1：荷斯坦母牛 "贝拉" (Bella)
  INSERT INTO cows (
    cow_number, name, breed, gender, birth_date, entry_date, 
    status, notes, created_by, updated_by
  ) VALUES (
    'CN001', '贝拉', 'holstein', 'female', '2021-03-15', '2021-03-20',
    'active', '高产荷斯坦奶牛，性格温顺，日产奶量稳定在25-30升', test_user_id, test_user_id
  ) RETURNING id INTO cow1_id;
  RAISE NOTICE '  ✓ 已创建奶牛: CN001 贝拉';

  -- 奶牛2：娟姗母牛 "茉莉" (Molly)
  INSERT INTO cows (
    cow_number, name, breed, gender, birth_date, entry_date,
    status, notes, created_by, updated_by
  ) VALUES (
    'CN002', '茉莉', 'jersey', 'female', '2020-08-22', '2020-09-01',
    'active', '优质娟姗品种，乳脂率高达5.2%，适合高端奶制品', test_user_id, test_user_id
  ) RETURNING id INTO cow2_id;
  RAISE NOTICE '  ✓ 已创建奶牛: CN002 茉莉';

  -- 奶牛3：荷斯坦母牛 "露西" (Lucy)
  INSERT INTO cows (
    cow_number, name, breed, gender, birth_date, entry_date,
    status, notes, created_by, updated_by
  ) VALUES (
    'CN003', '露西', 'holstein', 'female', '2022-01-10', '2022-01-15',
    'active', '年轻的荷斯坦奶牛，首次产犊后生长状况良好，潜力巨大', test_user_id, test_user_id
  ) RETURNING id INTO cow3_id;
  RAISE NOTICE '  ✓ 已创建奶牛: CN003 露西';

  -- ========== 为每头奶牛添加3条健康记录 ==========
  
  -- 贝拉的健康记录
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES
    (cow1_id, CURRENT_DATE, 38.5, 'good', 'good', '正常', '健康状况良好，精神饱满，食欲旺盛', test_user_id, test_user_id),
    (cow1_id, CURRENT_DATE - 1, 38.6, 'good', 'good', '正常', '体检正常，活动力强', test_user_id, test_user_id),
    (cow1_id, CURRENT_DATE - 2, 38.4, 'good', 'good', '正常', '健康状况稳定', test_user_id, test_user_id);
  
  -- 茉莉的健康记录
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES
    (cow2_id, CURRENT_DATE, 38.7, 'good', 'good', '正常', '精神状态优秀，食欲正常，无异常症状', test_user_id, test_user_id),
    (cow2_id, CURRENT_DATE - 1, 38.5, 'good', 'good', '偏软', '轻微消化不良，已调整饲料配比', test_user_id, test_user_id),
    (cow2_id, CURRENT_DATE - 2, 38.6, 'good', 'good', '正常', '恢复良好', test_user_id, test_user_id);
  
  -- 露西的健康记录
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES
    (cow3_id, CURRENT_DATE, 38.6, 'fair', 'good', '偏软', '精神稍显疲惫，需持续观察，可能是天气变化影响', test_user_id, test_user_id),
    (cow3_id, CURRENT_DATE - 1, 38.7, 'good', 'good', '正常', '精神恢复，活力良好', test_user_id, test_user_id),
    (cow3_id, CURRENT_DATE - 2, 38.5, 'good', 'fair', '正常', '食欲略有下降，已增加青饲料', test_user_id, test_user_id);

  RAISE NOTICE '  ✓ 已创建 9 条健康记录 (每头牛3条)';

  -- ========== 为每头奶牛添加3条产奶记录（早、中、晚挤奶）==========
  
  -- 贝拉的产奶记录（高产）
  INSERT INTO milk_records (
    cow_id, recorded_datetime, session, amount, fat_rate, protein_rate,
    somatic_cell_count, created_by, updated_by
  ) VALUES
    (cow1_id, CURRENT_TIMESTAMP - INTERVAL '12 hours', 'morning', 28.50, 3.8, 3.2, 150000, test_user_id, test_user_id),
    (cow1_id, CURRENT_TIMESTAMP - INTERVAL '6 hours', 'afternoon', 26.30, 3.9, 3.3, 145000, test_user_id, test_user_id),
    (cow1_id, CURRENT_TIMESTAMP, 'evening', 25.80, 3.7, 3.1, 155000, test_user_id, test_user_id);
  
  -- 茉莉的产奶记录（高乳脂）
  INSERT INTO milk_records (
    cow_id, recorded_datetime, session, amount, fat_rate, protein_rate,
    somatic_cell_count, created_by, updated_by
  ) VALUES
    (cow2_id, CURRENT_TIMESTAMP - INTERVAL '12 hours', 'morning', 22.80, 5.2, 3.8, 120000, test_user_id, test_user_id),
    (cow2_id, CURRENT_TIMESTAMP - INTERVAL '6 hours', 'afternoon', 21.50, 5.3, 3.9, 115000, test_user_id, test_user_id),
    (cow2_id, CURRENT_TIMESTAMP, 'evening', 20.90, 5.1, 3.7, 125000, test_user_id, test_user_id);
  
  -- 露西的产奶记录（年轻奶牛）
  INSERT INTO milk_records (
    cow_id, recorded_datetime, session, amount, fat_rate, protein_rate,
    somatic_cell_count, created_by, updated_by
  ) VALUES
    (cow3_id, CURRENT_TIMESTAMP - INTERVAL '12 hours', 'morning', 18.90, 3.7, 3.1, 180000, test_user_id, test_user_id),
    (cow3_id, CURRENT_TIMESTAMP - INTERVAL '6 hours', 'afternoon', 17.20, 3.8, 3.2, 175000, test_user_id, test_user_id),
    (cow3_id, CURRENT_TIMESTAMP, 'evening', 16.50, 3.6, 3.0, 190000, test_user_id, test_user_id);

  RAISE NOTICE '  ✓ 已创建 9 条产奶记录 (每头牛3条)';

  -- ========== 为每头奶牛添加1条繁殖记录 ==========
  
  -- 贝拉的繁殖记录（已怀孕）
  INSERT INTO breeding_records (
    dam_id, breeding_date, breeding_method, semen_batch,
    pregnancy_check_date, pregnancy_result, expected_calving_date,
    created_by, updated_by
  ) VALUES (
    cow1_id, '2024-09-15', 'artificial_insemination', 'BATCH-2024-HS-001',
    '2024-10-10', 'confirmed', '2025-06-20',
    test_user_id, test_user_id
  );
  
  -- 茉莉的繁殖记录（待确认）
  INSERT INTO breeding_records (
    dam_id, breeding_date, breeding_method, semen_batch,
    pregnancy_check_date, pregnancy_result,
    created_by, updated_by
  ) VALUES (
    cow2_id, '2024-10-05', 'artificial_insemination', 'BATCH-2024-JS-002',
    '2024-10-28', 'pending',
    test_user_id, test_user_id
  );
  
  -- 露西的繁殖记录（首次配种）
  INSERT INTO breeding_records (
    dam_id, breeding_date, breeding_method, semen_batch,
    created_by, updated_by
  ) VALUES (
    cow3_id, '2024-11-01', 'artificial_insemination', 'BATCH-2024-HS-003',
    test_user_id, test_user_id
  );

  RAISE NOTICE '  ✓ 已创建 3 条繁殖记录';

  -- ========== 创建3个饲料配方 ==========
  
  -- 配方1：泌乳期高产配方
  INSERT INTO feed_formulas (
    formula_name, cattle_group, ingredients, nutrition_facts, unit_cost,
    is_active, notes, created_by, updated_by
  ) VALUES (
    '泌乳期高产配方', 'lactating',
    '[
      {"name": "苜蓿干草", "weight": 8.0, "unit": "kg"},
      {"name": "玉米青贮", "weight": 15.0, "unit": "kg"},
      {"name": "精料混合", "weight": 6.0, "unit": "kg"},
      {"name": "豆粕", "weight": 2.5, "unit": "kg"}
    ]'::jsonb,
    '{
      "dry_matter": 18.5,
      "crude_protein": 16.8,
      "energy": 6.8,
      "calcium": 0.85,
      "phosphorus": 0.42
    }'::jsonb,
    45.50,
    true,
    '适用于日产奶量25升以上的高产奶牛',
    test_user_id, test_user_id
  ) RETURNING id INTO formula1_id;
  
  -- 配方2：泌乳期标准配方
  INSERT INTO feed_formulas (
    formula_name, cattle_group, ingredients, nutrition_facts, unit_cost,
    is_active, notes, created_by, updated_by
  ) VALUES (
    '泌乳期标准配方', 'lactating',
    '[
      {"name": "苜蓿干草", "weight": 6.0, "unit": "kg"},
      {"name": "玉米青贮", "weight": 12.0, "unit": "kg"},
      {"name": "精料混合", "weight": 5.0, "unit": "kg"},
      {"name": "豆粕", "weight": 2.0, "unit": "kg"}
    ]'::jsonb,
    '{
      "dry_matter": 15.2,
      "crude_protein": 15.5,
      "energy": 6.5,
      "calcium": 0.75,
      "phosphorus": 0.38
    }'::jsonb,
    38.00,
    true,
    '适用于日产奶量15-25升的标准产奶牛',
    test_user_id, test_user_id
  ) RETURNING id INTO formula2_id;
  
  -- 配方3：干奶期配方
  INSERT INTO feed_formulas (
    formula_name, cattle_group, ingredients, nutrition_facts, unit_cost,
    is_active, notes, created_by, updated_by
  ) VALUES (
    '干奶期维持配方', 'dry',
    '[
      {"name": "燕麦干草", "weight": 5.0, "unit": "kg"},
      {"name": "玉米青贮", "weight": 10.0, "unit": "kg"},
      {"name": "精料混合", "weight": 2.0, "unit": "kg"}
    ]'::jsonb,
    '{
      "dry_matter": 12.0,
      "crude_protein": 12.5,
      "energy": 5.8,
      "calcium": 0.65,
      "phosphorus": 0.32
    }'::jsonb,
    28.50,
    true,
    '适用于干奶期奶牛的基础维持配方',
    test_user_id, test_user_id
  ) RETURNING id INTO formula3_id;

  RAISE NOTICE '  ✓ 已创建 3 个饲料配方';

  -- ========== 为每头奶牛添加3条投喂记录 ==========
  
  -- 贝拉的投喂记录（高产配方）
  INSERT INTO feeding_records (
    cow_id, formula_id, feeding_datetime, amount, actual_cost,
    notes, created_by, updated_by
  ) VALUES
    (cow1_id, formula1_id, CURRENT_TIMESTAMP - INTERVAL '2 days', 31.50, 45.50, '晨饲，奶牛状态良好', test_user_id, test_user_id),
    (cow1_id, formula1_id, CURRENT_TIMESTAMP - INTERVAL '1 day', 31.50, 45.50, '日常投喂', test_user_id, test_user_id),
    (cow1_id, formula1_id, CURRENT_TIMESTAMP, 31.50, 45.50, '今日投喂完成', test_user_id, test_user_id);
  
  -- 茉莉的投喂记录（标准配方）
  INSERT INTO feeding_records (
    cow_id, formula_id, feeding_datetime, amount, actual_cost,
    notes, created_by, updated_by
  ) VALUES
    (cow2_id, formula2_id, CURRENT_TIMESTAMP - INTERVAL '2 days', 25.00, 38.00, '正常投喂', test_user_id, test_user_id),
    (cow2_id, formula2_id, CURRENT_TIMESTAMP - INTERVAL '1 day', 25.00, 38.00, '已调整饲料配比', test_user_id, test_user_id),
    (cow2_id, formula2_id, CURRENT_TIMESTAMP, 25.00, 38.00, '投喂正常', test_user_id, test_user_id);
  
  -- 露西的投喂记录（标准配方）
  INSERT INTO feeding_records (
    cow_id, formula_id, feeding_datetime, amount, actual_cost,
    notes, created_by, updated_by
  ) VALUES
    (cow3_id, formula2_id, CURRENT_TIMESTAMP - INTERVAL '2 days', 25.00, 38.00, '年轻奶牛，适应良好', test_user_id, test_user_id),
    (cow3_id, formula2_id, CURRENT_TIMESTAMP - INTERVAL '1 day', 25.00, 38.00, '增加了青饲料比例', test_user_id, test_user_id),
    (cow3_id, formula2_id, CURRENT_TIMESTAMP, 25.00, 38.00, '食欲恢复正常', test_user_id, test_user_id);

  RAISE NOTICE '  ✓ 已创建 9 条投喂记录 (每头牛3条)';

  -- ========== 成功总结 ==========
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ 数据库设置完成！成功创建以下测试数据：';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 数据统计：';
  RAISE NOTICE '  • 奶牛档案: 3 头 (CN001 贝拉, CN002 茉莉, CN003 露西)';
  RAISE NOTICE '  • 健康记录: 9 条 (每头牛3条)';
  RAISE NOTICE '  • 产奶记录: 9 条 (每头牛3条，包含早中晚三次挤奶)';
  RAISE NOTICE '  • 繁殖记录: 3 条 (每头牛1条)';
  RAISE NOTICE '  • 饲料配方: 3 个 (高产、标准、干奶期)';
  RAISE NOTICE '  • 投喂记录: 9 条 (每头牛3条)';
  RAISE NOTICE '';
  RAISE NOTICE '🐄 奶牛详细信息：';
  RAISE NOTICE '  1. CN001 贝拉 - 荷斯坦母牛 (2021-03-15出生)';
  RAISE NOTICE '     • 高产奶牛，日产奶量约 80 升 (早28.5L + 午26.3L + 晚25.8L)';
  RAISE NOTICE '     • 已配种并确认怀孕，预产期 2025-06-20';
  RAISE NOTICE '     • 使用高产配方，日饲料成本 ¥45.50';
  RAISE NOTICE '';
  RAISE NOTICE '  2. CN002 茉莉 - 娟姗母牛 (2020-08-22出生)';
  RAISE NOTICE '     • 优质乳脂奶牛，日产奶量约 65 升，乳脂率 5.2%%';
  RAISE NOTICE '     • 已配种，妊娠检查待确认';
  RAISE NOTICE '     • 使用标准配方，日饲料成本 ¥38.00';
  RAISE NOTICE '';
  RAISE NOTICE '  3. CN003 露西 - 荷斯坦母牛 (2022-01-10出生)';
  RAISE NOTICE '     • 年轻奶牛，日产奶量约 52 升';
  RAISE NOTICE '     • 首次配种 (2024-11-01)';
  RAISE NOTICE '     • 使用标准配方，日饲料成本 ¥38.00';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 您现在可以在应用中查看和管理这些数据了！';
  RAISE NOTICE '════════════════════════════════════════════════════════';

END $$;

-- ============================================================================
-- 第四步：验证数据
-- ============================================================================

SELECT 
  '✅ 数据验证结果' as status,
  '' as separator;

SELECT 
  '奶牛总数' as 数据类型,
  COUNT(*) as 数量,
  string_agg(cow_number || ' ' || name, ', ') as 详细信息
FROM cows
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '健康记录数',
  COUNT(*),
  COUNT(DISTINCT cow_id)::text || ' 头牛'
FROM health_records
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '产奶记录数',
  COUNT(*),
  ROUND(SUM(amount), 2)::text || ' 升'
FROM milk_records
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '繁殖记录数',
  COUNT(*),
  COUNT(*) FILTER (WHERE pregnancy_result = 'confirmed')::text || ' 已确认怀孕'
FROM breeding_records
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '饲料配方数',
  COUNT(*),
  string_agg(formula_name, ', ')
FROM feed_formulas
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '投喂记录数',
  COUNT(*),
  ROUND(SUM(actual_cost), 2)::text || ' 元'
FROM feeding_records
WHERE deleted_at IS NULL;

-- ============================================================================
-- 🎯 执行说明：
-- ============================================================================
-- 1. 访问 Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
-- 2. 确保已创建至少一个用户 (Authentication > Users > Add user)
-- 3. 复制整个SQL脚本到 SQL Editor
-- 4. 点击 "Run" 执行
-- 5. 查看结果中的成功消息和数据验证表格
-- 6. 现在可以在应用中访问 /cows, /health, /milk, /breeding, /feed 页面查看数据！
-- ============================================================================

