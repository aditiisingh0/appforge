'use client';

import { useQuery } from '@tanstack/react-query';
import { dynamicApi } from '@/lib/api';
import { CollectionConfig, UIComponentConfig } from '@/types/config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { LoadingPage, ErrorState } from '@/components/ui/LoadingState';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardProps {
  appId: string;
  component: UIComponentConfig;
  collections: CollectionConfig[];
}

export function DynamicDashboard({ appId, component, collections }: DashboardProps) {
  // Aggregate stats for each collection
  const queries = collections.map(col => ({
    key: col.name,
    query: useQuery({
      queryKey: ['dashboard', appId, col.name],
      queryFn: async () => {
        const res = await dynamicApi.list(appId, col.name, { pageSize: 100 });
        return res.data;
      },
    }),
  }));

  const isLoading = queries.some(q => q.query.isLoading);
  const hasError = queries.some(q => q.query.error);

  if (isLoading) return <LoadingPage />;
  if (hasError) return <ErrorState error="Failed to load dashboard data" />;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {queries.map(({ key, query }) => {
          const col = collections.find(c => c.name === key)!;
          const count = query.data?.pagination?.total || 0;
          return (
            <div key={key} className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {col.label || col.name}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
              <p className="text-xs text-gray-400 mt-1">total records</p>
            </div>
          );
        })}
      </div>

      {/* Chart - show distribution of records by collection */}
      {queries.length > 1 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Records by Collection</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={queries.map(({ key, query }) => ({
              name: collections.find(c => c.name === key)?.label || key,
              count: query.data?.pagination?.total || 0,
            }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent records from first collection */}
      {queries[0]?.query.data?.data?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Recent {collections[0]?.label || collections[0]?.name}
          </h3>
          <div className="space-y-2">
            {queries[0].query.data.data.slice(0, 5).map((record: Record<string, unknown>) => {
              const col = collections[0];
              const displayField = col.fields[0];
              return (
                <div key={String(record.id)} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700 truncate">
                    {displayField ? String(record[displayField.name] ?? '—') : String(record.id).slice(0, 8)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {record._meta ? new Date(String((record._meta as Record<string, unknown>).createdAt)).toLocaleDateString() : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
