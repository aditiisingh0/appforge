// Core AppForge configuration types
// These define what a valid app config looks like

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'file'
  | 'image'
  | 'relation'
  | 'json';

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
  relation?: {
    collection: string;
    displayField: string;
  };
  // Graceful degradation: unknown fields are stored but rendered as text
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
  fields?: string[]; // field names to show; defaults to all
  actions?: ActionConfig[];
  filters?: FilterConfig[];
  pagination?: { pageSize: number };
  layout?: 'grid' | 'list' | 'card';
  // Unknown type fields are passed through
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
  auth?: boolean; // requires login
  roles?: string[];
}

export interface AuthConfig {
  methods: Array<'email' | 'google' | 'github'>;
  fields?: FieldConfig[]; // extra fields on signup
  redirectAfterLogin?: string;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    appName?: string;
  };
}

export interface APIEndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  collection?: string;
  action?: string;
  auth?: boolean;
  body?: FieldConfig[];
  query?: FieldConfig[];
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
  api?: APIEndpointConfig[];
  i18n?: I18nConfig;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    darkMode?: boolean;
  };
  // Extra unknown keys are preserved but don't break the system
  [key: string]: unknown;
}

// Sanitize + provide defaults for incomplete configs
export function sanitizeConfig(raw: Partial<AppConfig>): AppConfig {
  return {
    name: raw.name || 'Untitled App',
    slug: raw.slug || slugify(raw.name || 'untitled'),
    version: raw.version || '1.0.0',
    description: raw.description || '',
    collections: (raw.collections || []).map(sanitizeCollection),
    pages: (raw.pages || []).map(sanitizePage),
    auth: raw.auth || { methods: ['email'] },
    api: raw.api || [],
    i18n: raw.i18n || { defaultLocale: 'en', supportedLocales: ['en'] },
    theme: raw.theme || {},
    ...Object.fromEntries(
      Object.entries(raw).filter(([k]) =>
        !['name', 'slug', 'version', 'description', 'collections', 'pages', 'auth', 'api', 'i18n', 'theme'].includes(k)
      )
    ),
  };
}

function sanitizeCollection(c: Partial<CollectionConfig>): CollectionConfig {
  return {
    name: c.name || 'unnamed_collection',
    label: c.label || c.name || 'Collection',
    fields: (c.fields || []).map(sanitizeField),
    permissions: c.permissions || { read: 'authenticated', write: 'owner' },
  };
}

function sanitizeField(f: Partial<FieldConfig>): FieldConfig {
  const validTypes: FieldType[] = [
    'text', 'email', 'password', 'number', 'boolean', 'date',
    'datetime', 'select', 'multiselect', 'textarea', 'file', 'image', 'relation', 'json'
  ];
  return {
    name: f.name || `field_${Math.random().toString(36).slice(2, 7)}`,
    label: f.label || f.name || 'Field',
    type: validTypes.includes(f.type as FieldType) ? (f.type as FieldType) : 'text',
    required: f.required ?? false,
    unique: f.unique ?? false,
    default: f.default,
    options: f.options || [],
    validation: f.validation || {},
    ...(f.relation ? { relation: f.relation } : {}),
  };
}

function sanitizePage(p: Partial<PageConfig>): PageConfig {
  return {
    id: p.id || `page_${Math.random().toString(36).slice(2, 7)}`,
    path: p.path || '/',
    title: p.title || 'Page',
    icon: p.icon || 'layout',
    components: (p.components || []).map(sanitizeComponent),
    auth: p.auth ?? true,
  };
}

function sanitizeComponent(c: Partial<UIComponentConfig>): UIComponentConfig {
  const validTypes = ['form', 'table', 'dashboard', 'detail', 'chart', 'kanban', 'calendar', 'custom'];
  return {
    id: c.id || `comp_${Math.random().toString(36).slice(2, 7)}`,
    type: validTypes.includes(c.type as string) ? (c.type as UIComponentConfig['type']) : 'table',
    collection: c.collection,
    title: c.title,
    fields: c.fields,
    actions: c.actions || [],
    filters: c.filters || [],
    pagination: c.pagination || { pageSize: 20 },
    layout: c.layout || 'list',
  };
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
