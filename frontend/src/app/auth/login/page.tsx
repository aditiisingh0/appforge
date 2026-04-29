'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Layers, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr.response?.data?.error || t('error.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AppForge</h1>
          <p className="text-sm text-gray-500 mt-1">Build apps from config</p>
        </div>

        <div className="card p-6 shadow-xl shadow-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('auth.login')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('auth.submit')}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            {t('auth.noAccount')}{' '}
            <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
              {t('auth.register')}
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Demo: register any email to start building
        </p>
      </div>
    </div>
  );
}
