import { AppConfig } from '@/types/config';

export function sanitizeConfigPreview(raw: Partial<AppConfig>) {
  return {
    name: raw.name || 'Untitled App',
    collections: raw.collections?.length || 0,
    pages: raw.pages?.length || 0,
    fields: raw.collections?.reduce((acc, c) => acc + (c.fields?.length || 0), 0) || 0,
  };
}

export function validateConfig(raw: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') return { valid: false, errors: ['Config must be a JSON object'] };

  const config = raw as Record<string, unknown>;

  if (!config.name || typeof config.name !== 'string') {
    errors.push('Missing required field: name');
  }
  if (!Array.isArray(config.collections)) {
    errors.push('collections must be an array');
  }
  if (!Array.isArray(config.pages)) {
    errors.push('pages must be an array');
  }

  // Check collections
  if (Array.isArray(config.collections)) {
    config.collections.forEach((col: unknown, i: number) => {
      if (!col || typeof col !== 'object') {
        errors.push(`collections[${i}] must be an object`);
        return;
      }
      const c = col as Record<string, unknown>;
      if (!c.name) errors.push(`collections[${i}] missing name`);
      if (!Array.isArray(c.fields)) errors.push(`collections[${i}] fields must be an array`);
    });
  }

  return { valid: errors.length === 0, errors };
}

export function formatConfigError(error: unknown): string {
  if (!error) return '';
  if (error instanceof SyntaxError) return `JSON syntax error: ${error.message}`;
  if (typeof error === 'string') return error;
  return String(error);
}
