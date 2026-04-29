'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Layers, Plus, Settings, LogOut, Menu, X,
  Bell, ChevronDown, Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'nav.apps' },
  { href: '/apps/new', icon: Plus, key: 'nav.create' },
  { href: '/settings', icon: Settings, key: 'nav.settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 shrink-0">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">AppForge</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <LocaleSwitcher />
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </button>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-60 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <span className="font-bold">AppForge</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    pathname.startsWith(href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t(key)}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
