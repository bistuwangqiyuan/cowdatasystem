-- ============================================
-- 修复产奶记录测试数据
-- ============================================
-- 说明：当前测试数据缺少必填字段 milk_yield 和 milking_session
-- 此脚本将为这些记录添加合理的测试数据

-- 更新产奶记录，添加缺失的必填字段
UPDATE milk_records 
SET 
  milk_yield = 
    CASE 
      WHEN somatic_cell_count = 190000 THEN 28.5
      WHEN somatic_cell_count = 125000 THEN 25.2
      WHEN somatic_cell_count = 155000 THEN 27.8
      WHEN somatic_cell_count = 115000 THEN 24.5
      WHEN somatic_cell_count = 145000 THEN 26.8
      WHEN somatic_cell_count = 175000 THEN 29.2
      WHEN somatic_cell_count = 180000 THEN 28.8
      WHEN somatic_cell_count = 120000 THEN 24.9
      WHEN somatic_cell_count = 150000 THEN 27.5
      ELSE 25.0
    END,
  milking_session = 
    CASE 
      WHEN EXTRACT(HOUR FROM recorded_datetime) < 10 THEN 'morning'::milking_session_type
      WHEN EXTRACT(HOUR FROM recorded_datetime) < 16 THEN 'afternoon'::milking_session_type
      ELSE 'evening'::milking_session_type
    END,
  fat_percentage = 
    CASE 
      WHEN somatic_cell_count = 190000 THEN 3.8
      WHEN somatic_cell_count = 125000 THEN 4.2
      WHEN somatic_cell_count = 155000 THEN 3.9
      WHEN somatic_cell_count = 115000 THEN 4.1
      WHEN somatic_cell_count = 145000 THEN 3.7
      WHEN somatic_cell_count = 175000 THEN 3.8
      WHEN somatic_cell_count = 180000 THEN 4.0
      WHEN somatic_cell_count = 120000 THEN 4.3
      WHEN somatic_cell_count = 150000 THEN 3.9
      ELSE 3.8
    END,
  protein_percentage = 
    CASE 
      WHEN somatic_cell_count = 190000 THEN 3.2
      WHEN somatic_cell_count = 125000 THEN 3.4
      WHEN somatic_cell_count = 155000 THEN 3.3
      WHEN somatic_cell_count = 115000 THEN 3.5
      WHEN somatic_cell_count = 145000 THEN 3.1
      WHEN somatic_cell_count = 175000 THEN 3.2
      WHEN somatic_cell_count = 180000 THEN 3.3
      WHEN somatic_cell_count = 120000 THEN 3.6
      WHEN somatic_cell_count = 150000 THEN 3.4
      ELSE 3.2
    END
WHERE milk_yield IS NULL;

-- 验证更新结果
SELECT 
  recorded_datetime,
  c.cow_number,
  milking_session,
  milk_yield,
  fat_percentage,
  protein_percentage,
  somatic_cell_count
FROM milk_records mr
JOIN cows c ON c.id = mr.cow_id
ORDER BY recorded_datetime DESC
LIMIT 10;

