'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, Calendar, Loader2, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  whatsapp_number: string;
  pix_key: string | null;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users/profile')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Perfil não encontrado.');
          throw new Error('Erro ao carregar perfil.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-2">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p>{error}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Meu Perfil</h1>
      <p className="text-gray-500 mb-8">Visualize seus dados pessoais cadastrados.</p>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#25D366]/10 p-8 flex flex-col items-center justify-center border-b border-[#25D366]/10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-[#25D366]">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1C1C]">{user.name}</h2>
          <span className="text-sm font-medium text-[#25D366] bg-white/50 px-3 py-1 rounded-full mt-2">
            {user.role === 'partner_1' ? 'Parceiro 1 (Admin)' : 'Parceiro 2'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp</p>
              <p className="text-[#1C1C1C] font-medium">{user.whatsapp_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
              <p className="text-[#1C1C1C] font-medium">{user.email || 'Não cadastrado'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chave PIX</p>
              <p className="text-[#1C1C1C] font-medium">{user.pix_key || 'Não cadastrada'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membro desde</p>
              <p className="text-[#1C1C1C] font-medium">
                {new Date(user.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
