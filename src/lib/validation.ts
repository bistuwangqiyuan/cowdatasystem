/**
 * Data Validation Utilities
 * 
 * 数据验证工具函数，确保用户输入符合业务规则。
 * 
 * @module lib/validation
 */

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 验证奶牛编号
 * 
 * 规则：3-50个大写字母或数字
 * 
 * @param number - 奶牛编号
 * @returns {ValidationResult} 验证结果
 * 
 * @example
 * ```typescript
 * const result = validateCowNumber('CN001');
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateCowNumber(number: string): ValidationResult {
  if (!number || number.trim() === '') {
    return { isValid: false, error: '奶牛编号不能为空' };
  }
  
  const pattern = /^[A-Z0-9]{3,50}$/;
  
  if (!pattern.test(number)) {
    return {
      isValid: false,
      error: '奶牛编号必须是3-50个大写字母或数字',
    };
  }
  
  return { isValid: true };
}

/**
 * 验证体温
 * 
 * 规则：35.0 - 45.0°C
 * 正常范围：37.5 - 39.5°C
 * 
 * @param temp - 体温（摄氏度）
 * @returns {ValidationResult} 验证结果
 */
export function validateTemperature(temp: number): ValidationResult {
  if (typeof temp !== 'number' || isNaN(temp)) {
    return { isValid: false, error: '体温必须是数字' };
  }
  
  if (temp < 35.0 || temp > 45.0) {
    return {
      isValid: false,
      error: '体温必须在35.0-45.0°C范围内',
    };
  }
  
  // 警告：体温异常
  if (temp >= 39.5) {
    return {
      isValid: true,
      error: '⚠️ 体温偏高（≥39.5°C），可能需要检查',
    };
  }
  
  if (temp < 37.5) {
    return {
      isValid: true,
      error: '⚠️ 体温偏低（<37.5°C），可能需要检查',
    };
  }
  
  return { isValid: true };
}

/**
 * 验证日期
 * 
 * 规则：不能是未来日期
 * 
 * @param date - 日期字符串（YYYY-MM-DD）
 * @returns {ValidationResult} 验证结果
 */
export function validateDate(date: string): ValidationResult {
  if (!date || date.trim() === '') {
    return { isValid: false, error: '日期不能为空' };
  }
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return { isValid: false, error: '日期格式无效' };
  }
  
  if (d > new Date()) {
    return { isValid: false, error: '日期不能是未来日期' };
  }
  
  return { isValid: true };
}

/**
 * 验证邮箱
 * 
 * @param email - 邮箱地址
 * @returns {ValidationResult} 验证结果
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: '邮箱不能为空' };
  }
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!pattern.test(email)) {
    return { isValid: false, error: '邮箱格式无效' };
  }
  
  return { isValid: true };
}

/**
 * 验证手机号
 * 
 * 规则：中国大陆手机号（11位）
 * 
 * @param phone - 手机号
 * @returns {ValidationResult} 验证结果
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // 手机号是可选的
  }
  
  const pattern = /^1[3-9]\d{9}$/;
  
  if (!pattern.test(phone)) {
    return { isValid: false, error: '手机号格式无效（11位数字）' };
  }
  
  return { isValid: true };
}

/**
 * 验证产奶量
 * 
 * 规则：必须 >= 0，合理范围 0-100升
 * 
 * @param amount - 产奶量（升）
 * @returns {ValidationResult} 验证结果
 */
export function validateMilkAmount(amount: number): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: '产奶量必须是数字' };
  }
  
  if (amount < 0) {
    return { isValid: false, error: '产奶量不能为负数' };
  }
  
  if (amount > 100) {
    return {
      isValid: true,
      error: '⚠️ 产奶量超过100升，请确认数据正确',
    };
  }
  
  return { isValid: true };
}

/**
 * 验证脂肪率
 * 
 * 规则：0-15%，正常范围 3-5%
 * 
 * @param rate - 脂肪率（%）
 * @returns {ValidationResult} 验证结果
 */
export function validateFatRate(rate: number | null): ValidationResult {
  if (rate === null || rate === undefined) {
    return { isValid: true }; // 可选字段
  }
  
  if (typeof rate !== 'number' || isNaN(rate)) {
    return { isValid: false, error: '脂肪率必须是数字' };
  }
  
  if (rate < 0 || rate > 15) {
    return { isValid: false, error: '脂肪率必须在0-15%范围内' };
  }
  
  return { isValid: true };
}

/**
 * 验证蛋白质率
 * 
 * 规则：0-10%，正常范围 2.8-3.5%
 * 
 * @param rate - 蛋白质率（%）
 * @returns {ValidationResult} 验证结果
 */
export function validateProteinRate(rate: number | null): ValidationResult {
  if (rate === null || rate === undefined) {
    return { isValid: true }; // 可选字段
  }
  
  if (typeof rate !== 'number' || isNaN(rate)) {
    return { isValid: false, error: '蛋白质率必须是数字' };
  }
  
  if (rate < 0 || rate > 10) {
    return { isValid: false, error: '蛋白质率必须在0-10%范围内' };
  }
  
  return { isValid: true };
}

/**
 * 验证密码强度
 * 
 * 规则：至少8个字符
 * 
 * @param password - 密码
 * @returns {ValidationResult} 验证结果
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim() === '') {
    return { isValid: false, error: '密码不能为空' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: '密码至少需要8个字符' };
  }
  
  // 可选：强密码要求
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: true,
      error: '建议密码包含大写字母、小写字母和数字',
    };
  }
  
  return { isValid: true };
}

/**
 * 验证出生日期与入栏日期
 * 
 * 规则：出生日期 <= 入栏日期 <= 今天
 * 
 * @param birthDate - 出生日期
 * @param entryDate - 入栏日期
 * @returns {ValidationResult} 验证结果
 */
export function validateBirthAndEntryDates(
  birthDate: string,
  entryDate: string
): ValidationResult {
  const birth = new Date(birthDate);
  const entry = new Date(entryDate);
  const today = new Date();
  
  if (isNaN(birth.getTime()) || isNaN(entry.getTime())) {
    return { isValid: false, error: '日期格式无效' };
  }
  
  if (birth > entry) {
    return { isValid: false, error: '出生日期必须早于或等于入栏日期' };
  }
  
  if (entry > today) {
    return { isValid: false, error: '入栏日期不能是未来日期' };
  }
  
  return { isValid: true };
}

/**
 * 批量验证
 * 
 * @param validators - 验证函数数组
 * @returns {ValidationResult} 汇总验证结果
 * 
 * @example
 * ```typescript
 * const result = validateAll([
 *   () => validateCowNumber('CN001'),
 *   () => validateTemperature(38.5),
 * ]);
 * ```
 */
export function validateAll(
  validators: (() => ValidationResult)[]
): ValidationResult {
  const errors: string[] = [];
  
  for (const validator of validators) {
    const result = validator();
    if (!result.isValid) {
      errors.push(result.error || 'Unknown error');
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, error: errors.join('; ') };
  }
  
  return { isValid: true };
}

