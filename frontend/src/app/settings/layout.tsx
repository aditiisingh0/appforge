'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingPage } from '@/components/ui/LoadingState';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
  }, [user, isLoading, router]);

  if (isLoading) return <LoadingPage />;
  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
