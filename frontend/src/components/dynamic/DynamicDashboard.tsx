'use client';

import { useQuery } from '@tanstack/react-query';
import { dynamicApi } from '@/lib/api';
import { CollectionConfig, UIComponentConfig } from '@/types/config';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { LoadingPage, ErrorState } from '@/components/ui/LoadingState';
import { TrendingUp, Database, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardProps {
  appId: string;
  component: UIComponentConfig;
  collections: CollectionConfig[];
}

// Inner component for a single collection — safe to call hooks here
function CollectionStats({
  appId,
  col,
}: {
  appId: string;
  col: CollectionConfig;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', appId, col.name],
    queryFn: async () => {
      const res = await dynamicApi.list(appId, col.name, { pageSize: 200 });
      return res.data;
    },
  });

  const records: Record<string, unknown>[] = data?.data || [];
  const total: number = data?.pagination?.total ?? records.length;

  const selectField = col.fields.find(f => f.type === 'select');
  const dateField   = col.fields.find(f => f.type === 'date');

  const groupCounts: Record<string, number> = {};
  if (selectField) {
    for (const r of records) {
      const val = String(r[selectField.name] || 'unknown');
      groupCounts[val] = (groupCounts[val] || 0) + 1;
    }
  }

  let overdueCount = 0;
  if (dateField) {
    overdueCount = records.filter(r => {
      try { return r[dateField.name] && new Date(String(r[dateField.name])) < new Date(); }
      catch { return false; }
    }).length;
  }

  if (isLoading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  return { total, groupCounts, selectField, overdueCount, records, col } as unknown as JSX.Element;
}

export function DynamicDashboard({ appId, collections }: DashboardProps) {
  // One query per collection — hooks called unconditionally at top level
  const q0 = useQuery({
    queryKey: ['dashboard', appId, collections[0]?.name],
    enabled: !!collections[0],
    queryFn: async () => {
      const res = await dynamicApi.list(appId, collections[0].name, { pageSize: 200 });
      return res.data;
    },
  });
  const q1 = useQuery({
    queryKey: ['dashboard', appId, collections[1]?.name],
    enabled: !!collections[1],
    queryFn: async () => {
      if (!collections[1]) return null;
      const res = await dynamicApi.list(appId, collections[1].name, { pageSize: 200 });
      return res.data;
    },
  });
  const q2 = useQuery({
    queryKey: ['dashboard', appId, collections[2]?.name],
    enabled: !!collections[2],
    queryFn: async () => {
      if (!collections[2]) return null;
      const res = await dynamicApi.list(appId, collections[2].name, { pageSize: 200 });
      return res.data;
    },
  });
  const q3 = useQuery({
    queryKey: ['dashboard', appId, collections[3]?.name],
    enabled: !!collections[3],
    queryFn: async () => {
      if (!collections[3]) return null;
      const res = await dynamicApi.list(appId, collections[3].name, { pageSize: 200 });
      return res.data;
    },
  });

  const rawQueries = [q0, q1, q2, q3];
  const queries = collections.map((col, i) => ({ col, query: rawQueries[i] }));

  const isLoading = queries.some(q => q.query.isLoading);
  const hasError  = queries.some(q => q.query.error);

  if (isLoading) return <LoadingPage />;
  if (hasError)  return <ErrorState error="Failed to load dashboard data" />;

  // Build per-collection stats
  const stats = queries.map(({ col, query }) => {
    const records: Record<string, unknown>[] = (query.data as { data?: Record<string, unknown>[] } | null)?.data || [];
    const total   = (query.data as { pagination?: { total: number } } | null)?.pagination?.total ?? records.length;

    const selectField = col.fields.find(f => f.type === 'select');
    const dateField   = col.fields.find(f => f.type === 'date');

    const groupCounts: Record<string, number> = {};
    if (selectField) {
      for (const r of records) {
        const val = String(r[selectField.name] || 'unknown');
        groupCounts[val] = (groupCounts[val] || 0) + 1;
      }
    }

    let overdueCount = 0;
    if (dateField) {
      overdueCount = records.filter(r => {
        try { return r[dateField.name] && new Date(String(r[dateField.name])) < new Date(); }
        catch { return false; }
      }).length;
    }

    return { col, total, groupCounts, selectField, dateField, overdueCount, records };
  });

  const statusIcons: Record<string, React.ReactNode> = {
    todo:        <Clock className="w-3.5 h-3.5" />,
    in_progress: <TrendingUp className="w-3.5 h-3.5" />,
    done:        <CheckCircle className="w-3.5 h-3.5" />,
    high:        <AlertTriangle className="w-3.5 h-3.5" />,
  };
  const statusBg: Record<string, string> = {
    todo: 'bg-gray-100', in_progress: 'bg-blue-100',
    done: 'bg-green-100', high: 'bg-red-100',
  };
  const statusText: Record<string, string> = {
    todo: 'text-gray-700', in_progress: 'text-blue-700',
    done: 'text-green-700', high: 'text-red-700',
  };

  return (
    <div className="space-y-6">

      {/* Collection stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ col, total, overdueCount }) => (
          <div key={col.name} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {col.label || col.name}
              </p>
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-400 mt-1">total records</p>
            {overdueCount > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-500 font-medium">
                <AlertTriangle className="w-3 h-3" /> {overdueCount} overdue
              </div>
            )}
          </div>
        ))}

        {/* Status breakdown cards for first collection */}
        {stats[0]?.selectField && Object.entries(stats[0].groupCounts).slice(0, 4).map(([val, count]) => (
          <div key={val} className={`card p-4 border-0 ${statusBg[val] || 'bg-indigo-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${statusText[val] || 'text-indigo-700'}`}>
                {val.replace(/_/g, ' ')}
              </p>
              <span className={statusText[val] || 'text-indigo-700'}>
                {statusIcons[val] || <Database className="w-3.5 h-3.5" />}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats[0].total > 0 ? Math.round((count / stats[0].total) * 100) : 0}% of total
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Bar chart — collections or status counts */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            {collections.length > 1 ? 'Records by Collection' : 'Count by ' + (stats[0]?.selectField?.label || 'Status')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={
                collections.length > 1
                  ? stats.map(s => ({ name: s.col.label || s.col.name, count: s.total }))
                  : Object.entries(stats[0]?.groupCounts || {}).map(([name, count]) => ({
                      name: name.replace(/_/g, ' '), count,
                    }))
              }
            >
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(collections.length > 1 ? stats : Object.keys(stats[0]?.groupCounts || {})).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — status breakdown */}
        {stats[0]?.selectField && Object.keys(stats[0].groupCounts).length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              {stats[0].col.label || stats[0].col.name} breakdown
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(stats[0].groupCounts).map(([name, value]) => ({
                    name: name.replace(/_/g, ' '), value,
                  }))}
                  cx="50%" cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {Object.keys(stats[0].groupCounts).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent records */}
      {stats[0]?.records.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Recent {stats[0].col.label || stats[0].col.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {stats[0].col.fields.slice(0, 4).map(f => (
                    <th key={f.name} className="text-left pb-2 text-xs font-medium text-gray-500 pr-4">
                      {f.label || f.name}
                    </th>
                  ))}
                  <th className="text-left pb-2 text-xs font-medium text-gray-500">Added</th>
                </tr>
              </thead>
              <tbody>
                {stats[0].records.slice(0, 6).map((record: Record<string, unknown>) => (
                  <tr key={String(record.id)} className="border-b border-gray-50 hover:bg-gray-50">
                    {stats[0].col.fields.slice(0, 4).map(f => (
                      <td key={f.name} className="py-2.5 pr-4 text-gray-700 max-w-[140px]">
                        {record[f.name] !== undefined && record[f.name] !== null && record[f.name] !== ''
                          ? f.type === 'select'
                            ? <span className="badge badge-blue text-xs">{String(record[f.name]).replace(/_/g, ' ')}</span>
                            : <span className="truncate block">{String(record[f.name]).slice(0, 40)}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                    ))}
                    <td className="py-2.5 text-xs text-gray-400">
                      {record._meta
                        ? new Date(String((record._meta as Record<string, unknown>).createdAt)).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
