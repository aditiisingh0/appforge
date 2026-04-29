'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Search, Download, Filter, X, MessageSquare, Clock, AlertTriangle
} from 'lucide-react';
import { dynamicApi } from '@/lib/api';
import { CollectionConfig } from '@/types/config';
import { DynamicForm } from './DynamicForm';
import { SkeletonTable, ErrorState, EmptyState } from '@/components/ui/LoadingState';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface DynamicTableProps {
  appId: string;
  collection: CollectionConfig;
  visibleFields?: string[];
  pageSize?: number;
}

interface ActivityEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  recordTitle: string;
  timestamp: Date;
}

interface Comment {
  id: string;
  recordId: string;
  text: string;
  author: string;
  timestamp: Date;
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
  const [activeFilter, setActiveFilter] = useState<{ field: string; value: string } | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentRecord, setCommentRecord] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const displayFields = visibleFields
    ? collection.fields.filter(f => visibleFields.includes(f.name))
    : collection.fields.slice(0, 6);

  const selectFields = collection.fields.filter(f => f.type === 'select');
  const dateFields = collection.fields.filter(f => f.type === 'date' || f.type === 'datetime');

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

  const addActivity = (action: ActivityEntry['action'], recordTitle: string) => {
    setActivityLog(prev => [{
      id: Math.random().toString(36).slice(2),
      action, recordTitle, timestamp: new Date(),
    }, ...prev].slice(0, 50));
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => dynamicApi.create(appId, collection.name, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
      setShowForm(false);
      toast.success(t('form.saved'));
      addActivity('created', String(vars[collection.fields[0]?.name] || 'Record'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      dynamicApi.update(appId, collection.name, id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
      setEditRecord(null);
      toast.success(t('form.saved'));
      addActivity('updated', String(vars.data[collection.fields[0]?.name] || 'Record'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dynamicApi.delete(appId, collection.name, id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
      setDeleteConfirm(null);
      toast.success('Deleted');
      addActivity('deleted', id.slice(0, 8));
    },
  });

  const handleSort = (fieldName: string) => {
    if (sortBy === fieldName) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(fieldName); setSortDir('asc'); }
  };

  const isOverdue = (record: Record<string, unknown>): boolean => {
    for (const field of dateFields) {
      const val = record[field.name];
      if (val) {
        try { return new Date(String(val)) < new Date(); }
        catch { return false; }
      }
    }
    return false;
  };

  const formatValue = (value: unknown, fieldType: string): React.ReactNode => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-300">—</span>;
    if (typeof value === 'boolean') return value
      ? <span className="badge badge-green">Yes</span>
      : <span className="badge badge-gray">No</span>;

    if (fieldType === 'date' && typeof value === 'string') {
      try {
        const date = new Date(value);
        const isPast = date < new Date();
        return (
          <span className={clsx('flex items-center gap-1', isPast && 'text-red-600 font-medium')}>
            {isPast && <AlertTriangle className="w-3 h-3" />}
            {date.toLocaleDateString()}
          </span>
        );
      } catch { return String(value); }
    }

    if (fieldType === 'select') {
      const colorMap: Record<string, string> = {
        todo: 'badge-gray', in_progress: 'badge-blue', done: 'badge-green',
        high: 'badge-red', medium: 'badge-yellow', low: 'badge-green',
        lead: 'badge-blue', customer: 'badge-green', prospect: 'badge-yellow',
        closed_won: 'badge-green', closed_lost: 'badge-red',
      };
      const str = String(value);
      return <span className={`badge ${colorMap[str] || 'badge-gray'}`}>{str.replace(/_/g, ' ')}</span>;
    }

    if (typeof value === 'object') return <span className="font-mono text-xs text-gray-400">{JSON.stringify(value).slice(0, 40)}…</span>;
    const str = String(value);
    return str.length > 60 ? str.slice(0, 60) + '…' : str;
  };

  // Export CSV
  const exportCSV = () => {
    const allRecords = data?.data || [];
    if (!allRecords.length) { toast.error('No data to export'); return; }
    const headers = displayFields.map(f => f.label || f.name);
    const rows = allRecords.map((r: Record<string, unknown>) =>
      displayFields.map(f => {
        const v = r[f.name];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') ? `"${s}"` : s;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  // Filter + search
  const records: Record<string, unknown>[] = (data?.data || []).filter((r: Record<string, unknown>) => {
    if (search && !Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
    if (activeFilter && String(r[activeFilter.field]) !== activeFilter.value) return false;
    return true;
  });

  const addComment = (recordId: string) => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      recordId, text: newComment.trim(), author: 'You', timestamp: new Date(),
    }]);
    setNewComment('');
    toast.success('Comment added!');
  };

  const recordComments = (recordId: string) => comments.filter(c => c.recordId === recordId);

  if (isLoading) return <SkeletonTable />;
  if (error) return <ErrorState error={t('error.generic')} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="input pl-9 w-full" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {selectFields.length > 0 && (
            <button onClick={() => setShowFilterPanel(s => !s)} className={clsx('btn-secondary', activeFilter && 'border-indigo-400 text-indigo-600 bg-indigo-50')}>
              <Filter className="w-4 h-4" />
              {activeFilter ? `${activeFilter.value}` : 'Filter'}
              {activeFilter && <X className="w-3 h-3 ml-1" onClick={e => { e.stopPropagation(); setActiveFilter(null); }} />}
            </button>
          )}

          <button onClick={() => setShowActivityLog(s => !s)} className="btn-secondary relative" title="Activity Log">
            <Clock className="w-4 h-4" />
            {activityLog.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">
                {activityLog.length > 9 ? '9+' : activityLog.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => { setEditRecord(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t('table.add')}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && selectFields.length > 0 && (
        <div className="card p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-indigo-700">Filter by:</span>
            {selectFields.map(field => (
              <div key={field.name} className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">{field.label || field.name}:</span>
                {(field.options || []).map(opt => (
                  <button key={opt.value}
                    onClick={() => setActiveFilter(
                      activeFilter?.field === field.name && activeFilter.value === opt.value
                        ? null : { field: field.name, value: opt.value }
                    )}
                    className={clsx('px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      activeFilter?.field === field.name && activeFilter.value === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            ))}
            <button onClick={() => { setActiveFilter(null); setShowFilterPanel(false); }} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">Clear</button>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {showActivityLog && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Clock className="w-4 h-4" /> Activity Log</h3>
            <button onClick={() => setShowActivityLog(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {activityLog.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No activity yet. Add, edit or delete records.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activityLog.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 text-xs">
                  <span className={clsx('badge', { 'badge-green': entry.action === 'created', 'badge-blue': entry.action === 'updated', 'badge-red': entry.action === 'deleted' })}>
                    {entry.action}
                  </span>
                  <span className="text-gray-600 flex-1 truncate">{entry.recordTitle}</span>
                  <span className="text-gray-400">{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {(showForm || editRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold">{editRecord ? 'Edit' : 'New'} {collection.label || collection.name}</h3>
              <button onClick={() => { setShowForm(false); setEditRecord(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6">
              <DynamicForm
                collection={collection}
                initialData={editRecord || {}}
                onSubmit={async (formData) => {
                  if (editRecord?.id) await updateMutation.mutateAsync({ id: String(editRecord.id), data: formData });
                  else await createMutation.mutateAsync(formData);
                }}
                onCancel={() => { setShowForm(false); setEditRecord(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments</h3>
              <button onClick={() => { setCommentRecord(null); setNewComment(''); }} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
              {recordComments(commentRecord).length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
                : recordComments(commentRecord).map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-indigo-600">{c.author}</span>
                      <span className="text-xs text-gray-400">{c.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.text}</p>
                  </div>
                ))
              }
            </div>
            <div className="px-5 py-4 border-t flex gap-2">
              <input type="text" className="input flex-1" placeholder="Add a comment..." value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment(commentRecord)} />
              <button onClick={() => addComment(commentRecord)} className="btn-primary">Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {records.length} result{records.length !== 1 ? 's' : ''}
            {activeFilter && <span className="ml-1 text-indigo-600 font-medium">· filtered</span>}
          </span>
          {dateFields.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="w-3 h-3" /> Red = overdue
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {displayFields.map(field => (
                  <th key={field.name}
                    className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                    onClick={() => handleSort(field.name)}>
                    <div className="flex items-center gap-1">
                      {field.label || field.name}
                      {sortBy === field.name
                        ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-500" /> : <ChevronDown className="w-3 h-3 text-indigo-500" />
                        : <ChevronUp className="w-3 h-3 text-gray-200" />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 w-28 text-right text-xs text-gray-400 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={displayFields.length + 1}>
                  <EmptyState
                    message={activeFilter ? `No records matching filter` : t('table.noData')}
                    action={activeFilter
                      ? <button onClick={() => setActiveFilter(null)} className="btn-secondary text-xs">Clear filter</button>
                      : <button onClick={() => setShowForm(true)} className="btn-primary text-xs"><Plus className="w-3 h-3" /> Add first record</button>
                    }
                  />
                </td></tr>
              ) : records.map((record) => {
                const overdue = isOverdue(record);
                const commentsCount = recordComments(String(record.id)).length;
                return (
                  <tr key={String(record.id)} className={clsx('border-b border-gray-100 hover:bg-gray-50 transition-colors', overdue && 'bg-red-50/40 hover:bg-red-50')}>
                    {displayFields.map(field => (
                      <td key={field.name} className="px-4 py-3 text-gray-700 max-w-xs">
                        <span className="truncate block">{formatValue(record[field.name], field.type)}</span>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setCommentRecord(String(record.id))}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600 relative" title="Comments">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {commentsCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 text-white text-[9px] rounded-full flex items-center justify-center">{commentsCount}</span>
                          )}
                        </button>
                        <button onClick={() => setEditRecord(record)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === record.id ? (
                          <>
                            <button onClick={() => deleteMutation.mutate(String(record.id))} className="px-2 py-1 rounded text-xs bg-red-600 text-white">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">No</button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(String(record.id))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{data.pagination.total} records · page {page} of {data.pagination.totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
