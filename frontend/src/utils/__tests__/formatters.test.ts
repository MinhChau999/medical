import { describe, it, expect } from 'vitest';

// Utility functions for testing
export const formatCurrency = (amount: number, currency = 'VND'): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

describe('Formatter Utilities', () => {
  describe('formatCurrency', () => {
    it('should format VND currency correctly', () => {
      const result = formatCurrency(100000);
      expect(result).toContain('100.000');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000000);
      expect(result).toContain('1.000.000.000');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      const result = formatNumber(1234567);
      expect(result).toContain('1.234.567');
    });

    it('should handle small numbers', () => {
      const result = formatNumber(42);
      expect(result).toBe('42');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBeTruthy();
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime with time', () => {
      const result = formatDateTime('2024-01-15T10:30:00');
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });
  });
});
