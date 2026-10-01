'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'register') {
      setMessage('Cuenta creada. Si tu proyecto exige confirmación, revisa el email. Si no, ya puedes entrar.');
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center text-sm font-bold">
            CF
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">CodeFox</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Entra para construir y terminar tus proyectos.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl shadow-black/30">
          {!configured && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 leading-relaxed">
              Supabase no está configurado. Añade en <code className="text-amber-100">.env.local</code>:
              <br />
              NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
            </div>
          )}

          <div className="flex mb-5 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm rounded-md transition ${mode === 'login' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-400'}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm rounded-md transition ${mode === 'register' ? 'bg-zinc-100 text-black font-medium' : 'text-zinc-400'}`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-zinc-600"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-zinc-600"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !configured}
              className="w-full rounded-lg bg-white text-black font-medium py-2.5 text-sm hover:bg-zinc-200 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Auth con Supabase · plan gratuito
        </p>
      </div>
    </div>
  );
}
