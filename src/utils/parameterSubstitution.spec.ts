import {
  validateParameter,
  validateParameters,
  extractPlaceholders,
  isParameterizedUrl,
  substituteParameters,
  extractQueryParameters,
} from './parameterSubstitution';

describe('Parameter Substitution Utility', () => {
  describe('validateParameter', () => {
    it('should validate normal parameters', () => {
      const result = validateParameter('key', 'value123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject parameters that are too long', () => {
      const longValue = 'a'.repeat(151);
      const result = validateParameter('key', longValue);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds 150 character limit');
    });

    it('should reject parameters with dangerous characters', () => {
      const result = validateParameter('key', '<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('contains invalid characters');
    });

    it('should reject script injection attempts', () => {
      const result = validateParameter('key', 'javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('potentially dangerous content');
    });
  });

  describe('extractPlaceholders', () => {
    it('should extract placeholders from template', () => {
      const template = 'merchant/{{publickey}}@{{domain}}';
      const placeholders = extractPlaceholders(template);
      expect(placeholders).toEqual(['publickey', 'domain']);
    });

    it('should handle templates with no placeholders', () => {
      const template = 'merchant/static/path';
      const placeholders = extractPlaceholders(template);
      expect(placeholders).toEqual([]);
    });

    it('should handle complex templates', () => {
      const template = 'https://example.com/{{userId}}/{{section}}?token={{authToken}}';
      const placeholders = extractPlaceholders(template);
      expect(placeholders).toEqual(['userId', 'section', 'authToken']);
    });
  });

  describe('isParameterizedUrl', () => {
    it('should detect parameterized URLs', () => {
      expect(isParameterizedUrl('merchant/{{publickey}}@{{domain}}')).toBe(true);
      expect(isParameterizedUrl('https://example.com?key={{value}}')).toBe(true);
    });

    it('should detect non-parameterized URLs', () => {
      expect(isParameterizedUrl('merchant/static/path')).toBe(false);
      expect(isParameterizedUrl('https://example.com/static')).toBe(false);
    });
  });

  describe('substituteParameters', () => {
    it('should substitute parameters correctly', () => {
      const template = 'merchant/{{publickey}}@{{domain}}';
      const params = { publickey: 'ABC123', domain: 'merchant1.com' };
      const result = substituteParameters(template, params);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('merchant/ABC123@merchant1.com');
    });

    it('should handle website URLs', () => {
      const template = 'https://example.com?key={{theKey}}&user={{userId}}';
      const params = { theKey: 'secret123', userId: '456' };
      const result = substituteParameters(template, params);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('https://example.com?key=secret123&user=456');
    });

    it('should fail when required parameters are missing', () => {
      const template = 'merchant/{{publickey}}@{{domain}}';
      const params = { publickey: 'ABC123' }; // missing domain
      const result = substituteParameters(template, params);
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Missing required parameters: domain');
    });

    it('should fail when parameters are invalid', () => {
      const template = 'merchant/{{publickey}}@{{domain}}';
      const params = { 
        publickey: '<script>alert("xss")</script>', 
        domain: 'merchant1.com' 
      };
      const result = substituteParameters(template, params);
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('contains invalid characters');
    });
  });

  describe('extractQueryParameters', () => {
    it('should extract query parameters from URL', () => {
      const queryString = 'publickey=ABC123&domain=merchant1.com';
      const params = extractQueryParameters(queryString);
      
      expect(params).toEqual({
        publickey: 'ABC123',
        domain: 'merchant1.com'
      });
    });

    it('should handle URL-encoded parameters', () => {
      const queryString = 'key=value%20with%20spaces&special=merchant%2Bspecial.com';
      const params = extractQueryParameters(queryString);
      
      expect(params).toEqual({
        key: 'value with spaces',
        special: 'merchant+special.com'
      });
    });

    it('should handle empty query string', () => {
      const params = extractQueryParameters('');
      expect(params).toEqual({});
    });

    it('should handle query string with leading ?', () => {
      const queryString = '?publickey=ABC123&domain=merchant1.com';
      const params = extractQueryParameters(queryString);
      
      expect(params).toEqual({
        publickey: 'ABC123',
        domain: 'merchant1.com'
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete parameterized link flow', () => {
      // 1. Detect parameterized URL
      const template = 'merchant/{{publickey}}@{{domain}}';
      expect(isParameterizedUrl(template)).toBe(true);

      // 2. Extract placeholders
      const placeholders = extractPlaceholders(template);
      expect(placeholders).toEqual(['publickey', 'domain']);

      // 3. Extract query parameters
      const queryString = 'publickey=ABC123&domain=merchant1.com';
      const params = extractQueryParameters(queryString);

      // 4. Substitute parameters
      const result = substituteParameters(template, params);
      expect(result.success).toBe(true);
      expect(result.result).toBe('merchant/ABC123@merchant1.com');
    });

    it('should handle website parameterized link flow', () => {
      const template = 'https://dashboard.com/{{tenantId}}/{{module}}?token={{authToken}}';
      const queryString = 'tenantId=acme&module=analytics&authToken=xyz789';
      const params = extractQueryParameters(queryString);
      const result = substituteParameters(template, params);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('https://dashboard.com/acme/analytics?token=xyz789');
    });
  });
});
