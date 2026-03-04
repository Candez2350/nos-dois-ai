
import BudgetManager from '@/components/BudgetManager';

export default function BudgetsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Orçamentos</h1>
      <BudgetManager />
    </div>
  );
}
