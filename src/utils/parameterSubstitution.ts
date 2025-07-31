/**
 * Parameter Substitution Utility for Rowt Parameterized Links
 * 
 * This utility handles the substitution of URL parameters into template URLs
 * for dynamic deep link generation.
 * 
 * Example:
 * Template: "merchant/{{publickey}}@{{domain}}"
 * Parameters: { publickey: "ABC123", domain: "merchant1.com" }
 * Result: "merchant/ABC123@merchant1.com"
 */

export interface ParameterValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SubstitutionResult {
  success: boolean;
  result?: string;
  errors: string[];
}

/**
 * Validates individual parameter values
 */
export function validateParameter(key: string, value: string): ParameterValidationResult {
  const errors: string[] = [];

  // Check length limit
  if (value.length > 150) {
    errors.push(`Parameter '${key}' exceeds 150 character limit (${value.length} characters)`);
  }

  // Check for escape characters and potentially dangerous characters
  const dangerousChars = /[<>'"&\\\x00-\x1f\x7f-\x9f]/;
  if (dangerousChars.test(value)) {
    errors.push(`Parameter '${key}' contains invalid characters`);
  }

  // Check for script injection attempts
  const scriptPattern = /<script|javascript:|data:|vbscript:/i;
  if (scriptPattern.test(value)) {
    errors.push(`Parameter '${key}' contains potentially dangerous content`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates all parameters in a parameter object
 */
export function validateParameters(parameters: Record<string, string>): ParameterValidationResult {
  const allErrors: string[] = [];

  for (const [key, value] of Object.entries(parameters)) {
    const validation = validateParameter(key, value);
    allErrors.push(...validation.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Extracts parameter placeholders from a template URL
 * Example: "merchant/{{publickey}}@{{domain}}" -> ["publickey", "domain"]
 */
export function extractPlaceholders(template: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.push(match[1].trim());
  }

  return placeholders;
}

/**
 * Checks if a URL contains parameter placeholders
 */
export function isParameterizedUrl(url: string): boolean {
  return /\{\{[^}]+\}\}/.test(url);
}

/**
 * Substitutes parameters into a template URL
 */
export function substituteParameters(
  template: string, 
  parameters: Record<string, string>
): SubstitutionResult {
  const errors: string[] = [];

  // Validate parameters first
  const validation = validateParameters(parameters);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors
    };
  }

  // Extract required placeholders from template
  const requiredPlaceholders = extractPlaceholders(template);
  
  // Check if all required parameters are provided
  const missingParams = requiredPlaceholders.filter(placeholder => 
    !(placeholder in parameters) || parameters[placeholder] === undefined || parameters[placeholder] === ''
  );

  if (missingParams.length > 0) {
    errors.push(`Missing required parameters: ${missingParams.join(', ')}`);
    return {
      success: false,
      errors
    };
  }

  // Perform substitution
  let result = template;
  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  // Check if any placeholders remain unsubstituted
  const remainingPlaceholders = extractPlaceholders(result);
  if (remainingPlaceholders.length > 0) {
    errors.push(`Unsubstituted placeholders found: ${remainingPlaceholders.join(', ')}`);
    return {
      success: false,
      errors
    };
  }

  return {
    success: true,
    result,
    errors: []
  };
}

/**
 * Extracts query parameters from a URL query string
 */
export function extractQueryParameters(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (!queryString) {
    return params;
  }

  // Remove leading '?' if present
  const cleanQuery = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  
  // Split by '&' and process each parameter
  cleanQuery.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key && value !== undefined) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });

  return params;
}
