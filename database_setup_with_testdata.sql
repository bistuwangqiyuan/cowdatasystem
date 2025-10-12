-- ===========================================================================
-- 奶牛管理系统 - 完整数据库设置脚本（含测试数据）
-- ===========================================================================
-- 说明：请在Supabase Dashboard的SQL Editor中执行此脚本
-- 网址：https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ===========================================================================

-- 第一步：创建枚举类型
CREATE TYPE IF NOT EXISTS gender_type AS ENUM ('male', 'female');
CREATE TYPE IF NOT EXISTS cow_status AS ENUM ('active', 'culled', 'sold', 'dead');
CREATE TYPE IF NOT EXISTS breed_type AS ENUM ('holstein', 'jersey', 'other');
CREATE TYPE IF NOT EXISTS health_status AS ENUM ('good', 'fair', 'poor');
CREATE TYPE IF NOT EXISTS milking_session AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE IF NOT EXISTS breeding_method AS ENUM ('artificial_insemination', 'natural_mating');
CREATE TYPE IF NOT EXISTS pregnancy_result AS ENUM ('confirmed', 'not_pregnant', 'pending');
CREATE TYPE IF NOT EXISTS cattle_group_type AS ENUM ('lactating', 'dry', 'calf', 'heifer');
CREATE TYPE IF NOT EXISTS medical_type AS ENUM ('vaccination', 'treatment');
CREATE TYPE IF NOT EXISTS notification_type AS ENUM ('health_alert', 'breeding_reminder', 'inventory_warning', 'medical_reminder');
CREATE TYPE IF NOT EXISTS audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- 第二步：创建核心表

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

-- 第三步：插入测试数据
-- 注意：请先确保有至少一个auth.users用户，然后将下面的USER_UUID替换为实际的用户UUID

-- 定义一个临时变量来存储第一个用户的UUID（需要手动替换）
DO $$
DECLARE
  test_user_id UUID;
  cow1_id UUID;
  cow2_id UUID;
  cow3_id UUID;
BEGIN
  -- 获取第一个auth用户（如果没有，需要先创建用户）
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '错误：请先在Supabase Auth中创建至少一个用户！';
  END IF;

  -- 插入3头测试奶牛
  -- 奶牛1：荷斯坦母牛 "贝拉"
  INSERT INTO cows (
    cow_number, name, breed, gender, birth_date, entry_date, 
    status, notes, created_by, updated_by
  ) VALUES (
    'CN001', '贝拉', 'holstein', 'female', '2021-03-15', '2021-03-20',
    'active', '高产荷斯坦奶牛，性格温顺，健康状况良好', test_user_id, test_user_id
  ) RETURNING id INTO cow1_id;

  -- 奶牛2：娟姗母牛 "茉莉"
  INSERT INTO cows (
    cow_number, name, breed, gender, birth_date, entry_date,
    status, notes, created_by, updated_by
  ) VALUES (
    'CN002', '茉莉', 'jersey', 'female', '2020-08-22', '2020-09-01',
    'active', '娟姗品种，乳脂率高，适应性强', test_user_id, test_user_id
  ) RETURNING id INTO cow2_id;

  -- 奶牛3：荷斯坦母牛 "露西"
  INSERT INTO cows (
    cow_number, name, breed, gender, birth_date, entry_date,
    status, notes, created_by, updated_by
  ) VALUES (
    'CN003', '露西', 'holstein', 'female', '2022-01-10', '2022-01-15',
    'active', '年轻的荷斯坦奶牛，生长状况良好', test_user_id, test_user_id
  ) RETURNING id INTO cow3_id;

  -- 为每头奶牛添加健康记录
  INSERT INTO health_records (
    cow_id, recorded_date, temperature, mental_status, appetite,
    fecal_condition, symptoms, created_by, updated_by
  ) VALUES
    (cow1_id, CURRENT_DATE, 38.5, 'good', 'good', '正常', '健康状况良好，无异常症状', test_user_id, test_user_id),
    (cow2_id, CURRENT_DATE, 38.7, 'good', 'good', '正常', '精神状态良好，食欲正常', test_user_id, test_user_id),
    (cow3_id, CURRENT_DATE, 38.6, 'fair', 'good', '偏软', '精神稍显疲惫，需持续观察', test_user_id, test_user_id);

  -- 为每头奶牛添加产奶记录
  INSERT INTO milk_records (
    cow_id, recorded_datetime, session, amount, fat_rate, protein_rate,
    somatic_cell_count, created_by, updated_by
  ) VALUES
    (cow1_id, NOW() - INTERVAL '1 day', 'morning', 28.50, 3.8, 3.2, 150000, test_user_id, test_user_id),
    (cow1_id, NOW() - INTERVAL '1 day', 'afternoon', 26.30, 3.9, 3.3, 145000, test_user_id, test_user_id),
    (cow2_id, NOW() - INTERVAL '1 day', 'morning', 22.80, 5.2, 3.8, 120000, test_user_id, test_user_id),
    (cow2_id, NOW() - INTERVAL '1 day', 'afternoon', 21.50, 5.3, 3.9, 115000, test_user_id, test_user_id),
    (cow3_id, NOW() - INTERVAL '1 day', 'morning', 18.90, 3.7, 3.1, 180000, test_user_id, test_user_id),
    (cow3_id, NOW() - INTERVAL '1 day', 'afternoon', 17.20, 3.8, 3.2, 175000, test_user_id, test_user_id);

  RAISE NOTICE '✅ 成功插入3头测试奶牛及其健康和产奶记录！';
  RAISE NOTICE '   - 奶牛1: CN001 贝拉 (荷斯坦)';
  RAISE NOTICE '   - 奶牛2: CN002 茉莉 (娟姗)';
  RAISE NOTICE '   - 奶牛3: CN003 露西 (荷斯坦)';
END $$;

-- 第四步：验证数据
SELECT 
  '奶牛总数' as 类型,
  COUNT(*) as 数量
FROM cows
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '健康记录数',
  COUNT(*)
FROM health_records
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '产奶记录数',
  COUNT(*)
FROM milk_records
WHERE deleted_at IS NULL;

-- ===========================================================================
-- 使用说明：
-- 1. 请先在Supabase Dashboard中创建一个用户（通过Authentication > Users > Add user）
-- 2. 在SQL Editor中执行此脚本
-- 3. 脚本会自动使用第一个auth用户作为创建者
-- 4. 成功后会显示成功消息和数据统计
-- ===========================================================================

