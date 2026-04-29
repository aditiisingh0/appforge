'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Layers, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
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
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AppForge</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="card p-6 shadow-xl shadow-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('auth.register')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.name')}</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={set('name')}
                placeholder="John Doe"
                autoFocus
              />
            </div>
            <div>
              <label className="label">{t('auth.email')} <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">{t('auth.password')} <span className="text-red-500">*</span></label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('auth.submit')}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            {t('auth.hasAccount')}{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
