'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export function NotificationBell() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => {
      const res = await notificationsApi.unreadCount();
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.list();
      return res.data;
    },
    enabled: open,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = countData?.count || 0;

  const typeColor = (type: string) => ({
    info: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  }[type] || 'bg-gray-100 text-gray-700');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">{t('notif.title')}</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> {t('notif.markAll')}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded ml-2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!notifications?.length ? (
                <div className="py-8 text-center text-sm text-gray-400">{t('notif.empty')}</div>
              ) : (
                notifications.map((n: {
                  id: string;
                  title: string;
                  message?: string;
                  type: string;
                  is_read: boolean;
                  created_at: string;
                }) => (
                  <div
                    key={n.id}
                    className={clsx(
                      'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                      !n.is_read && 'bg-indigo-50/50'
                    )}
                    onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`badge mt-0.5 ${typeColor(n.type)}`}>{n.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                        {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
