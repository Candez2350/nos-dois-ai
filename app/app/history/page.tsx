import React from 'react';
import { Metadata } from 'next';

// Assume these types are defined or inferred correctly from the API response
interface Settlement {
  id: string | number;
  couple_id: string | number;
  amount_settled: number;
  paid_by: string | number;
  received_by: string | number;
  month_reference: string;
  created_at: string;
  payerName?: string;
  receiverName?: string;
}

// Mock function to fetch data - in a real app, this would call your API endpoint
// For demonstration, we'll simulate fetching data that the backend provides.
// In a real Next.js app, you might fetch directly from Supabase here if this is a Server Component,
// or call your own API route if it's a Client Component.
// Given the previous interaction, we'll assume a client-side fetch from /api/dashboard/history.
async function getHistoryData(): Promise<Settlement[]> {
  // IMPORTANT: In a real Next.js application, you would typically fetch data either:
  // 1. Directly in a Server Component using supabase-admin.
  // 2. By calling your own API route (e.g., /api/dashboard/history) from a Client Component.
  // Since we previously worked on the API route, we'll simulate calling that route.
  // If this `page.tsx` is intended to be a Server Component, the fetching logic
  // would be different and more direct with supabase-admin.

  // For now, simulating a client-side fetch:
  try {
    // Use process.env.NEXT_PUBLIC_BASE_URL or similar if your API is not at the root
    const response = await fetch('/api/dashboard/history', {
      // Add cache control if needed, or remove to ensure fresh data fetch
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('API Error response:', await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data.history)) {
      return data.history;
    } else {
      console.error('Unexpected data format from API:', data);
      return []; // Return empty array if format is wrong
    }
  } catch (error) {
    console.error('Failed to fetch history:', error);
    // In a Server Component, you'd handle this differently, possibly returning an error UI.
    // For a Client Component, throwing or returning an empty array is common.
    return []; // Return empty on error to prevent app crash
  }
}

export const metadata: Metadata = {
  title: 'Histórico de Fechamentos',
};

// This page component will act as a Client Component by default if it uses hooks like useState/useEffect.
// To make it a Server Component, remove useState/useEffect and fetch data directly.
// For this implementation, let's assume it's a Client Component fetching from our API route.
export default async function HistoryPage() {
  // If this were a Server Component, you'd uncomment the line below and remove the commented client-side logic:
  // const history = await getHistoryData(); 

  // The following is for a Client Component implementation using useEffect/useState
  // For simplicity in this direct file creation, we'll assume getHistoryData is called in a way
  // that works for the context (e.g., if this page.tsx is marked 'use client').
  // If it's a Server Component, the 'await getHistoryData()' call above would be used directly here.

  const history = await getHistoryData(); // Assuming this page can directly await async operations

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Histórico de Fechamentos</h1>

      {history.length === 0 ? (
        <p>Nenhum histórico de fechamento encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg shadow-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data do Fechamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total do Mês
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagador
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recebedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mês Referência
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    R$ {item.amount_settled.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.payerName || 'Parceiro'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.receiverName || 'Parceiro'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.month_reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
