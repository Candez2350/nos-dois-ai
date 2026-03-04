
import BalanceManager from '@/components/BalanceManager';

export default function BalanceAdjustmentPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ajuste Manual de Saldo</h1>
      <BalanceManager />
    </div>
  );
}
