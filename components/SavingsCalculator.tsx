'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Clock, DollarSign, ArrowRight, RotateCcw } from 'lucide-react';

export default function SavingsCalculator() {
  const [monthlySpend, setMonthlySpend] = useState<number | ''>('');
  const [timeSpent, setTimeSpent] = useState<number | ''>('');
  const [result, setResult] = useState<{ timeSaved: number; moneySaved: number } | null>(null);

  const calculateSavings = () => {
    const spend = Number(monthlySpend) || 0;
    const time = Number(timeSpent) || 0;

    // Assumptions:
    // Elo Financeiro saves 90% of the time spent manually splitting bills.
    // Elo Financeiro helps save 5% of the total spend by identifying forgotten debts and optimizing shared costs.
    const timeSaved = time * 0.9;
    const moneySaved = spend * 0.05;

    setResult({ timeSaved, moneySaved });
  };

  const resetCalculator = () => {
    setMonthlySpend('');
    setTimeSpent('');
    setResult(null);
  };

  return (
    <section className="py-16 px-4 md:px-8 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto my-12">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-4">
            Quanto você pode economizar?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubra quanto tempo e dinheiro o Elo Financeiro pode recuperar para você todos os meses.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label htmlFor="monthlySpend" className="block text-sm font-medium text-gray-700">
              Gasto mensal médio em contas compartilhadas (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                id="monthlySpend"
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 outline-none transition-all"
                placeholder="Ex: 2500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="timeSpent" className="block text-sm font-medium text-gray-700">
              Tempo gasto mensalmente organizando contas (horas)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                id="timeSpent"
                value={timeSpent}
                onChange={(e) => setTimeSpent(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 outline-none transition-all"
                placeholder="Ex: 4"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={calculateSavings}
              className="flex-1 bg-[#1C1C1C] text-white font-medium py-4 rounded-2xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
            >
              <Calculator className="w-5 h-5" />
              Calcular
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={resetCalculator}
              className="px-6 py-4 bg-gray-100 text-gray-600 font-medium rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              title="Limpar campos"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#1C1C1C] text-white p-8 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366] opacity-10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          <h3 className="text-xl font-medium mb-8 text-gray-300">Sua economia estimada:</h3>
          
          <div className="space-y-8 relative z-10">
            <div>
              <div className="text-sm text-gray-400 mb-1">Tempo Livre Ganho</div>
              <div className="text-4xl md:text-5xl font-bold font-display text-[#25D366]">
                {result ? result.timeSaved.toFixed(1) : '0'} <span className="text-2xl text-white">horas/mês</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Equivalente a {result ? Math.round(result.timeSaved * 12) : '0'} horas por ano
              </p>
            </div>

            <div className="w-full h-px bg-gray-800" />

            <div>
              <div className="text-sm text-gray-400 mb-1">Dinheiro Recuperado</div>
              <div className="text-4xl md:text-5xl font-bold font-display text-white">
                R$ {result ? result.moneySaved.toFixed(2) : '0,00'} <span className="text-2xl text-gray-500">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Até R$ {result ? (result.moneySaved * 12).toFixed(2) : '0,00'} por ano
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
