'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, Code2, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { appsApi } from '@/lib/api';
import toast from 'react-hot-toast';

// Starter templates
const TEMPLATES = [
  {
    name: 'CRM',
    description: 'Customer management with contacts and deals',
    config: {
      name: 'My CRM',
      description: 'Customer relationship management app',
      collections: [
        {
          name: 'contacts',
          label: 'Contacts',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'text' },
            { name: 'company', label: 'Company', type: 'text' },
            { name: 'status', label: 'Status', type: 'select', options: [
              { value: 'lead', label: 'Lead' },
              { value: 'prospect', label: 'Prospect' },
              { value: 'customer', label: 'Customer' },
            ]},
            { name: 'notes', label: 'Notes', type: 'textarea' },
          ],
        },
        {
          name: 'deals',
          label: 'Deals',
          fields: [
            { name: 'title', label: 'Deal Title', type: 'text', required: true },
            { name: 'value', label: 'Value ($)', type: 'number' },
            { name: 'stage', label: 'Stage', type: 'select', options: [
              { value: 'discovery', label: 'Discovery' },
              { value: 'proposal', label: 'Proposal' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'closed_won', label: 'Closed Won' },
              { value: 'closed_lost', label: 'Closed Lost' },
            ]},
            { name: 'close_date', label: 'Close Date', type: 'date' },
          ],
        },
      ],
      pages: [
        { id: 'p1', path: '/', title: 'Dashboard', icon: 'home', auth: true, components: [
          { id: 'c1', type: 'dashboard', title: 'Overview' },
        ]},
        { id: 'p2', path: '/contacts', title: 'Contacts', icon: 'users', auth: true, components: [
          { id: 'c2', type: 'table', collection: 'contacts', title: 'All Contacts' },
        ]},
        { id: 'p3', path: '/deals', title: 'Deals', icon: 'briefcase', auth: true, components: [
          { id: 'c3', type: 'table', collection: 'deals', title: 'All Deals' },
        ]},
      ],
    },
  },
  {
    name: 'Task Tracker',
    description: 'Project tasks with status and assignments',
    config: {
      name: 'Task Tracker',
      description: 'Manage tasks and projects',
      collections: [
        {
          name: 'tasks',
          label: 'Tasks',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'status', label: 'Status', type: 'select', required: true, options: [
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]},
            { name: 'priority', label: 'Priority', type: 'select', options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]},
            { name: 'due_date', label: 'Due Date', type: 'date' },
          ],
        },
      ],
      pages: [
        { id: 'p1', path: '/', title: 'Tasks', icon: 'check-square', auth: true, components: [
          { id: 'c1', type: 'table', collection: 'tasks', title: 'All Tasks' },
        ]},
      ],
    },
  },
  {
    name: 'Inventory',
    description: 'Product inventory management',
    config: {
      name: 'Inventory Manager',
      description: 'Track products and stock levels',
      collections: [
        {
          name: 'products',
          label: 'Products',
          fields: [
            { name: 'name', label: 'Product Name', type: 'text', required: true },
            { name: 'sku', label: 'SKU', type: 'text', unique: true },
            { name: 'category', label: 'Category', type: 'select', options: [
              { value: 'electronics', label: 'Electronics' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'food', label: 'Food' },
              { value: 'other', label: 'Other' },
            ]},
            { name: 'price', label: 'Price ($)', type: 'number', validation: { min: 0 } },
            { name: 'quantity', label: 'Quantity', type: 'number', validation: { min: 0 } },
            { name: 'low_stock_alert', label: 'Low Stock Threshold', type: 'number' },
          ],
        },
      ],
      pages: [
        { id: 'p1', path: '/', title: 'Dashboard', icon: 'home', auth: true, components: [
          { id: 'c1', type: 'dashboard', title: 'Inventory Overview' },
        ]},
        { id: 'p2', path: '/products', title: 'Products', icon: 'package', auth: true, components: [
          { id: 'c2', type: 'table', collection: 'products', title: 'All Products' },
        ]},
      ],
    },
  },
];

export default function NewAppPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [configText, setConfigText] = useState('');
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const createMutation = useMutation({
    mutationFn: (config: object) => appsApi.create(config),
    onSuccess: (res) => {
      toast.success(t('apps.created'));
      router.push(`/apps/${res.data.id}`);
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: string } } };
      toast.error(axErr.response?.data?.error || t('error.generic'));
    },
  });

  const handleTemplate = (template: typeof TEMPLATES[0]) => {
    setConfigText(JSON.stringify(template.config, null, 2));
    setError('');
    setShowRaw(true);
  };

  const handleCreate = () => {
    if (!configText.trim()) {
      setError('Please provide a configuration or select a template');
      return;
    }
    try {
      const parsed = JSON.parse(configText);
      setError('');
      createMutation.mutate(parsed);
    } catch {
      setError('Invalid JSON — please fix the syntax errors');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Create New App</h1>
        <p className="text-sm text-gray-500 mt-1">
          Start from a template or paste your own JSON configuration
        </p>
      </div>

      {/* Templates */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" /> Start from a template
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.name}
              onClick={() => handleTemplate(tpl)}
              className="card p-4 text-left hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-700">{tpl.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 bg-gray-50 px-2">or paste your own config</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* JSON Editor */}
      <div className="card overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
          onClick={() => setShowRaw(s => !s)}
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">JSON Configuration</span>
          </div>
          {showRaw ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>

        {showRaw && (
          <div className="p-4">
            <textarea
              className="w-full h-80 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={configText}
              onChange={e => { setConfigText(e.target.value); setError(''); }}
              placeholder={`{
  "name": "My App",
  "collections": [...],
  "pages": [...]
}`}
              spellCheck={false}
            />
            {error && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending || !configText.trim()}
          className="btn-primary"
        >
          {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create App
        </button>
        <button onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
