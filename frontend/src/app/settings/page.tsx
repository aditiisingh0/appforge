'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { Loader2, User, Globe, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import i18n from '@/lib/i18n';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [locale, setLocale] = useState(user?.locale || 'en');

  const updateMutation = useMutation({
    mutationFn: () => authApi.update({ name, locale }),
    onSuccess: () => {
      updateUser({ name, locale });
      i18n.changeLanguage(locale);
      localStorage.setItem('af_locale', locale);
      toast.success('Settings saved!');
    },
    onError: () => toast.error(t('error.generic')),
  });

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t('nav.settings')}</h1>

      <div className="space-y-4">
        {/* Profile */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">{t('auth.name')}</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input bg-gray-50" value={user?.email || ''} disabled />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Language</h2>
          </div>
          <div>
            <label className="label">Display Language</label>
            <select
              className="input"
              value={locale}
              onChange={e => setLocale(e.target.value)}
            >
              {SUPPORTED_LOCALES.map(loc => (
                <option key={loc.code} value={loc.code}>
                  {loc.flag} {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary w-full justify-center"
        >
          {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('form.save')}
        </button>
      </div>
    </div>
  );
}
