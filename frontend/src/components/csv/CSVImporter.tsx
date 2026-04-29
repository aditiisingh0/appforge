'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, ArrowRight, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { csvApi } from '@/lib/api';
import { CollectionConfig } from '@/types/config';
import toast from 'react-hot-toast';

type Step = 'upload' | 'map' | 'result';

interface ImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

interface CSVImporterProps {
  appId: string;
  collection: CollectionConfig;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function CSVImporter({ appId, collection, onSuccess, onClose }: CSVImporterProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    sampleRows: Record<string, string>[];
    totalRows: number;
    fieldSuggestions: Record<string, string | null>;
    collectionFields: Array<{ name: string; label?: string; type: string }>;
  } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (f: File) => {
    setFile(f);
    setLoading(true);
    try {
      const res = await csvApi.preview(appId, collection.name, f);
      setPreview(res.data);
      setMapping(res.data.fieldSuggestions);
      setStep('map');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      toast.error(axErr.response?.data?.error || 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await csvApi.import(appId, collection.name, file, mapping);
      setResult(res.data);
      setStep('result');
      if (res.data.succeeded > 0) {
        toast.success(t('csv.success', { count: res.data.succeeded }));
        onSuccess?.();
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      toast.error(axErr.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {(['upload', 'map', 'result'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s ? 'bg-indigo-600 text-white' :
              ['upload', 'map', 'result'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {['upload', 'map', 'result'].indexOf(step) > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-xs text-gray-600 capitalize">{s}</span>
            {i < 2 && <ArrowRight className="w-3.5 h-3.5 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.name.endsWith('.csv')) handleFileSelect(f);
            }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-10 h-10 mx-auto text-indigo-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Drop a CSV file or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Max 10MB · .csv only</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />
        </div>
      )}

      {/* Step: Map */}
      {step === 'map' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{preview.totalRows}</span> rows found in <code className="bg-gray-100 px-1 rounded text-xs">{file?.name}</code>
            </p>
            <button onClick={() => setStep('upload')} className="text-xs text-gray-400 hover:text-gray-600">
              ← Re-upload
            </button>
          </div>

          {/* Mapping table */}
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 gap-0 bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>CSV Column</span>
              <span>Maps to Field</span>
            </div>
            <div className="divide-y divide-gray-100">
              {preview.headers.map(header => (
                <div key={header} className="grid grid-cols-2 gap-4 px-4 py-3 items-center">
                  <span className="text-sm font-mono text-gray-700 truncate">{header}</span>
                  <select
                    className="input text-sm"
                    value={mapping[header] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                  >
                    <option value="">— Skip —</option>
                    {preview.collectionFields.map(f => (
                      <option key={f.name} value={f.name}>
                        {f.label || f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Sample preview */}
          {preview.sampleRows.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Sample rows:</p>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.headers.slice(0, 5).map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-r border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {preview.headers.slice(0, 5).map(h => (
                          <td key={h} className="px-3 py-2 text-gray-600 border-r border-gray-200 truncate max-w-[100px]">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || Object.values(mapping).every(v => !v)}
            className="btn-primary w-full justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Importing...' : `Import ${preview.totalRows} Records`}
          </button>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && result && (
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            result.failed === 0 ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {result.failed === 0
              ? <Check className="w-8 h-8 text-green-600" />
              : <AlertCircle className="w-8 h-8 text-yellow-600" />}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Import Complete</p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-green-600 font-medium">{result.succeeded} succeeded</span>
              {result.failed > 0 && <span className="text-red-500 ml-2">{result.failed} failed</span>}
            </p>
          </div>

          {result.errors.length > 0 && (
            <div className="text-left bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-red-700 mb-2">Errors:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">Row {e.row}: {e.error}</p>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep('upload'); setFile(null); setPreview(null); setResult(null); }} className="btn-secondary">
              Import more
            </button>
            {onClose && (
              <button onClick={onClose} className="btn-primary">Done</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
