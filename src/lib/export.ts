/**
 * 数据导出工具类
 * 支持 CSV 和 JSON 格式导出
 */

/**
 * 将数据导出为 CSV 格式
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // 获取表头
  const csvHeaders = headers || Object.keys(data[0]);
  
  // 生成 CSV 内容
  const csvRows = [
    csvHeaders.join(','), // 表头行
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // 处理包含逗号或引号的值
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];

  const csvContent = '\uFEFF' + csvRows.join('\n'); // 添加 BOM 以支持中文
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 将数据导出为 JSON 格式
 */
export function exportToJSON(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 导出奶牛数据
 */
export function exportCowsData(cows: any[]) {
  const exportData = cows.map(cow => ({
    '奶牛编号': cow.cow_number,
    '名称': cow.name || '',
    '品种': cow.breed === 'holstein' ? '荷斯坦' : cow.breed === 'jersey' ? '娟姗' : '其他',
    '性别': cow.gender === 'female' ? '母牛' : '公牛',
    '出生日期': cow.birth_date,
    '入栏日期': cow.entry_date,
    '状态': cow.status === 'active' ? '在养' : cow.status === 'culled' ? '已淘汰' : cow.status === 'sold' ? '已售出' : '死亡',
    '备注': cow.notes || '',
  }));
  
  exportToCSV(exportData, `奶牛档案_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 导出健康记录
 */
export function exportHealthRecords(records: any[]) {
  const exportData = records.map(record => ({
    '检查时间': new Date(record.check_datetime).toLocaleString('zh-CN'),
    '奶牛编号': record.cow_id,
    '体温': record.temperature,
    '精神状态': record.mental_state === 'normal' ? '正常' : record.mental_state === 'depressed' ? '沉郁' : '兴奋',
    '食欲': record.appetite === 'good' ? '良好' : record.appetite === 'normal' ? '一般' : '较差',
    '呼吸频率': record.respiratory_rate || '',
    '心率': record.heart_rate || '',
    '瘤胃蠕动': record.rumen_movement || '',
    '健康问题': record.health_issues || '',
    '处理措施': record.treatment || '',
    '备注': record.notes || '',
  }));
  
  exportToCSV(exportData, `健康记录_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 导出产奶记录
 */
export function exportMilkRecords(records: any[]) {
  const exportData = records.map(record => ({
    '挤奶时间': new Date(record.recorded_datetime).toLocaleString('zh-CN'),
    '奶牛编号': record.cow_id,
    '挤奶时段': record.milking_session === 'morning' ? '早班' : record.milking_session === 'afternoon' ? '午班' : '晚班',
    '产奶量(L)': record.milk_yield,
    '脂肪率(%)': record.fat_percentage || '',
    '蛋白质率(%)': record.protein_percentage || '',
    '乳糖(%)': record.lactose_percentage || '',
    '体细胞数': record.somatic_cell_count || '',
    '备注': record.notes || '',
  }));
  
  exportToCSV(exportData, `产奶记录_${new Date().toISOString().split('T')[0]}`);
}

/**
 * 导出繁殖记录
 */
export function exportBreedingRecords(records: any[]) {
  const exportData = records.map(record => ({
    '配种日期': record.breeding_date,
    '奶牛编号': record.cow_id,
    '配种方式': record.breeding_method === 'artificial' ? '人工授精' : '自然交配',
    '状态': record.status === 'planned' ? '计划配种' : record.status === 'completed' ? '已完成' : record.status === 'failed' ? '配种失败' : '终止',
    '妊娠检查日期': record.pregnancy_check_date || '',
    '妊娠结果': record.pregnancy_result ? (record.pregnancy_result === 'positive' ? '妊娠' : record.pregnancy_result === 'negative' ? '未妊娠' : '待确认') : '',
    '预产期': record.expected_calving_date || '',
    '实际产犊日期': record.actual_calving_date || '',
    '备注': record.notes || '',
  }));
  
  exportToCSV(exportData, `繁殖记录_${new Date().toISOString().split('T')[0]}`);
}

