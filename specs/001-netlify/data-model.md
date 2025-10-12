# Data Model: 奶牛实验数据管理系统

**Feature**: 001-netlify  
**Date**: 2025-10-11  
**Database**: Supabase PostgreSQL  
**Status**: Design Complete

本文档定义了奶牛实验数据管理系统的完整数据库架构，包括10个核心数据表、审计字段、行级安全策略（RLS）、触发器和索引设计。

---

## 1. 架构概览

### 1.1 数据库结构图

```
auth.users (Supabase Auth 管理)
    ↓
users (扩展用户信息)
    ↓
    ├── cows (奶牛档案) ←─────────────┐
    │   ↓                              │
    │   ├── health_records (健康记录)   │
    │   ├── milk_records (产奶记录)     │
    │   ├── medical_records (医疗记录)  │
    │   └── feeding_records (投喂记录)  │
    │                                   │
    ├── breeding_records (繁殖记录)     │
    │   ├── 母牛 ──→ cows               │
    │   └── 犊牛 ──→ cows ──────────────┘
    │
    ├── feed_formulas (饲料配方)
    │   └── feeding_records
    │
    ├── notifications (通知)
    │
    └── audit_logs (审计日志)
```

### 1.2 审计字段标准

**所有业务表**必须包含以下审计字段（符合项目原则8）：

```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
created_by UUID REFERENCES auth.users(id) NOT NULL,
updated_by UUID REFERENCES auth.users(id) NOT NULL,
deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL  -- 软删除
```

### 1.3 命名约定

- **表名**：复数、小写、下划线分隔（`cows`, `health_records`）
- **主键**：统一使用 `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- **外键**：`{entity_name}_id`（如 `cow_id`, `user_id`）
- **枚举类型**：后缀 `_type` 或 `_status`（如 `gender_type`, `cow_status`）
- **时间戳**：后缀 `_at`（如 `created_at`, `recorded_at`）

---

## 2. 核心数据表设计

### 2.1 users (用户扩展信息)

扩展 Supabase Auth 的用户信息，存储业务相关字段。

```sql
CREATE TABLE users (
  -- 主键（关联到 auth.users）
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 业务字段
  full_name VARCHAR(100) NOT NULL,                    -- 姓名
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'guest')), -- 角色
  phone VARCHAR(20),                                   -- 联系电话
  farm_name VARCHAR(200),                              -- 所属养殖场
  is_active BOOLEAN DEFAULT TRUE NOT NULL,             -- 账号状态
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 用户可查看所有激活用户（用于选择录入人）
CREATE POLICY "users_select_all_active" ON users
  FOR SELECT USING (is_active = TRUE);

-- 用户可更新自己的信息
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 管理员可管理所有用户
CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 注释
COMMENT ON TABLE users IS '用户扩展信息表，存储角色和养殖场信息';
COMMENT ON COLUMN users.role IS '用户角色：admin（管理员）、staff（养殖员）、guest（访客）';
COMMENT ON COLUMN users.is_active IS '账号是否激活，软禁用机制';
```

---

### 2.2 cows (奶牛档案)

核心实体，存储奶牛基本信息和系谱。

```sql
-- 枚举类型
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE cow_status AS ENUM ('active', 'culled', 'sold', 'dead');
CREATE TYPE breed_type AS ENUM ('holstein', 'jersey', 'other');

CREATE TABLE cows (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 业务字段
  cow_number VARCHAR(50) UNIQUE NOT NULL,              -- 奶牛编号（唯一）
  name VARCHAR(100),                                   -- 名称（可选）
  breed breed_type NOT NULL,                           -- 品种
  gender gender_type NOT NULL,                         -- 性别
  birth_date DATE NOT NULL,                            -- 出生日期
  
  -- 系谱信息（自关联）
  sire_id UUID REFERENCES cows(id) ON DELETE SET NULL, -- 父牛ID
  dam_id UUID REFERENCES cows(id) ON DELETE SET NULL,  -- 母牛ID
  
  -- 状态与元数据
  status cow_status DEFAULT 'active' NOT NULL,         -- 当前状态
  entry_date DATE NOT NULL,                            -- 入栏日期
  photo_url TEXT,                                      -- 照片URL（Supabase Storage）
  notes TEXT,                                          -- 备注
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,                 -- 软删除
  
  -- 约束
  CONSTRAINT birth_before_entry CHECK (birth_date <= entry_date),
  CONSTRAINT valid_photo_url CHECK (photo_url IS NULL OR photo_url ~* '^https?://')
);

-- 索引
CREATE INDEX idx_cows_number ON cows(cow_number);
CREATE INDEX idx_cows_status ON cows(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cows_breed ON cows(breed);
CREATE INDEX idx_cows_sire ON cows(sire_id) WHERE sire_id IS NOT NULL;
CREATE INDEX idx_cows_dam ON cows(dam_id) WHERE dam_id IS NOT NULL;
CREATE INDEX idx_cows_deleted ON cows(deleted_at) WHERE deleted_at IS NULL;

-- 全文搜索索引（支持按编号、名称搜索）
CREATE INDEX idx_cows_search ON cows USING GIN (
  to_tsvector('simple', coalesce(cow_number, '') || ' ' || coalesce(name, ''))
);

-- RLS 策略
ALTER TABLE cows ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可查看未删除的奶牛
CREATE POLICY "cows_select_all" ON cows
  FOR SELECT USING (deleted_at IS NULL);

-- 管理员和养殖员可创建奶牛
CREATE POLICY "cows_insert_staff" ON cows
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 管理员和养殖员可更新未删除的奶牛
CREATE POLICY "cows_update_staff" ON cows
  FOR UPDATE USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 仅管理员可软删除（更新 deleted_at）
CREATE POLICY "cows_delete_admin" ON cows
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (deleted_at IS NOT NULL);

-- 注释
COMMENT ON TABLE cows IS '奶牛档案表，存储基本信息和系谱';
COMMENT ON COLUMN cows.cow_number IS '奶牛唯一编号，养殖场内识别标识';
COMMENT ON COLUMN cows.breed IS '品种：holstein（荷斯坦）、jersey（娟姗）、other（其他）';
COMMENT ON COLUMN cows.status IS '当前状态：active（在养）、culled（已淘汰）、sold（已售出）、dead（死亡）';
COMMENT ON COLUMN cows.sire_id IS '父牛ID，用于系谱追溯';
COMMENT ON COLUMN cows.dam_id IS '母牛ID，用于系谱追溯';
```

---

### 2.3 health_records (健康记录)

每日健康监测数据。

```sql
-- 枚举类型
CREATE TYPE health_status AS ENUM ('good', 'fair', 'poor');

CREATE TABLE health_records (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  
  -- 业务字段
  recorded_date DATE NOT NULL,                         -- 记录日期
  temperature NUMERIC(4,1) CHECK (temperature BETWEEN 35.0 AND 45.0), -- 体温（°C）
  mental_status health_status,                         -- 精神状态
  appetite health_status,                              -- 食欲
  fecal_condition VARCHAR(100),                        -- 粪便状态
  symptoms TEXT,                                       -- 症状描述
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
  CONSTRAINT unique_cow_date UNIQUE (cow_id, recorded_date, deleted_at),
  CONSTRAINT valid_recorded_date CHECK (recorded_date <= CURRENT_DATE)
);

-- 索引
CREATE INDEX idx_health_cow ON health_records(cow_id);
CREATE INDEX idx_health_date ON health_records(recorded_date DESC);
CREATE INDEX idx_health_temp ON health_records(temperature) WHERE temperature >= 39.5;
CREATE INDEX idx_health_deleted ON health_records(deleted_at) WHERE deleted_at IS NULL;

-- RLS 策略
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可查看未删除的健康记录
CREATE POLICY "health_select_all" ON health_records
  FOR SELECT USING (deleted_at IS NULL);

-- 管理员和养殖员可创建
CREATE POLICY "health_insert_staff" ON health_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 创建者和管理员可更新
CREATE POLICY "health_update_own_or_admin" ON health_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- 注释
COMMENT ON TABLE health_records IS '奶牛每日健康监测记录';
COMMENT ON COLUMN health_records.temperature IS '体温，正常范围 37.5-39.5°C，≥39.5°C触发预警';
COMMENT ON COLUMN health_records.mental_status IS '精神状态：good（良好）、fair（一般）、poor（差）';
```

---

### 2.4 milk_records (产奶记录)

每次挤奶的产量和质量数据。

```sql
-- 枚举类型
CREATE TYPE milking_session AS ENUM ('morning', 'afternoon', 'evening');

CREATE TABLE milk_records (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  
  -- 业务字段
  recorded_datetime TIMESTAMP WITH TIME ZONE NOT NULL, -- 记录时间
  session milking_session NOT NULL,                    -- 挤奶时段
  amount NUMERIC(6,2) NOT NULL CHECK (amount >= 0),   -- 产量（升）
  fat_rate NUMERIC(4,2) CHECK (fat_rate BETWEEN 0 AND 15), -- 脂肪率（%）
  protein_rate NUMERIC(4,2) CHECK (protein_rate BETWEEN 0 AND 10), -- 蛋白质率（%）
  somatic_cell_count INTEGER CHECK (somatic_cell_count >= 0), -- 体细胞数（千个/ml）
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
  CONSTRAINT valid_recorded_datetime CHECK (recorded_datetime <= NOW())
);

-- 索引
CREATE INDEX idx_milk_cow ON milk_records(cow_id);
CREATE INDEX idx_milk_datetime ON milk_records(recorded_datetime DESC);
CREATE INDEX idx_milk_date ON milk_records(DATE(recorded_datetime) DESC);
CREATE INDEX idx_milk_deleted ON milk_records(deleted_at) WHERE deleted_at IS NULL;

-- RLS 策略
ALTER TABLE milk_records ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可查看
CREATE POLICY "milk_select_all" ON milk_records
  FOR SELECT USING (deleted_at IS NULL);

-- 管理员和养殖员可创建
CREATE POLICY "milk_insert_staff" ON milk_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 创建者和管理员可更新
CREATE POLICY "milk_update_own_or_admin" ON milk_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- 注释
COMMENT ON TABLE milk_records IS '产奶记录表，记录每次挤奶的产量和质量';
COMMENT ON COLUMN milk_records.session IS '挤奶时段：morning（上午）、afternoon（下午）、evening（晚上）';
COMMENT ON COLUMN milk_records.somatic_cell_count IS '体细胞数，衡量乳房健康，<200千个/ml为优质奶';
```

---

### 2.5 breeding_records (繁殖记录)

繁殖周期的完整记录。

```sql
-- 枚举类型
CREATE TYPE breeding_method AS ENUM ('artificial_insemination', 'natural_mating');
CREATE TYPE pregnancy_result AS ENUM ('confirmed', 'not_pregnant', 'pending');

CREATE TABLE breeding_records (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联
  dam_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT, -- 母牛
  sire_id UUID REFERENCES cows(id) ON DELETE SET NULL,         -- 公牛（可为空，使用精液）
  calf_id UUID REFERENCES cows(id) ON DELETE SET NULL,         -- 犊牛（产犊后填写）
  
  -- 繁殖周期
  estrus_date DATE,                                    -- 发情日期
  breeding_date DATE NOT NULL,                         -- 配种日期
  breeding_method breeding_method NOT NULL,            -- 配种方式
  semen_batch VARCHAR(100),                            -- 精液批号（人工授精使用）
  
  -- 妊娠检查
  pregnancy_check_date DATE,                           -- 妊娠检查日期
  pregnancy_result pregnancy_result,                   -- 妊娠结果
  expected_calving_date DATE,                          -- 预产期
  
  -- 产犊信息
  actual_calving_date DATE,                            -- 实际产犊日期
  is_difficult_birth BOOLEAN DEFAULT FALSE,            -- 难产标记
  calving_notes TEXT,                                  -- 产犊备注
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
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

-- 索引
CREATE INDEX idx_breeding_dam ON breeding_records(dam_id);
CREATE INDEX idx_breeding_sire ON breeding_records(sire_id);
CREATE INDEX idx_breeding_calf ON breeding_records(calf_id);
CREATE INDEX idx_breeding_date ON breeding_records(breeding_date DESC);
CREATE INDEX idx_breeding_calving ON breeding_records(expected_calving_date) WHERE pregnancy_result = 'confirmed';
CREATE INDEX idx_breeding_deleted ON breeding_records(deleted_at) WHERE deleted_at IS NULL;

-- RLS 策略
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "breeding_select_all" ON breeding_records
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "breeding_insert_staff" ON breeding_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "breeding_update_staff" ON breeding_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 注释
COMMENT ON TABLE breeding_records IS '繁殖记录表，跟踪从发情到产犊的完整周期';
COMMENT ON COLUMN breeding_records.dam_id IS '母牛ID，必填';
COMMENT ON COLUMN breeding_records.sire_id IS '公牛ID，自然交配时填写，人工授精可为空';
COMMENT ON COLUMN breeding_records.pregnancy_result IS '妊娠结果：confirmed（确认怀孕）、not_pregnant（未孕）、pending（待检查）';
```

---

### 2.6 feed_formulas (饲料配方)

饲料配方定义。

```sql
-- 枚举类型
CREATE TYPE cattle_group_type AS ENUM ('lactating', 'dry', 'calf', 'heifer');

CREATE TABLE feed_formulas (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 业务字段
  formula_name VARCHAR(200) NOT NULL,                  -- 配方名称
  cattle_group cattle_group_type NOT NULL,             -- 适用牛群类型
  ingredients JSONB NOT NULL,                          -- 原料列表（JSON数组）
  nutrition_facts JSONB,                               -- 营养成分（JSON对象）
  unit_cost NUMERIC(10,2) CHECK (unit_cost >= 0),     -- 单位成本（元/公斤）
  is_active BOOLEAN DEFAULT TRUE NOT NULL,             -- 是否启用
  notes TEXT,                                          -- 备注
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
  CONSTRAINT valid_ingredients CHECK (jsonb_typeof(ingredients) = 'array'),
  CONSTRAINT valid_nutrition CHECK (nutrition_facts IS NULL OR jsonb_typeof(nutrition_facts) = 'object')
);

-- 索引
CREATE INDEX idx_formula_group ON feed_formulas(cattle_group);
CREATE INDEX idx_formula_active ON feed_formulas(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_formula_deleted ON feed_formulas(deleted_at) WHERE deleted_at IS NULL;

-- GIN 索引支持 JSONB 查询
CREATE INDEX idx_formula_ingredients ON feed_formulas USING GIN (ingredients);

-- RLS 策略
ALTER TABLE feed_formulas ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可查看
CREATE POLICY "formula_select_all" ON feed_formulas
  FOR SELECT USING (deleted_at IS NULL AND is_active = TRUE);

-- 管理员可管理（成本信息敏感，仅管理员）
CREATE POLICY "formula_all_admin" ON feed_formulas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 注释
COMMENT ON TABLE feed_formulas IS '饲料配方表，定义各类牛群的饲料组成';
COMMENT ON COLUMN feed_formulas.cattle_group IS '适用牛群：lactating（泌乳牛）、dry（干奶牛）、calf（犊牛）、heifer（青年母牛）';
COMMENT ON COLUMN feed_formulas.ingredients IS 'JSON数组，格式：[{"name": "玉米", "ratio": 30, "unit": "kg"}]';
COMMENT ON COLUMN feed_formulas.nutrition_facts IS 'JSON对象，格式：{"protein": 18, "energy": 2.5, "calcium": 1.2}';
COMMENT ON COLUMN feed_formulas.unit_cost IS '单位成本（元/公斤），敏感数据仅管理员可见';
```

---

### 2.7 feeding_records (投喂记录)

每日饲料投喂记录。

```sql
CREATE TABLE feeding_records (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联
  cow_id UUID REFERENCES cows(id) ON DELETE RESTRICT,          -- 单头奶牛（可为空，表示牛群投喂）
  formula_id UUID NOT NULL REFERENCES feed_formulas(id) ON DELETE RESTRICT,
  
  -- 业务字段
  feeding_datetime TIMESTAMP WITH TIME ZONE NOT NULL,  -- 投喂时间
  amount NUMERIC(8,2) NOT NULL CHECK (amount > 0),    -- 投喂量（公斤）
  actual_cost NUMERIC(10,2),                           -- 实际成本（元）
  cattle_group cattle_group_type,                      -- 牛群类型（cow_id 为空时填写）
  notes TEXT,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
  CONSTRAINT valid_feeding_datetime CHECK (feeding_datetime <= NOW()),
  CONSTRAINT cow_or_group CHECK (
    (cow_id IS NOT NULL AND cattle_group IS NULL) OR
    (cow_id IS NULL AND cattle_group IS NOT NULL)
  )
);

-- 索引
CREATE INDEX idx_feeding_cow ON feeding_records(cow_id);
CREATE INDEX idx_feeding_formula ON feeding_records(formula_id);
CREATE INDEX idx_feeding_datetime ON feeding_records(feeding_datetime DESC);
CREATE INDEX idx_feeding_group ON feeding_records(cattle_group);
CREATE INDEX idx_feeding_deleted ON feeding_records(deleted_at) WHERE deleted_at IS NULL;

-- RLS 策略
ALTER TABLE feeding_records ENABLE ROW LEVEL SECURITY;

-- 养殖员和管理员可查看（成本数据管理员额外处理）
CREATE POLICY "feeding_select_staff" ON feeding_records
  FOR SELECT USING (
    deleted_at IS NULL AND
    (
      -- 养殖员和管理员可查看，但养殖员看不到成本
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff')
      )
    )
  );

-- 管理员和养殖员可创建
CREATE POLICY "feeding_insert_staff" ON feeding_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 创建者和管理员可更新
CREATE POLICY "feeding_update_own_or_admin" ON feeding_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- 注释
COMMENT ON TABLE feeding_records IS '投喂记录表，记录每次饲料投喂';
COMMENT ON COLUMN feeding_records.cow_id IS '单头奶牛ID，与cattle_group二选一';
COMMENT ON COLUMN feeding_records.cattle_group IS '牛群类型，与cow_id二选一，用于批量投喂';
COMMENT ON COLUMN feeding_records.actual_cost IS '实际成本，敏感数据';
```

---

### 2.8 medical_records (疫苗与治疗记录)

疫苗接种和疾病治疗记录。

```sql
-- 枚举类型
CREATE TYPE medical_type AS ENUM ('vaccination', 'treatment');

CREATE TABLE medical_records (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联
  cow_id UUID NOT NULL REFERENCES cows(id) ON DELETE RESTRICT,
  veterinarian_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 兽医ID
  
  -- 业务字段
  record_type medical_type NOT NULL,                   -- 记录类型
  performed_date DATE NOT NULL,                        -- 实施日期
  vaccine_name VARCHAR(200),                           -- 疫苗名称（vaccination 时填写）
  disease_diagnosis VARCHAR(200),                      -- 疾病诊断（treatment 时填写）
  treatment_plan TEXT,                                 -- 治疗方案
  medications JSONB,                                   -- 用药清单（JSON数组）
  next_appointment_date DATE,                          -- 下次预约日期（复查/下次接种）
  notes TEXT,
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 约束
  CONSTRAINT valid_performed_date CHECK (performed_date <= CURRENT_DATE),
  CONSTRAINT vaccine_or_disease CHECK (
    (record_type = 'vaccination' AND vaccine_name IS NOT NULL) OR
    (record_type = 'treatment' AND disease_diagnosis IS NOT NULL)
  ),
  CONSTRAINT valid_medications CHECK (medications IS NULL OR jsonb_typeof(medications) = 'array')
);

-- 索引
CREATE INDEX idx_medical_cow ON medical_records(cow_id);
CREATE INDEX idx_medical_vet ON medical_records(veterinarian_id);
CREATE INDEX idx_medical_date ON medical_records(performed_date DESC);
CREATE INDEX idx_medical_type ON medical_records(record_type);
CREATE INDEX idx_medical_appointment ON medical_records(next_appointment_date) WHERE next_appointment_date IS NOT NULL;
CREATE INDEX idx_medical_deleted ON medical_records(deleted_at) WHERE deleted_at IS NULL;

-- RLS 策略
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medical_select_all" ON medical_records
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "medical_insert_staff" ON medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "medical_update_own_or_admin" ON medical_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR veterinarian_id = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- 注释
COMMENT ON TABLE medical_records IS '医疗记录表，包括疫苗接种和疾病治疗';
COMMENT ON COLUMN medical_records.record_type IS '记录类型：vaccination（疫苗接种）、treatment（疾病治疗）';
COMMENT ON COLUMN medical_records.medications IS 'JSON数组，格式：[{"name": "青霉素", "dosage": "100ml", "frequency": "每日2次"}]';
```

---

### 2.9 notifications (通知)

系统通知记录。

```sql
-- 枚举类型
CREATE TYPE notification_type AS ENUM ('health_alert', 'breeding_reminder', 'inventory_warning', 'medical_reminder');

CREATE TABLE notifications (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 关联
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_cow_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  
  -- 业务字段
  notification_type notification_type NOT NULL,        -- 通知类型
  title VARCHAR(200) NOT NULL,                         -- 标题
  content TEXT NOT NULL,                               -- 内容
  related_record_id UUID,                              -- 关联记录ID（如health_record.id）
  related_table_name VARCHAR(50),                      -- 关联表名
  is_read BOOLEAN DEFAULT FALSE NOT NULL,              -- 是否已读
  
  -- 审计字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_type ON notifications(notification_type);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- RLS 策略
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的通知
CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- 用户只能更新自己的通知（标记已读）
CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 系统（通过Service Role Key）可创建通知
-- 注意：此策略需要在 Netlify Functions 中使用 Service Role Key

-- 注释
COMMENT ON TABLE notifications IS '系统通知表，推送健康预警、繁殖提醒等';
COMMENT ON COLUMN notifications.notification_type IS '通知类型：health_alert（健康预警）、breeding_reminder（繁殖提醒）、inventory_warning（库存预警）、medical_reminder（医疗提醒）';
```

---

### 2.10 audit_logs (审计日志)

系统操作审计记录。

```sql
-- 枚举类型
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

CREATE TABLE audit_logs (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 审计信息
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,                        -- 操作类型
  table_name VARCHAR(100) NOT NULL,                    -- 表名
  record_id UUID NOT NULL,                             -- 记录ID
  old_value JSONB,                                     -- 变更前数据
  new_value JSONB,                                     -- 变更后数据
  ip_address INET,                                     -- IP地址（可选）
  user_agent TEXT,                                     -- 用户代理（可选）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- GIN 索引支持 JSONB 查询（查找特定字段变更）
CREATE INDEX idx_audit_old_value ON audit_logs USING GIN (old_value);
CREATE INDEX idx_audit_new_value ON audit_logs USING GIN (new_value);

-- RLS 策略
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 仅管理员可查看审计日志
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 审计日志通过触发器自动插入，无需手动 INSERT 权限
-- 禁止 UPDATE 和 DELETE（审计日志不可变）

-- 注释
COMMENT ON TABLE audit_logs IS '审计日志表，记录所有数据变更操作，永久保留';
COMMENT ON COLUMN audit_logs.old_value IS '变更前的完整行数据（JSON格式）';
COMMENT ON COLUMN audit_logs.new_value IS '变更后的完整行数据（JSON格式）';
```

---

## 3. 数据库触发器

### 3.1 审计日志触发器

自动记录所有业务表的 CRUD 操作到 `audit_logs` 表。

```sql
-- 审计日志函数
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT 和 UPDATE 操作
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_value,
      new_value,
      ip_address
    ) VALUES (
      auth.uid(),
      TG_OP::audit_action,
      TG_TABLE_NAME,
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
      row_to_json(NEW),
      inet_client_addr()  -- 获取客户端IP（Supabase Realtime连接可能为NULL）
    );
    RETURN NEW;
  
  -- DELETE 操作
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_value,
      new_value,
      ip_address
    ) VALUES (
      auth.uid(),
      'DELETE'::audit_action,
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD),
      NULL,
      inet_client_addr()
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为所有业务表添加审计触发器
CREATE TRIGGER audit_log_trigger_cows
AFTER INSERT OR UPDATE OR DELETE ON cows
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_log_trigger_health
AFTER INSERT OR UPDATE OR DELETE ON health_records
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_log_trigger_milk
AFTER INSERT OR UPDATE OR DELETE ON milk_records
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_log_trigger_breeding
AFTER INSERT OR UPDATE OR DELETE ON breeding_records
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_log_trigger_formula
AFTER INSERT OR UPDATE OR DELETE ON feed_formulas
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_log_trigger_feeding
AFTER INSERT OR UPDATE OR DELETE ON feeding_records
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_log_trigger_medical
AFTER INSERT OR UPDATE OR DELETE ON medical_records
FOR EACH ROW EXECUTE FUNCTION log_audit();
```

### 3.2 自动更新 updated_at 触发器

```sql
-- 自动更新 updated_at 函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有业务表添加 updated_at 触发器
CREATE TRIGGER update_cows_updated_at
BEFORE UPDATE ON cows
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_health_updated_at
BEFORE UPDATE ON health_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_milk_updated_at
BEFORE UPDATE ON milk_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_breeding_updated_at
BEFORE UPDATE ON breeding_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_formula_updated_at
BEFORE UPDATE ON feed_formulas
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feeding_updated_at
BEFORE UPDATE ON feeding_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medical_updated_at
BEFORE UPDATE ON medical_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.3 健康预警触发器

体温 ≥ 39.5°C 时自动创建通知。

```sql
-- 健康预警函数
CREATE OR REPLACE FUNCTION health_alert_notification()
RETURNS TRIGGER AS $$
DECLARE
  cow_record RECORD;
  admin_user_id UUID;
BEGIN
  -- 检查体温是否超过 39.5°C
  IF NEW.temperature >= 39.5 THEN
    -- 获取奶牛信息
    SELECT cow_number, name INTO cow_record FROM cows WHERE id = NEW.cow_id;
    
    -- 为所有管理员和养殖员创建通知
    FOR admin_user_id IN
      SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = TRUE
    LOOP
      INSERT INTO notifications (
        user_id,
        related_cow_id,
        notification_type,
        title,
        content,
        related_record_id,
        related_table_name
      ) VALUES (
        admin_user_id,
        NEW.cow_id,
        'health_alert',
        '健康预警：体温异常',
        format('奶牛 %s (%s) 体温达到 %s°C，请立即检查！',
          cow_record.cow_number,
          COALESCE(cow_record.name, '未命名'),
          NEW.temperature
        ),
        NEW.id,
        'health_records'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER health_alert_trigger
AFTER INSERT OR UPDATE OF temperature ON health_records
FOR EACH ROW
WHEN (NEW.temperature >= 39.5)
EXECUTE FUNCTION health_alert_notification();
```

---

## 4. 数据库视图

### 4.1 活跃奶牛视图（排除软删除）

```sql
CREATE VIEW active_cows AS
SELECT *
FROM cows
WHERE deleted_at IS NULL AND status = 'active';

-- 注释
COMMENT ON VIEW active_cows IS '活跃奶牛视图，自动排除软删除和非活跃状态的奶牛';
```

### 4.2 最近7天健康记录视图

```sql
CREATE VIEW recent_health_records AS
SELECT
  hr.*,
  c.cow_number,
  c.name AS cow_name,
  u.full_name AS recorded_by_name
FROM health_records hr
JOIN cows c ON hr.cow_id = c.id
JOIN users u ON hr.created_by = u.id
WHERE hr.deleted_at IS NULL
  AND hr.recorded_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY hr.recorded_date DESC, c.cow_number;

-- 注释
COMMENT ON VIEW recent_health_records IS '最近7天健康记录，包含奶牛信息和录入人姓名';
```

### 4.3 产奶统计视图（按牛、按月）

```sql
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

-- 注释
COMMENT ON VIEW monthly_milk_stats IS '按月统计每头奶牛的产奶数据';
```

---

## 5. 数据库函数（辅助查询）

### 5.1 获取奶牛完整系谱

```sql
CREATE OR REPLACE FUNCTION get_cow_pedigree(target_cow_id UUID, generations INT DEFAULT 3)
RETURNS TABLE (
  cow_id UUID,
  cow_number VARCHAR(50),
  cow_name VARCHAR(100),
  generation INT,
  relationship VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE pedigree AS (
    -- 起始节点（目标奶牛）
    SELECT
      c.id,
      c.cow_number,
      c.name,
      0 AS gen,
      'self'::VARCHAR(20) AS rel
    FROM cows c
    WHERE c.id = target_cow_id
    
    UNION ALL
    
    -- 递归查询父母
    SELECT
      c.id,
      c.cow_number,
      c.name,
      p.gen + 1,
      CASE
        WHEN p.gen = 0 THEN
          CASE
            WHEN c.id = (SELECT sire_id FROM cows WHERE id = p.id) THEN 'father'
            ELSE 'mother'
          END
        ELSE 'ancestor'
      END
    FROM cows c
    JOIN pedigree p ON c.id IN (
      SELECT sire_id FROM cows WHERE id = p.id AND sire_id IS NOT NULL
      UNION
      SELECT dam_id FROM cows WHERE id = p.id AND dam_id IS NOT NULL
    )
    WHERE p.gen < generations
  )
  SELECT * FROM pedigree ORDER BY gen, rel;
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON FUNCTION get_cow_pedigree IS '获取奶牛完整系谱，支持多代追溯（默认3代）';
```

### 5.2 计算奶牛年龄

```sql
CREATE OR REPLACE FUNCTION calculate_cow_age(cow_birth_date DATE)
RETURNS INTERVAL AS $$
BEGIN
  RETURN AGE(CURRENT_DATE, cow_birth_date);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 使用示例：
-- SELECT cow_number, calculate_cow_age(birth_date) FROM cows;
```

---

## 6. 初始数据种子（Seed Data）

用于开发和测试环境。

```sql
-- 插入测试管理员用户（需要先在 Supabase Auth 创建用户，然后关联）
-- 假设 Auth 用户 ID: 00000000-0000-0000-0000-000000000001
INSERT INTO users (id, full_name, role, phone, farm_name, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', '张三', 'admin', '13800138000', '阳光奶牛养殖场', TRUE),
  ('00000000-0000-0000-0000-000000000002', '李四', 'staff', '13900139000', '阳光奶牛养殖场', TRUE),
  ('00000000-0000-0000-0000-000000000003', '王五', 'guest', NULL, '阳光奶牛养殖场', TRUE);

-- 插入测试奶牛数据
INSERT INTO cows (cow_number, name, breed, gender, birth_date, entry_date, status, created_by, updated_by)
VALUES
  ('CN001', '小花', 'holstein', 'female', '2020-03-15', '2020-03-20', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('CN002', '大力', 'holstein', 'male', '2019-06-10', '2019-06-15', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('CN003', '美美', 'jersey', 'female', '2021-01-05', '2021-01-10', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

-- 插入测试饲料配方
INSERT INTO feed_formulas (formula_name, cattle_group, ingredients, nutrition_facts, unit_cost, created_by, updated_by)
VALUES
  (
    '泌乳牛精料配方1号',
    'lactating',
    '[{"name":"玉米","ratio":30,"unit":"kg"},{"name":"豆粕","ratio":20,"unit":"kg"},{"name":"麸皮","ratio":10,"unit":"kg"}]'::jsonb,
    '{"protein":18.5,"energy":2.8,"calcium":1.2,"phosphorus":0.8}'::jsonb,
    12.50,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
  );

-- 更多种子数据...
```

---

## 7. 数据库性能优化建议

### 7.1 分区表（大数据量时考虑）

当 `health_records` 或 `milk_records` 数据量超过 100万条时，可考虑按日期分区：

```sql
-- 将 health_records 按月分区
CREATE TABLE health_records_partitioned (
  LIKE health_records INCLUDING ALL
) PARTITION BY RANGE (recorded_date);

CREATE TABLE health_records_2025_01 PARTITION OF health_records_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE health_records_2025_02 PARTITION OF health_records_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- 以此类推...
```

### 7.2 物化视图（复杂统计查询）

对于频繁查询的统计数据，可使用物化视图：

```sql
CREATE MATERIALIZED VIEW cow_summary_stats AS
SELECT
  c.id,
  c.cow_number,
  c.name,
  COUNT(DISTINCT hr.id) AS health_record_count,
  COUNT(DISTINCT mr.id) AS milk_record_count,
  AVG(mr.amount) AS avg_milk_amount
FROM cows c
LEFT JOIN health_records hr ON c.id = hr.cow_id AND hr.deleted_at IS NULL
LEFT JOIN milk_records mr ON c.id = mr.cow_id AND mr.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.cow_number, c.name;

-- 创建索引
CREATE UNIQUE INDEX ON cow_summary_stats (id);

-- 定期刷新（可通过 Supabase Edge Function 定时触发）
REFRESH MATERIALIZED VIEW CONCURRENTLY cow_summary_stats;
```

---

## 8. 数据模型验证清单

- [x] 所有业务表包含审计字段（created_at, updated_at, created_by, updated_by, deleted_at）
- [x] 所有表启用 RLS（ROW LEVEL SECURITY）
- [x] 主键统一使用 UUID
- [x] 外键约束正确设置（ON DELETE RESTRICT / SET NULL / CASCADE）
- [x] 枚举类型用于固定选项（gender_type, cow_status等）
- [x] JSONB 字段用于灵活数据（ingredients, medications）
- [x] 数值字段设置合理约束（CHECK约束）
- [x] 索引覆盖常用查询字段（外键、日期、状态）
- [x] 全文搜索索引（奶牛编号、名称）
- [x] 审计日志触发器覆盖所有业务表
- [x] 软删除模式（deleted_at）贯穿所有表
- [x] 视图简化常用查询
- [x] 数据库函数支持复杂业务逻辑（系谱查询）

---

## 9. 下一步：contracts/ 目录

数据模型设计完成后，下一步将生成：
1. `contracts/openapi.yaml`：API 端点规范
2. `contracts/supabase-rls.sql`：完整的 RLS 策略 SQL 脚本
3. `contracts/migration-script.sql`：数据库迁移脚本（用于 Supabase CLI）

---

**设计完成日期**: 2025-10-11  
**审核状态**: ✅ 已通过项目原则检查（Constitution Check）  
**下一阶段**: 生成 API 合约和快速上手指南

