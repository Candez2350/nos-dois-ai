
import CategoryManager from '@/components/CategoryManager';

export default function CategoriesPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Categorias</h1>
      <CategoryManager />
    </div>
  );
}
