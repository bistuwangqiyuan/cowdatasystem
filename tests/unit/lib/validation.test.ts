/**
 * Validation Functions Unit Test
 * 
 * 测试所有数据验证函数的正常、边界和失败用例。
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import {
  validateCowNumber,
  validateTemperature,
  validateDate,
  validateEmail,
  validatePhone,
  validateMilkAmount,
  validateFatRate,
  validateProteinRate,
  validatePassword,
  validateBirthAndEntryDates,
  validateAll,
} from '../../../src/lib/validation';

describe('Validation Functions', () => {
  describe('validateCowNumber', () => {
    it('should accept valid cow numbers', () => {
      expect(validateCowNumber('CN001').isValid).toBe(true);
      expect(validateCowNumber('ABC123').isValid).toBe(true);
      expect(validateCowNumber('ABCDEFGHIJ1234567890').isValid).toBe(true);
    });

    it('should reject invalid cow numbers', () => {
      expect(validateCowNumber('cn001').isValid).toBe(false); // 小写
      expect(validateCowNumber('AB').isValid).toBe(false); // 太短
      expect(validateCowNumber('CN-001').isValid).toBe(false); // 包含特殊字符
      expect(validateCowNumber('').isValid).toBe(false); // 空字符串
      expect(validateCowNumber('   ').isValid).toBe(false); // 仅空格
    });

    it('should reject cow numbers longer than 50 characters', () => {
      const longNumber = 'A'.repeat(51);
      expect(validateCowNumber(longNumber).isValid).toBe(false);
    });
  });

  describe('validateTemperature', () => {
    it('should accept normal temperature range', () => {
      expect(validateTemperature(37.5).isValid).toBe(true);
      expect(validateTemperature(38.0).isValid).toBe(true);
      expect(validateTemperature(39.0).isValid).toBe(true);
    });

    it('should accept boundary values', () => {
      expect(validateTemperature(35.0).isValid).toBe(true);
      expect(validateTemperature(45.0).isValid).toBe(true);
    });

    it('should reject out-of-range temperature', () => {
      expect(validateTemperature(34.9).isValid).toBe(false);
      expect(validateTemperature(45.1).isValid).toBe(false);
      expect(validateTemperature(0).isValid).toBe(false);
      expect(validateTemperature(100).isValid).toBe(false);
    });

    it('should warn about abnormal temperature', () => {
      const highTemp = validateTemperature(39.5);
      expect(highTemp.isValid).toBe(true);
      expect(highTemp.error).toContain('偏高');

      const lowTemp = validateTemperature(37.4);
      expect(lowTemp.isValid).toBe(true);
      expect(lowTemp.error).toContain('偏低');
    });

    it('should reject non-numeric values', () => {
      expect(validateTemperature(NaN).isValid).toBe(false);
      expect(validateTemperature(Infinity).isValid).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid past dates', () => {
      expect(validateDate('2023-01-01').isValid).toBe(true);
      expect(validateDate('2024-06-15').isValid).toBe(true);
    });

    it('should accept today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(validateDate(today).isValid).toBe(true);
    });

    it('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];
      
      expect(validateDate(futureDate).isValid).toBe(false);
    });

    it('should reject invalid date formats', () => {
      expect(validateDate('invalid-date').isValid).toBe(false);
      expect(validateDate('2023/01/01').isValid).toBe(false);
      expect(validateDate('').isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@example.co.uk').isValid).toBe(true);
      expect(validateEmail('user+tag@example.com').isValid).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('test@').isValid).toBe(false);
      expect(validateEmail('test@example').isValid).toBe(false);
      expect(validateEmail('').isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid Chinese mobile numbers', () => {
      expect(validatePhone('13800138000').isValid).toBe(true);
      expect(validatePhone('15912345678').isValid).toBe(true);
      expect(validatePhone('18888888888').isValid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('12345678901').isValid).toBe(false); // 不以1[3-9]开头
      expect(validatePhone('138001380').isValid).toBe(false); // 少于11位
      expect(validatePhone('138001380000').isValid).toBe(false); // 多于11位
      expect(validatePhone('1380013800a').isValid).toBe(false); // 包含字母
    });

    it('should allow empty phone (optional field)', () => {
      expect(validatePhone('').isValid).toBe(true);
      expect(validatePhone('   ').isValid).toBe(true);
    });
  });

  describe('validateMilkAmount', () => {
    it('should accept valid milk amounts', () => {
      expect(validateMilkAmount(0).isValid).toBe(true);
      expect(validateMilkAmount(15.5).isValid).toBe(true);
      expect(validateMilkAmount(50).isValid).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(validateMilkAmount(-1).isValid).toBe(false);
      expect(validateMilkAmount(-10.5).isValid).toBe(false);
    });

    it('should warn about unusually high amounts', () => {
      const result = validateMilkAmount(101);
      expect(result.isValid).toBe(true);
      expect(result.error).toContain('超过100升');
    });

    it('should reject non-numeric values', () => {
      expect(validateMilkAmount(NaN).isValid).toBe(false);
    });
  });

  describe('validateFatRate', () => {
    it('should accept valid fat rates', () => {
      expect(validateFatRate(3.5).isValid).toBe(true);
      expect(validateFatRate(4.0).isValid).toBe(true);
      expect(validateFatRate(5.5).isValid).toBe(true);
    });

    it('should accept null (optional field)', () => {
      expect(validateFatRate(null).isValid).toBe(true);
      expect(validateFatRate(undefined as any).isValid).toBe(true);
    });

    it('should reject out-of-range fat rates', () => {
      expect(validateFatRate(-0.1).isValid).toBe(false);
      expect(validateFatRate(15.1).isValid).toBe(false);
    });

    it('should accept boundary values', () => {
      expect(validateFatRate(0).isValid).toBe(true);
      expect(validateFatRate(15).isValid).toBe(true);
    });
  });

  describe('validateProteinRate', () => {
    it('should accept valid protein rates', () => {
      expect(validateProteinRate(2.8).isValid).toBe(true);
      expect(validateProteinRate(3.2).isValid).toBe(true);
      expect(validateProteinRate(3.5).isValid).toBe(true);
    });

    it('should accept null (optional field)', () => {
      expect(validateProteinRate(null).isValid).toBe(true);
      expect(validateProteinRate(undefined as any).isValid).toBe(true);
    });

    it('should reject out-of-range protein rates', () => {
      expect(validateProteinRate(-0.1).isValid).toBe(false);
      expect(validateProteinRate(10.1).isValid).toBe(false);
    });

    it('should accept boundary values', () => {
      expect(validateProteinRate(0).isValid).toBe(true);
      expect(validateProteinRate(10).isValid).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password123').isValid).toBe(true);
      expect(validatePassword('SecurePass1').isValid).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('Pass1').isValid).toBe(false);
      expect(validatePassword('1234567').isValid).toBe(false);
    });

    it('should warn about weak passwords', () => {
      const weakPassword = validatePassword('password');
      expect(weakPassword.isValid).toBe(true);
      expect(weakPassword.error).toContain('建议密码包含');
    });

    it('should reject empty passwords', () => {
      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword('   ').isValid).toBe(false);
    });
  });

  describe('validateBirthAndEntryDates', () => {
    it('should accept valid date combinations', () => {
      expect(validateBirthAndEntryDates('2020-01-01', '2020-01-15').isValid).toBe(true);
      expect(validateBirthAndEntryDates('2020-01-01', '2020-01-01').isValid).toBe(true);
    });

    it('should reject birth date after entry date', () => {
      expect(validateBirthAndEntryDates('2020-01-15', '2020-01-01').isValid).toBe(false);
    });

    it('should reject future entry dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];
      
      expect(validateBirthAndEntryDates('2020-01-01', futureDate).isValid).toBe(false);
    });

    it('should reject invalid date formats', () => {
      expect(validateBirthAndEntryDates('invalid', '2020-01-01').isValid).toBe(false);
      expect(validateBirthAndEntryDates('2020-01-01', 'invalid').isValid).toBe(false);
    });
  });

  describe('validateAll', () => {
    it('should pass when all validators pass', () => {
      const result = validateAll([
        () => validateCowNumber('CN001'),
        () => validateTemperature(38.0),
        () => validateEmail('test@example.com'),
      ]);
      
      expect(result.isValid).toBe(true);
    });

    it('should fail when any validator fails', () => {
      const result = validateAll([
        () => validateCowNumber('CN001'),
        () => validateTemperature(50.0), // 超出范围
        () => validateEmail('test@example.com'),
      ]);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('体温');
    });

    it('should aggregate all errors', () => {
      const result = validateAll([
        () => validateCowNumber('invalid'),
        () => validateTemperature(50.0),
        () => validateEmail('invalid'),
      ]);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('奶牛编号');
      expect(result.error).toContain('体温');
      expect(result.error).toContain('邮箱');
    });
  });
});

