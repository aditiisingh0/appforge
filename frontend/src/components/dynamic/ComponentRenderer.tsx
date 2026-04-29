'use client';

import { AppConfig, UIComponentConfig, CollectionConfig } from '@/types/config';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';
import { DynamicDashboard } from './DynamicDashboard';
import { dynamicApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

interface ComponentRendererProps {
  appId: string;
  config: AppConfig;
  component: UIComponentConfig;
}

export function ComponentRenderer({ appId, config, component }: ComponentRendererProps) {
  const collection = component.collection
    ? config.collections.find(c => c.name === component.collection)
    : undefined;

  // Graceful fallback if collection not found
  if (component.collection && !collection) {
    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Collection <code className="font-mono bg-yellow-100 px-1 rounded">{component.collection}</code> not found in config.
        Check your app configuration.
      </div>
    );
  }

  switch (component.type) {
    case 'table':
      if (!collection) return <MissingCollection type="table" />;
      return (
        <DynamicTable
          appId={appId}
          collection={collection}
          visibleFields={component.fields}
          pageSize={component.pagination?.pageSize}
        />
      );

    case 'form':
      if (!collection) return <MissingCollection type="form" />;
      return (
        <div className="max-w-lg">
          <DynamicForm
            collection={collection}
            visibleFields={component.fields}
            onSubmit={async (data) => {
              await dynamicApi.create(appId, collection.name, data);
              toast.success('Saved!');
            }}
          />
        </div>
      );

    case 'dashboard':
      return (
        <DynamicDashboard
          appId={appId}
          component={component}
          collections={collection ? [collection] : config.collections}
        />
      );

    case 'chart':
      if (!collection) return <MissingCollection type="chart" />;
      return (
        <DynamicDashboard
          appId={appId}
          component={component}
          collections={[collection]}
        />
      );

    // Unknown component types are rendered with a helpful message
    default:
      return (
        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            Component type <code className="font-mono bg-gray-100 px-1 rounded">{component.type}</code> is not yet supported.
          </p>
          {component.title && (
            <p className="text-xs text-gray-400 mt-1">Component: {component.title}</p>
          )}
        </div>
      );
  }
}

function MissingCollection({ type }: { type: string }) {
  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
      This {type} requires a <code className="font-mono">collection</code> to be specified.
    </div>
  );
}
