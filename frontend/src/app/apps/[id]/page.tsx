'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { appsApi } from '@/lib/api';
import { AppConfig, PageConfig } from '@/types/config';
import { ComponentRenderer } from '@/components/dynamic/ComponentRenderer';
import { LoadingPage, ErrorState } from '@/components/ui/LoadingState';
import { addAppTranslations } from '@/lib/i18n';
import { CSVImporter } from '@/components/csv/CSVImporter';
import {
  LayoutDashboard, Table, FormInput, BarChart2,
  Upload, ChevronRight, Settings, Globe
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

const PAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: LayoutDashboard,
  dashboard: LayoutDashboard,
  table: Table,
  form: FormInput,
  chart: BarChart2,
};

function getIcon(iconName?: string) {
  return PAGE_ICONS[iconName?.toLowerCase() || ''] || LayoutDashboard;
}

export default function AppRuntimePage() {
  const { id } = useParams<{ id: string }>();
  const [activePage, setActivePage] = useState<string | null>(null);
  const [csvCollection, setCsvCollection] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['app', id],
    queryFn: async () => {
      const res = await appsApi.get(id);
      return res.data;
    },
  });

  const config: AppConfig | null = data?.config || null;

  useEffect(() => {
    if (config) {
      // Load app-specific translations
      if (config.i18n) addAppTranslations(config.i18n);
      // Set default active page
      if (config.pages?.length && !activePage) {
        setActivePage(config.pages[0].id);
      }
    }
  }, [config, activePage]);

  if (isLoading) return <LoadingPage />;
  if (error || !config) return (
    <ErrorState
      error="Failed to load app configuration"
      onRetry={() => window.location.reload()}
    />
  );

  const currentPage: PageConfig | undefined = config.pages?.find(p => p.id === activePage) || config.pages?.[0];

  // Apply theme if specified
  const primaryColor = config.theme?.primaryColor;

  return (
    <div className="flex h-full min-h-screen bg-gray-50" style={primaryColor ? { '--brand': primaryColor } as React.CSSProperties : {}}>
      {/* App sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 truncate text-sm">{config.name}</h2>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="badge badge-blue text-xs">{config.version || '1.0'}</span>
            {data?.is_published && <span className="badge badge-green text-xs"><Globe className="w-2.5 h-2.5" />Live</span>}
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {/* Pages */}
          {config.pages?.map(page => {
            const Icon = getIcon(page.icon);
            return (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={clsx(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                  activePage === page.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{page.title || page.path}</span>
              </button>
            );
          })}

          {/* Collections for CSV import */}
          {config.collections?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 px-3 mb-1 uppercase tracking-wide">Import</p>
              {config.collections.map(col => (
                <button
                  key={col.name}
                  onClick={() => setCsvCollection(col.name)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Import {col.label || col.name}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Settings link */}
        <div className="p-2 border-t border-gray-100">
          <Link
            href={`/apps/${id}/edit`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Edit Config
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        {currentPage && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h1 className="font-semibold text-gray-900">{currentPage.title || currentPage.path}</h1>
              {currentPage.components?.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {currentPage.components.length} component{currentPage.components.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </header>
        )}

        {/* Page components */}
        <div className="flex-1 overflow-auto p-6">
          {!currentPage ? (
            <div className="text-center py-16 text-gray-400">
              <p>No pages configured yet.</p>
              <Link href={`/apps/${id}/edit`} className="btn-secondary mt-4 text-sm inline-flex">
                Edit Configuration
              </Link>
            </div>
          ) : currentPage.components?.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>This page has no components configured.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentPage.components.map(component => (
                <div key={component.id}>
                  {component.title && (
                    <h2 className="text-base font-semibold text-gray-800 mb-3">{component.title}</h2>
                  )}
                  <ComponentRenderer
                    appId={id}
                    config={config}
                    component={component}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {csvCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold">
                Import CSV → {config.collections.find(c => c.name === csvCollection)?.label || csvCollection}
              </h3>
              <button onClick={() => setCsvCollection(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6">
              <CSVImporter
                appId={id}
                collection={config.collections.find(c => c.name === csvCollection)!}
                onSuccess={() => setCsvCollection(null)}
                onClose={() => setCsvCollection(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
