'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dynamicApi } from '@/lib/api';
import { CollectionConfig } from '@/types/config';
import { LoadingPage, ErrorState } from '@/components/ui/LoadingState';
import { Plus, AlertTriangle } from 'lucide-react';
import { DynamicForm } from './DynamicForm';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface KanbanProps {
  appId: string;
  collection: CollectionConfig;
  statusField?: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
  todo:        { bg: 'bg-gray-50',   border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400' },
  in_progress: { bg: 'bg-blue-50',   border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  done:        { bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  high:        { bg: 'bg-red-50',    border: 'border-red-200',   badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  medium:      { bg: 'bg-yellow-50', border: 'border-yellow-200',badge: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500'},
  low:         { bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
};

const DEFAULT_COLOR = {
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  badge: 'bg-gray-100 text-gray-700',
  dot: 'bg-gray-400'
};

function getPriorityClass(priority: string): string {
  if (priority === 'high') return 'bg-red-100 text-red-700';
  if (priority === 'medium') return 'bg-yellow-100 text-yellow-700';
  if (priority === 'low') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export function KanbanBoard({ appId, collection, statusField }: KanbanProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const statusCol = statusField
    ? collection.fields.find(f => f.name === statusField)
    : collection.fields.find(f => f.type === 'select');

  const columns = statusCol?.options || [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const { data, isLoading, error } = useQuery({
    queryKey: ['kanban', appId, collection.name],
    queryFn: async () => {
      const res = await dynamicApi.list(appId, collection.name, { pageSize: 200 });
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      dynamicApi.patch(appId, collection.name, id, {
        [statusCol?.name || 'status']: status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban', appId, collection.name] });
      qc.invalidateQueries({ queryKey: ['records', appId, collection.name] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData: Record<string, unknown>) =>
      dynamicApi.create(appId, collection.name, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban', appId, collection.name] });
      setShowForm(null);
      toast.success('Card added!');
    },
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: string) => {
    e.preventDefault();
    if (!draggedId) return;
    updateMutation.mutate({ id: draggedId, status: targetStatus });
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const isOverdue = (record: Record<string, unknown>): boolean => {
    const dateField = collection.fields.find(f => f.type === 'date');
    if (!dateField) return false;
    const val = record[dateField.name];
    if (!val) return false;
    try {
      return new Date(String(val)) < new Date();
    } catch {
      return false;
    }
  };

  const titleField    = collection.fields.find(f => f.name === 'title' || f.name === 'name' || f.type === 'text');
  const descField     = collection.fields.find(f => f.type === 'textarea' || f.name === 'description');
  const dateField     = collection.fields.find(f => f.type === 'date');
  const priorityField = collection.fields.find(f => f.name === 'priority');

  const records: Record<string, any>[] = data?.data || [];

  const getColumnRecords = (status: string) =>
    records.filter(r => String(r[statusCol?.name || 'status']) === status);

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorState error="Failed to load kanban data" />;

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colRecords = getColumnRecords(col.value);
          const style = STATUS_COLORS[col.value] || DEFAULT_COLOR;

          return (
            <div
              key={col.value}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.value)}
            >
              <div className={clsx('flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0', style.border, style.bg)}>
                <div className="flex items-center gap-2">
                  <div className={clsx('w-2.5 h-2.5 rounded-full', style.dot)} />
                  <span className="font-semibold text-gray-800 text-sm">{col.label}</span>
                  <span className={clsx('px-1.5 py-0.5 rounded-full text-xs font-bold', style.badge)}>
                    {colRecords.length}
                  </span>
                </div>
                <button onClick={() => setShowForm(col.value)}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="min-h-48 p-2 space-y-2 border rounded-b-xl">
                {colRecords.map(record => {
                  const overdue = isOverdue(record);

                  const priority = priorityField
                    ? String(record?.[priorityField.name] ?? '')
                    : '';

                  return (
                    <div
                      key={String(record.id)}
                      draggable
                      onDragStart={e => handleDragStart(e, String(record.id))}
                      className="bg-white rounded-xl p-3 border"
                    >
                      {overdue && (
                        <div className="text-red-600 text-xs mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </div>
                      )}

                      {titleField && (
                        <p className="text-sm font-medium">
                          {String(record[titleField.name] || 'Untitled')}
                        </p>
                      )}

                      {descField && record[descField.name] && (
                        <p className="text-xs text-gray-500">
                          {String(record[descField.name])}
                        </p>
                      )}

                      <div className="flex justify-between mt-2">
                        {priorityField && priority ? (
                          <span
                            className={clsx(
                              'text-xs px-2 py-0.5 rounded-full',
                              getPriorityClass(priority)
                            )}
                          >
                            {priority}
                          </span>
                        ) : null}

                        {dateField && record[dateField.name] && (
                          <span className="text-xs text-gray-400">
                            {new Date(String(record[dateField.name])).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <DynamicForm
          collection={collection}
          initialData={{ [statusCol?.name || 'status']: showForm }}
          onSubmit={async formData => {
            await createMutation.mutateAsync(formData);
          }}
          onCancel={() => setShowForm(null)}
        />
      )}
    </div>
  );
}