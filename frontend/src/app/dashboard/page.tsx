'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus, Layers, ExternalLink, Trash2, Edit2, Globe, Lock, Clock } from 'lucide-react';
import { appsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LoadingPage, ErrorState, EmptyState } from '@/components/ui/LoadingState';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: apps, isLoading, error } = useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const res = await appsApi.list();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['apps'] });
      setDeleteId(null);
      toast.success(t('apps.deleted'));
    },
    onError: () => toast.error(t('error.generic')),
  });

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorState error={t('error.generic')} onRetry={() => qc.invalidateQueries({ queryKey: ['apps'] })} />;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('apps.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>
        <Link href="/apps/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('apps.create')}
        </Link>
      </div>

      {/* Apps grid */}
      {!apps?.length ? (
        <EmptyState
          message={t('apps.empty')}
          action={
            <Link href="/apps/new" className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Create your first app
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app: {
            id: string;
            name: string;
            slug: string;
            description?: string;
            is_published: boolean;
            updated_at: string;
            created_at: string;
          }) => (
            <div key={app.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/apps/${app.id}/edit`}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                    title="Edit config"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  {deleteId === app.id ? (
                    <>
                      <button
                        onClick={() => deleteMutation.mutate(app.id)}
                        className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteId(app.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
              {app.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.description}</p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <span className={`badge ${app.is_published ? 'badge-green' : 'badge-gray'}`}>
                  {app.is_published ? <><Globe className="w-2.5 h-2.5" /> Published</> : <><Lock className="w-2.5 h-2.5" /> Draft</>}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <Link href={`/apps/${app.id}`} className="btn-primary text-xs flex-1 justify-center">
                  Open App
                </Link>
                <Link href={`/apps/${app.id}/edit`} className="btn-secondary text-xs px-3">
                  <Edit2 className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
