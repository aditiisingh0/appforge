'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { FieldConfig, CollectionConfig } from '@/types/config';
import clsx from 'clsx';

interface DynamicFormProps {
  collection: CollectionConfig;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  visibleFields?: string[]; // subset of fields to show
}

export function DynamicForm({ collection, initialData = {}, onSubmit, onCancel, visibleFields }: DynamicFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const field of collection.fields) {
      init[field.name] = initialData[field.name] ?? field.default ?? '';
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fields = visibleFields
    ? collection.fields.filter(f => visibleFields.includes(f.name))
    : collection.fields;

  const setValue = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const val = values[field.name];
      if (field.required && (val === undefined || val === null || val === '')) {
        newErrors[field.name] = `${field.label || field.name} ${t('form.required')}`;
      }
      if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
        newErrors[field.name] = 'Invalid email address';
      }
      if (field.validation?.minLength && String(val).length < field.validation.minLength) {
        newErrors[field.name] = `Minimum ${field.validation.minLength} characters`;
      }
      if (field.validation?.maxLength && String(val).length > field.validation.maxLength) {
        newErrors[field.name] = `Maximum ${field.validation.maxLength} characters`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string>; error?: string } } };
      if (axiosErr.response?.data?.errors) {
        setErrors(axiosErr.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <FieldRenderer
          key={field.name}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          onChange={val => setValue(field.name, val)}
        />
      ))}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('form.save')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t('form.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

interface FieldRendererProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (val: unknown) => void;
}

function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
  const label = field.label || field.name;

  const baseClass = clsx('input', error && 'border-red-400 focus:ring-red-400');

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className={clsx(baseClass, 'min-h-[100px] resize-y')}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );

      case 'select':
        return (
          <select
            className={baseClass}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">Select {label}...</option>
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-1">
            {(field.options || []).map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600"
                  checked={Array.isArray(value) ? value.includes(opt.value) : false}
                  onChange={e => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) onChange([...arr, opt.value]);
                    else onChange(arr.filter(v => v !== opt.value));
                  }}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-indigo-600"
              checked={!!value}
              onChange={e => onChange(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Yes / No</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            className={baseClass}
            value={String(value ?? '')}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className={baseClass}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            className={baseClass}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            className={baseClass}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={`Enter email...`}
          />
        );

      case 'password':
        return (
          <input
            type="password"
            className={baseClass}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder="••••••••"
          />
        );

      case 'json':
        return (
          <textarea
            className={clsx(baseClass, 'font-mono text-xs min-h-[80px]')}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={e => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value); // store raw string if invalid JSON
              }
            }}
            placeholder="{}"
          />
        );

      // Fallback for unknown types — always render as text
      default:
        return (
          <input
            type="text"
            className={baseClass}
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <div>
      <label className="label">
        {label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.type !== field.name && (
          <span className="text-xs text-gray-400 font-normal ml-1">({field.type})</span>
        )}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
