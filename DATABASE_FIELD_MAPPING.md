# 数据库字段映射说明

## ⚠️ 重要：列名不匹配问题及修复

### 问题描述

数据库 `milk_records` 表的列名与TypeScript代码中使用的字段名不一致，导致数据无法正确显示。

### 字段映射表

| 代码中字段名 | 数据库实际列名 | 说明 |
|------------|--------------|------|
| `milking_session` | `session` | 挤奶时段 (morning/afternoon/evening) |
| `milk_yield` | `amount` | 产奶量 (升) |
| `fat_percentage` | `fat_rate` | 脂肪率 (%) |
| `protein_percentage` | `protein_rate` | 蛋白质率 (%) |

### 修复内容

#### 1. TypeScript 类型定义 (`src/types/milk.types.ts`)

✅ 已修复接口定义：
- `MilkRecord`
- `MilkRecordFormData`
- `MilkRecordFilters`
- `calculateDailyYield()` 函数

#### 2. 服务层 (`src/services/milk.service.ts`)

✅ 已修复所有字段引用：
- `getMilkRecords()` - 过滤参数
- `getMilkStats()` - 统计计算
- `getMilkTrend()` - 趋势数据查询

#### 3. 页面组件 (`src/pages/milk/index.astro`)

✅ 已修复显示逻辑：
- 列表中的字段显示
- 统计数据计算

#### 4. SQL 修复脚本

✅ 已创建正确的修复脚本：`FIX_MILK_RECORDS_DATA_CORRECT.sql`

### 执行修复步骤

1. **推送代码修复到 GitHub**
   ```bash
   git add -A
   git commit -m "fix: correct milk_records field names to match database schema"
   git push origin main
   ```

2. **在 Supabase Dashboard 执行 SQL**
   - 打开: https://supabase.com/dashboard/project/_/sql/new
   - 复制并执行 `FIX_MILK_RECORDS_DATA_CORRECT.sql`

3. **等待 Netlify 重新部署**
   - 约2-3分钟

4. **验证修复**
   - 访问: https://cowdatasystem.netlify.app/milk
   - 确认所有数据正确显示

### 验证检查项

- [x] TypeScript 类型定义已更新
- [x] 服务层代码已修复
- [x] 页面显示逻辑已修复
- [x] SQL 修复脚本已创建
- [ ] 代码已推送到 GitHub
- [ ] SQL 已在 Supabase 执行
- [ ] Netlify 已重新部署
- [ ] 数据显示已验证

### 数据库 Schema 参考

```sql
CREATE TABLE milk_records (
  id UUID PRIMARY KEY,
  cow_id UUID NOT NULL,
  recorded_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  session milking_session NOT NULL,           -- 挤奶时段
  amount NUMERIC(6,2) NOT NULL,                -- 产奶量
  fat_rate NUMERIC(4,2),                       -- 脂肪率
  protein_rate NUMERIC(4,2),                   -- 蛋白质率
  somatic_cell_count INTEGER,                  -- 体细胞数
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### 后续建议

1. **代码规范**
   - 建议统一使用数据库列名作为 TypeScript 字段名
   - 避免在代码层做字段映射转换

2. **文档维护**
   - 在 `data-model.md` 中明确标注字段名
   - 在类型定义中添加数据库列名注释

3. **测试覆盖**
   - 添加集成测试验证字段映射正确性
   - 测试数据插入和查询的完整流程

---

**最后更新**: 2025-10-12
**状态**: ✅ 代码已修复，等待部署和SQL执行

