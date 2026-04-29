'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoadingPage } from '@/components/ui/LoadingState';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/dashboard' : '/auth/login');
    }
  }, [user, isLoading, router]);

  return <LoadingPage />;
}
