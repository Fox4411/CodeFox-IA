'use client';

import { useAuth } from '@/components/AuthProvider';
import LoginForm from '@/components/LoginForm';
import Studio from '@/components/Studio';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading, configured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={22} />
      </div>
    );
  }

  // Si Supabase no está configurado, dejamos entrar al Studio para no bloquear desarrollo local
  if (!configured) {
    return <Studio />;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Studio />;
}
