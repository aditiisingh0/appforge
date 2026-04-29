'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { dynamicApi } from '@/lib/api';
import { CollectionConfig } from '@/types/config';
import { DynamicForm } from './DynamicForm';
import { LoadingPage, SkeletonTable, ErrorState, EmptyState } from '@/components/ui/LoadingState';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface DynamicTableProps {
  appId: string;
  collection: CollectionConfig;
  visibleFields?: string[];
  pageSize?: number;
}

export function DynamicTable({ appId, collection, visibleFields, pageSize = 20 }: DynamicTableProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const displayFields = visibleFields
    ? collection.fields.filter(f => visibleFields.includes(f.name))
    : collection.fields.slice(0, 6); // max 6 columns by default

  const queryKey = ['records', appId, collection.name, page, sortBy, sortDir];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, unknown> = { page, pageSize };
      if (sortBy) { params.sortBy = sortBy; params.sortDir = sortDir; }
      const res = await dynamicApi.list(appId, collection.name, params);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => dynamicApi.create(appId, collection.name, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
      setShowForm(false);
      toast.success(t('form.saved'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      dynamicApi.update(appId, collection.name, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
      setEditRecord(null);
      toast.success(t('form.saved'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dynamicApi.delete(appId, collection.name, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
      setDeleteConfirm(null);
      toast.success('Deleted');
    },
  });

  const handleSort = (fieldName: string) => {
    if (sortBy === fieldName) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(fieldName); setSortDir('asc'); }
  };

  const formatValue = (value: unknown, fieldType: string): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (fieldType === 'date' && typeof value === 'string') {
      try { return new Date(value).toLocaleDateString(); } catch { return String(value); }
    }
    if (fieldType === 'datetime' && typeof value === 'string') {
      try { return new Date(value).toLocaleString(); } catch { return String(value); }
    }
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...';
    const str = String(value);
    return str.length > 80 ? str.slice(0, 80) + '…' : str;
  };

  // Client-side search filter
  const records: Record<string, unknown>[] = (data?.data || []).filter((r: Record<string, unknown>) => {
    if (!search) return true;
    return Object.values(r).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    );
  });

  if (isLoading) return <SkeletonTable />;
  if (error) return <ErrorState error={t('error.generic')} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9 w-full sm:w-64"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setEditRecord(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          {t('table.add')}
        </button>
      </div>

      {/* Form modal */}
      {(showForm || editRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {editRecord ? 'Edit' : 'New'} {collection.label || collection.name}
              </h3>
              <button onClick={() => { setShowForm(false); setEditRecord(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <DynamicForm
                collection={collection}
                initialData={editRecord || {}}
                onSubmit={async (formData) => {
                  if (editRecord?.id) {
                    await updateMutation.mutateAsync({ id: String(editRecord.id), data: formData });
                  } else {
                    await createMutation.mutateAsync(formData);
                  }
                }}
                onCancel={() => { setShowForm(false); setEditRecord(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {displayFields.map(field => (
                  <th
                    key={field.name}
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort(field.name)}
                  >
                    <div className="flex items-center gap-1">
                      {field.label || field.name}
                      {sortBy === field.name ? (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : null}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={displayFields.length + 1}>
                    <EmptyState
                      message={t('table.noData')}
                      action={
                        <button onClick={() => setShowForm(true)} className="btn-primary text-xs">
                          <Plus className="w-3 h-3" /> Add first record
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={String(record.id)} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {displayFields.map(field => (
                      <td key={field.name} className="px-4 py-3 text-gray-700 max-w-xs">
                        <span className="truncate block">
                          {formatValue(record[field.name], field.type)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditRecord(record)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                          title={t('table.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === record.id ? (
                          <>
                            <button
                              onClick={() => deleteMutation.mutate(String(record.id))}
                              className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(String(record.id))}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                            title={t('table.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {data.pagination.total} records · page {page} of {data.pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
