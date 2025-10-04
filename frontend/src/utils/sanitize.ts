/**
 * Input sanitization utilities for security
 */

// Sanitize HTML to prevent XSS attacks
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Escape HTML special characters
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

// Unescape HTML entities
export function unescapeHtml(text: string): string {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || div.innerText || '';
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string {
  // Remove any directory traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');

  // Remove special characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

// Sanitize URL
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

// Sanitize email
export function sanitizeEmail(email: string): string {
  // Remove any whitespace
  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(trimmed) ? trimmed : '';
}

// Sanitize phone number
export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters except + at the start
  return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}

// Sanitize user input (general text)
export function sanitizeInput(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  trim?: boolean;
} = {}): string {
  const {
    maxLength = 1000,
    allowHtml = false,
    trim = true,
  } = options;

  let sanitized = trim ? input.trim() : input;

  // Escape HTML if not allowed
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

// Remove SQL injection patterns (basic protection, use parameterized queries on backend)
export function removeSqlInjection(input: string): string {
  const sqlKeywords = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT)\b)/gi;
  return input.replace(sqlKeywords, '');
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? sanitizeInput(item) :
          typeof item === 'object' ? sanitizeObject(item) :
          item
        );
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// Validate and sanitize JSON
export function sanitizeJson(jsonString: string): any {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

// Remove script tags
export function removeScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Sanitize CSS to prevent CSS injection
export function sanitizeCss(css: string): string {
  // Remove potentially dangerous CSS
  return css
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/import\s+/gi, '')
    .replace(/@import/gi, '');
}

// Check if string contains XSS patterns
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /eval\(/i,
    /expression\(/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

// Rate limiting helper (client-side)
export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private maxRequests: number, private windowMs: number) {}

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

// Create rate limiter instance
export const defaultRateLimiter = new ClientRateLimiter(10, 60000); // 10 requests per minute
