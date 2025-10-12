# 字段映射问题说明

## 发现的问题

### 1. 产奶记录 - 已修复 ✅
- **问题**: `analytics/index.astro` 使用了错误的字段名 `milk_yield`
- **数据库实际字段**: `amount`
- **修复**: 已更新 `analytics/index.astro` 使用正确的 `amount` 字段

### 2. 健康记录 - 需要注意 ⚠️

#### 字段名不匹配

**数据库schema (001_initial_schema.sql)**:
```sql
CREATE TABLE health_records (
  recorded_date DATE NOT NULL,
  mental_status health_status,  -- enum: 'good', 'fair', 'poor'
  appetite health_status,        -- enum: 'good', 'fair', 'poor'
  fecal_condition VARCHAR(100),
  symptoms TEXT,
  ...
);
```

**TypeScript类型定义 (health.types.ts)**:
```typescript
interface HealthRecord {
  check_datetime: string;
  mental_state: MentalStateType;  // 'normal', 'depressed', 'excited'
  appetite: AppetiteType;         // 'good', 'normal', 'poor'
  health_issues: string;
  ...
}
```

**前端表单使用的字段名**:
- `check_datetime`
- `mental_state` 
- `health_issues`

#### 影响范围
- 前端表单 (HealthRecordForm.astro)
- 服务层 (health.service.ts)
- 健康记录列表页面 (health/index.astro)

## 建议的解决方案

### 短期方案（当前实现）
创建测试数据时使用数据库的实际字段名：
- `recorded_date` (DATE)
- `mental_status` ('good', 'fair', 'poor')
- `symptoms` (TEXT)

### 长期方案（需要重构）
选择以下方案之一：

1. **修改数据库schema以匹配TypeScript定义**
   - 将 `recorded_date` 改为 `check_datetime` (TIMESTAMP)
   - 将 `mental_status` 改为 `mental_state`
   - 修改 `health_status` enum 为 ('normal', 'depressed', 'excited')
   - 将 `symptoms` 改为 `health_issues`

2. **修改TypeScript定义以匹配数据库**
   - 更新所有TypeScript接口
   - 更新前端表单字段名
   - 更新服务层查询

## 当前状态

- ✅ 产奶记录字段映射已修复
- ✅ 创建了与数据库schema兼容的测试数据脚本 (ADD_TEST_DATA.sql)
- ⚠️ 健康记录字段不匹配问题已记录，但暂未修复（需要系统性重构）

## 测试数据脚本说明

`ADD_TEST_DATA.sql` 脚本使用数据库的实际字段名：
- 健康记录使用: recorded_date, mental_status, appetite, symptoms
- 繁殖记录使用数据库schema中的字段
- 饲料记录使用数据库schema中的字段

执行此脚本可以成功添加测试数据，且数据分析仪表板将正常显示统计信息（NaN问题已修复）。

