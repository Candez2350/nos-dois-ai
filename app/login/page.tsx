'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, LogIn, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [partner, setPartner] = useState<1 | 2>(1);
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) setCode(token.toUpperCase());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationToken: code.trim().toUpperCase(),
          partner,
          partnerName: partnerName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao entrar.');
        return;
      }
      router.push('/app/chat');
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-10 text-[#1C1C1C] hover:opacity-80">
        <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center">
          <MessageCircle className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold">NósDois<span className="text-[#25D366]">.ai</span></span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center">
            <LogIn className="w-6 h-6 text-[#25D366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Entrar no app</h1>
            <p className="text-gray-500 text-sm">Use o código do casal e escolha quem é você</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código do casal</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: ND-A1B2"
              className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 outline-none transition-all font-mono uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quem é você?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPartner(1)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                  partner === 1
                    ? 'border-[#25D366] bg-[#25D366]/5 text-[#1C1C1C]'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Parceiro 1</span>
              </button>
              <button
                type="button"
                onClick={() => setPartner(2)}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                  partner === 2
                    ? 'border-[#25D366] bg-[#25D366]/5 text-[#1C1C1C]'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Parceiro 2</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome (opcional)</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Como aparecer no app"
              className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Não tem código?{' '}
          <Link href="/" className="text-[#25D366] font-medium hover:underline">
            Cadastre seu casal na página inicial
          </Link>
        </p>
      </div>
    </main>
  );
}
