'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import RecurringExpenseManager from '@/components/RecurringExpenseManager';

export default function RecurringSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 pb-12">
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Voltar para Configurações</span>
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Despesas Recorrentes</h1>
      </div>

      <p className="mb-8 text-gray-600">
        Cadastre aqui suas contas fixas e assinaturas, como aluguel, internet, condomínio, Netflix, etc. 
        O sistema lançará essas despesas automaticamente no dia do mês que você definir.
      </p>
      
      <RecurringExpenseManager />
    </div>
  );
}
