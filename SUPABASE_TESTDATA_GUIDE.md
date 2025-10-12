# 📊 Supabase测试数据添加指南

## 概述

本指南将帮助您在Supabase数据库中添加3条测试奶牛数据及相关记录。

## ✅ 准备工作

### 1. 确认Supabase项目信息

请确保您有以下信息：
- Supabase项目URL
- Supabase项目Dashboard访问权限

### 2. 创建测试用户（如果还没有）

在执行SQL脚本前，需要至少一个用户账号：

1. 访问Supabase Dashboard：`https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
2. 导航到：**Authentication** → **Users**
3. 点击 **Add user** 按钮
4. 填写用户信息：
   - Email: `test@example.com`
   - Password: `Test123456!`（或您自定义的密码）
5. 点击 **Create user**

## 📝 执行步骤

### 方式一：通过Supabase Dashboard执行（推荐）

#### 步骤1：打开SQL Editor

1. 登录Supabase Dashboard
2. 选择您的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query** 创建新查询

#### 步骤2：执行SQL脚本

1. 打开项目中的 `database_setup_with_testdata.sql` 文件
2. 复制全部内容
3. 粘贴到SQL Editor中
4. 点击 **Run** 按钮执行

#### 步骤3：验证结果

执行成功后，您应该看到：

```
✅ 成功插入3头测试奶牛及其健康和产奶记录！
   - 奶牛1: CN001 贝拉 (荷斯坦)
   - 奶牛2: CN002 茉莉 (娟姗)
   - 奶牛3: CN003 露西 (荷斯坦)
```

以及数据统计表：

| 类型      | 数量 |
|-----------|------|
| 奶牛总数  | 3    |
| 健康记录数| 3    |
| 产奶记录数| 6    |

### 方式二：通过Supabase CLI执行

如果您已配置好Supabase CLI：

```bash
# 链接到远程项目
supabase link --project-ref YOUR_PROJECT_ID

# 执行SQL脚本
psql YOUR_DATABASE_URL < database_setup_with_testdata.sql
```

## 📋 测试数据详情

### 奶牛1：贝拉（CN001）

- **品种**: 荷斯坦 (Holstein)
- **性别**: 母牛
- **出生日期**: 2021-03-15
- **状态**: 活跃
- **特点**: 高产奶牛，性格温顺
- **健康**: 体温38.5°C，精神良好
- **产奶**: 
  - 早上：28.50kg，乳脂3.8%，蛋白3.2%
  - 下午：26.30kg，乳脂3.9%，蛋白3.3%

### 奶牛2：茉莉（CN002）

- **品种**: 娟姗 (Jersey)
- **性别**: 母牛
- **出生日期**: 2020-08-22
- **状态**: 活跃
- **特点**: 乳脂率高，适应性强
- **健康**: 体温38.7°C，精神良好
- **产奶**:
  - 早上：22.80kg，乳脂5.2%，蛋白3.8%
  - 下午：21.50kg，乳脂5.3%，蛋白3.9%

### 奶牛3：露西（CN003）

- **品种**: 荷斯坦 (Holstein)
- **性别**: 母牛
- **出生日期**: 2022-01-10
- **状态**: 活跃
- **特点**: 年轻奶牛，生长良好
- **健康**: 体温38.6°C，精神一般（需观察）
- **产奶**:
  - 早上：18.90kg，乳脂3.7%，蛋白3.1%
  - 下午：17.20kg，乳脂3.8%，蛋白3.2%

## 🔍 验证数据

### 方法1：通过SQL查询

在SQL Editor中执行：

```sql
-- 查看所有奶牛
SELECT cow_number, name, breed, gender, birth_date, status 
FROM cows 
WHERE deleted_at IS NULL
ORDER BY cow_number;

-- 查看健康记录
SELECT 
  c.cow_number,
  c.name,
  hr.recorded_date,
  hr.temperature,
  hr.mental_status,
  hr.appetite
FROM health_records hr
JOIN cows c ON hr.cow_id = c.id
WHERE hr.deleted_at IS NULL
ORDER BY c.cow_number;

-- 查看产奶记录
SELECT 
  c.cow_number,
  c.name,
  mr.recorded_datetime,
  mr.session,
  mr.amount,
  mr.fat_rate,
  mr.protein_rate
FROM milk_records mr
JOIN cows c ON mr.cow_id = c.id
WHERE mr.deleted_at IS NULL
ORDER BY c.cow_number, mr.recorded_datetime;
```

### 方法2：通过Table Editor

1. 进入 **Table Editor**
2. 选择 `cows` 表查看奶牛列表
3. 选择 `health_records` 表查看健康记录
4. 选择 `milk_records` 表查看产奶记录

### 方法3：通过应用界面

访问您的应用：
- **奶牛档案页面**: https://cowdatasystem.netlify.app/cows
- **健康记录页面**: https://cowdatasystem.netlify.app/health
- **产奶记录页面**: https://cowdatasystem.netlify.app/milk

## ❓ 常见问题

### Q1: 执行脚本时报错 "请先在Supabase Auth中创建至少一个用户"

**解决方法**: 按照"准备工作"部分的步骤先创建一个测试用户。

### Q2: 报错 "relation cows does not exist"

**解决方法**: 表还没有创建。脚本会自动创建表，如果失败，请检查：
1. 是否有足够的权限
2. 是否在正确的schema (public)中执行

### Q3: 如何清空测试数据重新导入？

执行以下SQL：

```sql
-- 删除所有测试数据
DELETE FROM milk_records;
DELETE FROM health_records;
DELETE FROM cows;

-- 然后重新执行导入脚本
```

### Q4: 如何添加更多测试数据？

您可以修改 `database_setup_with_testdata.sql` 文件，在 `DO $$ ... END $$;` 块中添加更多INSERT语句。

## 📚 相关文档

- [Supabase SQL Editor 文档](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL 数据类型](https://www.postgresql.org/docs/current/datatype.html)
- [项目数据模型说明](specs/001-netlify/data-model.md)

## 🎯 下一步

数据导入成功后，您可以：

1. **测试应用功能**
   - 登录应用
   - 浏览奶牛列表
   - 查看健康和产奶记录
   - 尝试添加新记录

2. **配置RLS策略**
   - 执行 `supabase/migrations/002_rls_policies.sql`
   - 确保数据访问安全

3. **添加更多数据**
   - 繁殖记录
   - 饲料配方
   - 医疗记录

---

**需要帮助？** 请查看项目README.md或提交Issue。

