import { Request, Response, NextFunction } from 'express';
import { FieldConfig } from '../types/config';

export function validateFields(fields: FieldConfig[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {};
    const body = req.body || {};

    for (const field of fields) {
      const value = body[field.name];

      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.name] = `${field.label || field.name} is required`;
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      // Type coercion and validation
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            errors[field.name] = `${field.label || field.name} must be a valid email`;
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors[field.name] = `${field.label || field.name} must be a number`;
          } else {
            if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
              errors[field.name] = `${field.label || field.name} must be at least ${field.validation.min}`;
            }
            if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
              errors[field.name] = `${field.label || field.name} must be at most ${field.validation.max}`;
            }
          }
          break;
        case 'select':
          if (field.options?.length && !field.options.find(o => o.value === String(value))) {
            errors[field.name] = `${field.label || field.name} has an invalid value`;
          }
          break;
        case 'text':
        case 'textarea':
          if (field.validation?.minLength && String(value).length < field.validation.minLength) {
            errors[field.name] = `${field.label || field.name} must be at least ${field.validation.minLength} characters`;
          }
          if (field.validation?.maxLength && String(value).length > field.validation.maxLength) {
            errors[field.name] = `${field.label || field.name} must be at most ${field.validation.maxLength} characters`;
          }
          if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(String(value))) {
            errors[field.name] = `${field.label || field.name} has an invalid format`;
          }
          break;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({ error: 'Validation failed', errors });
      return;
    }
    next();
  };
}
