'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appsApi } from '@/lib/api';
import { LoadingPage, ErrorState } from '@/components/ui/LoadingState';
import { sanitizeConfigPreview } from '@/lib/configUtils';
import {
  Save, Loader2, AlertCircle, CheckCircle, Eye, EyeOff,
  ArrowLeft, Globe, Lock, Trash2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AppEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [configText, setConfigText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [preview, setPreview] = useState<{ collections: number; pages: number; fields: number } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['app', id],
    queryFn: async () => {
      const res = await appsApi.get(id);
      return res.data;
    },
  });

  useEffect(() => {
    if (data?.config) {
      setConfigText(JSON.stringify(data.config, null, 2));
      updatePreview(data.config);
    }
  }, [data]);

  const updatePreview = (config: Record<string, unknown>) => {
    try {
      const collections = (config.collections as unknown[] | undefined)?.length || 0;
      const pages = (config.pages as unknown[] | undefined)?.length || 0;
      const fields = (config.collections as Array<{ fields?: unknown[] }> | undefined)
        ?.reduce((acc: number, c) => acc + (c.fields?.length || 0), 0) || 0;
      setPreview({ collections, pages, fields });
    } catch {
      setPreview(null);
    }
  };

  const handleConfigChange = (text: string) => {
    setConfigText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError('');
      updatePreview(parsed);
    } catch (e: unknown) {
      const err = e as Error;
      setJsonError(err.message);
      setPreview(null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (config: object) => appsApi.update(id, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app', id] });
      toast.success('Configuration saved!');
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: string } } };
      toast.error(axErr.response?.data?.error || 'Save failed');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (published: boolean) => appsApi.publish(id, published),
    onSuccess: (_, published) => {
      qc.invalidateQueries({ queryKey: ['app', id] });
      toast.success(published ? 'App published!' : 'App unpublished');
    },
  });

  const handleSave = () => {
    if (jsonError) {
      toast.error('Fix JSON errors before saving');
      return;
    }
    try {
      const parsed = JSON.parse(configText);
      saveMutation.mutate(parsed);
    } catch {
      toast.error('Invalid JSON');
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorState error="Failed to load app" />;

  const isPublished = data?.is_published;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/apps/${id}`} className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Configuration</h1>
            <p className="text-xs text-gray-400">{data?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => publishMutation.mutate(!isPublished)}
            disabled={publishMutation.isPending}
            className={isPublished ? 'btn-secondary text-sm' : 'btn-secondary text-sm'}
          >
            {isPublished
              ? <><Lock className="w-3.5 h-3.5" /> Unpublish</>
              : <><Globe className="w-3.5 h-3.5" /> Publish</>}
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !!jsonError}
            className="btn-primary"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Preview stats */}
      {showPreview && preview && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Collections', value: preview.collections },
            { label: 'Pages', value: preview.pages },
            { label: 'Fields', value: preview.fields },
          ].map(stat => (
            <div key={stat.label} className="card px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span className="text-lg font-bold text-indigo-600">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <span className="text-xs text-gray-400 font-mono">config.json</span>
          </div>
          <div className="flex items-center gap-2">
            {jsonError
              ? <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3.5 h-3.5" /> JSON Error</span>
              : <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Valid JSON</span>}
          </div>
        </div>

        <textarea
          className="w-full h-[60vh] font-mono text-sm bg-gray-900 text-gray-100 p-5 resize-none focus:outline-none leading-relaxed"
          value={configText}
          onChange={e => handleConfigChange(e.target.value)}
          spellCheck={false}
        />

        {jsonError && (
          <div className="bg-red-900/30 border-t border-red-800 px-4 py-2 text-xs text-red-300 font-mono">
            ⚠ {jsonError}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4 text-xs text-gray-400">
        <span>
          {configText.length.toLocaleString()} characters ·{' '}
          {configText.split('\n').length} lines
        </span>
        <Link href={`/apps/${id}`} className="text-indigo-500 hover:text-indigo-700">
          Preview app →
        </Link>
      </div>
    </div>
  );
}
