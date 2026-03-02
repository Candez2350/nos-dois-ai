'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';

interface SettlementRequestProps {
  id: string;
  amount: number;
  payerName: string;
  period: string;
}

export default function SettlementRequestCard({
  id,
  amount,
  payerName,
  period
}: SettlementRequestProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch('/api/settlements/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao aprovar');
      }

      window.location.reload(); // Força o recarregamento para atualizar o dashboard
    } catch (error) {
      console.error(error);
      alert('Não foi possível aprovar o fechamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!confirm('Tem certeza que deseja rejeitar este fechamento?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/settlements/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao rejeitar');
      }

      window.location.reload(); // Força o recarregamento para atualizar o dashboard
    } catch (error) {
      console.error(error);
      alert('Não foi possível rejeitar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6 relative overflow-hidden shadow-sm">
      {/* Efeito de fundo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 text-orange-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        
        <div className="flex-1 w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Solicitação de Fechamento</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            <span className="font-semibold text-gray-900">{payerName}</span> solicitou o fechamento das contas de <span className="font-medium">{period}</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-500 font-medium">Valor a acertar:</span>
              <span className="text-2xl font-bold text-gray-900">
                R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-70"
              >
                <XCircle className="w-5 h-5" />
                Rejeitar
              </button>

            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-[#25D366]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Aprovar Fechamento
                </>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}