// Mirrors backend types/config.ts
// These are the shapes we receive from the API

export type FieldType =
  | 'text' | 'email' | 'password' | 'number' | 'boolean'
  | 'date' | 'datetime' | 'select' | 'multiselect'
  | 'textarea' | 'file' | 'image' | 'relation' | 'json';

export interface FieldConfig {
  name: string;
  label?: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  relation?: { collection: string; displayField: string };
  [key: string]: unknown;
}

export interface CollectionConfig {
  name: string;
  label?: string;
  fields: FieldConfig[];
  permissions?: {
    read?: 'public' | 'authenticated' | 'owner';
    write?: 'authenticated' | 'owner';
  };
}

export interface UIComponentConfig {
  id: string;
  type: 'form' | 'table' | 'dashboard' | 'detail' | 'chart' | 'kanban' | 'calendar' | 'custom';
  collection?: string;
  title?: string;
  fields?: string[];
  actions?: ActionConfig[];
  filters?: FilterConfig[];
  pagination?: { pageSize: number };
  layout?: 'grid' | 'list' | 'card';
  [key: string]: unknown;
}

export interface ActionConfig {
  id: string;
  label: string;
  type: 'create' | 'edit' | 'delete' | 'custom' | 'link';
  endpoint?: string;
  confirm?: boolean;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
  value?: unknown;
  label?: string;
}

export interface PageConfig {
  id: string;
  path: string;
  title?: string;
  icon?: string;
  components: UIComponentConfig[];
  auth?: boolean;
}

export interface AuthConfig {
  methods: Array<'email' | 'google' | 'github'>;
  fields?: FieldConfig[];
  redirectAfterLogin?: string;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    appName?: string;
  };
}

export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  translations?: Record<string, Record<string, string>>;
}

export interface AppConfig {
  id?: string;
  name: string;
  slug?: string;
  version?: string;
  description?: string;
  collections: CollectionConfig[];
  pages: PageConfig[];
  auth?: AuthConfig;
  api?: unknown[];
  i18n?: I18nConfig;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    darkMode?: boolean;
  };
  [key: string]: unknown;
}
