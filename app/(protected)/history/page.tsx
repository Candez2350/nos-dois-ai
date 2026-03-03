'use client';

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Loader2, AlertCircle } from 'lucide-react';

interface Settlement {
  id: string;
  amount_settled: number;
  paid_by: string;
  received_by: string;
  month_reference: string;
  created_at: string;
  payer_name?: string;
  receiver_name?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/dashboard/history');
        if (!response.ok) {
          throw new Error('Falha ao carregar histórico');
        }
        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o histórico.');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 gap-2">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Histórico de Fechamentos</h1>
        <p className="text-gray-500">Visualize os acertos de contas realizados anteriormente.</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhum fechamento ainda</h3>
          <p className="text-gray-500">
            Quando vocês realizarem o primeiro acerto de contas, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#25D366]/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#E7F8ED] rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#1C1C1C] text-lg">
                      {item.month_reference}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">
                      Liquidado
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pl-16 md:pl-0">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Valor acertado</div>
                  <div className="font-bold text-xl text-[#1C1C1C]">
                    R$ {Number(item.amount_settled).toFixed(2)}
                  </div>
                </div>
                
                <div className="hidden md:block w-px h-10 bg-gray-100 mx-2"></div>

                <div className="text-sm text-gray-600 flex flex-col gap-1 min-w-[140px]">
                  <div className="flex items-center justify-between">
                    <span>Pagou:</span>
                    <span className="font-medium text-[#1C1C1C]">{item.payer_name || 'Parceiro'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recebeu:</span>
                    <span className="font-medium text-[#1C1C1C]">{item.receiver_name || 'Você'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
