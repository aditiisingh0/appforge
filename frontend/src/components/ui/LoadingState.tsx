import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return <Loader2 className={`${sz} animate-spin text-indigo-600`} />;
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 px-4 py-3 border-b border-gray-100">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex-1 h-4 skeleton rounded" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 px-4 py-3 border-b bg-gray-50">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-3 skeleton rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-gray-600">{error || 'Something went wrong'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
      {action}
    </div>
  );
}
