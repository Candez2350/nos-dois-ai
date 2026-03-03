'use client';

import { useState, useEffect } from 'react';
import { Loader2, PiggyBank, AlertCircle } from 'lucide-react';

// Define the structure of the data we expect from the API
interface BudgetProgress {
  category_id: string;
  category_name: string;
  limit_amount: number;
  total_spent: number;
  progress: number;
}

/**
 * Determines the color of the progress bar based on spending.
 * @param progress - The spending progress (0 to 1+)
 * @returns A Tailwind CSS background color class.
 */
function getBarColor(progress: number): string {
  if (progress > 1) return 'bg-red-600'; // Overspent
  if (progress >= 0.9) return 'bg-red-500'; // Danger zone
  if (progress >= 0.75) return 'bg-yellow-500'; // Warning zone
  return 'bg-[#25D366]'; // Safe zone
}

/**
 * A single progress bar item representing one budget category.
 */
function BudgetProgressItem({ item }: { item: BudgetProgress }) {
  const progressPercentage = Math.min(item.progress * 100, 100);
  const isOverspent = item.progress > 1;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-medium text-[#1C1C1C]">{item.category_name}</span>
        <span className={`text-sm font-semibold ${isOverspent ? 'text-red-600' : 'text-gray-600'}`}>
          R$ {item.total_spent.toFixed(2)} / R$ {item.limit_amount.toFixed(2)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(item.progress)}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      {isOverspent && (
        <p className="text-xs text-red-600 font-medium text-right">
          Gasto excedeu o limite em R$ {(item.total_spent - item.limit_amount).toFixed(2)}
        </p>
      )}
    </div>
  );
}

/**
 * A component that fetches and displays a list of budget progress bars.
 */
export default function BudgetProgressList() {
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBudgetsProgress() {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/budgets-progress');
        if (!res.ok) {
          throw new Error('Não foi possível carregar os orçamentos.');
        }
        const data = await res.json();
        setBudgets(data);
      } catch (err: any) {
        setError(err.message || 'Um erro ocorreu.');
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetsProgress();
  }, []);

  if (loading) {
    return (
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-red-50 border-red-200 rounded-3xl p-6 mb-8 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{error}</span>
      </section>
    );
  }

  if (budgets.length === 0) {
    // Don't render anything if no budgets are set for the month, to keep the UI clean.
    return null;
  }

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8">
      <h2 className="text-lg font-bold text-[#1C1C1C] mb-5 flex items-center gap-2">
        <PiggyBank className="w-6 h-6 text-[#25D366]" />
        Orçamentos do Mês
      </h2>
      <div className="space-y-5">
        {budgets.map((budget) => (
          <BudgetProgressItem key={budget.category_id} item={budget} />
        ))}
      </div>
    </section>
  );
}
