'use client';

import { useState, useEffect } from 'react';
import { User, Mail, CreditCard, Calendar, Loader2, AlertCircle, Edit, Save, X } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  pix_key: string | null;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', pix_key: '' });

  useEffect(() => {
    fetch('/api/users/profile')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setUser(data.user);
        setFormData({ name: data.user.name || '', pix_key: data.user.pix_key || '' });
      })
      .catch(() => setError('Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save');

      const data = await res.json();
      setUser(data.user);
      setFormData({ name: data.user.name || '', pix_key: data.user.pix_key || '' });
      setIsEditing(false);
      alert('Perfil atualizado!');
    } catch (err) {
      alert('Erro ao salvar o perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Reset form if canceling
      setFormData({ name: user?.name || '', pix_key: user?.pix_key || '' });
    }
    setIsEditing(!isEditing);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#25D366]" /></div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 gap-2"><AlertCircle className="w-8 h-8 text-red-400" /><p>{error}</p></div>;
  }
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Meu Perfil</h1>
        <button 
          onClick={toggleEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-gray-100 hover:bg-gray-200"
        >
          {isEditing ? <><X className="w-4 h-4"/> Cancelar</> : <><Edit className="w-4 h-4"/> Editar</>}
        </button>
      </div>
      <p className="text-gray-500 mb-8">Visualize e edite seus dados pessoais.</p>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div className="w-full">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="text-[#1C1C1C] font-medium text-lg w-full bg-transparent outline-none disabled:bg-transparent disabled:border-transparent border-b-2 border-transparent focus:border-[#25D366]"
              />
            </div>
          </div>

          <InfoRow label="Email" value={user.email || 'Não cadastrado'} icon={<Mail className="w-5 h-5" />} />

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-14 mb-1 block">Chave PIX</label>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="Sua chave PIX"
                value={formData.pix_key}
                onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                className="text-[#1C1C1C] font-medium w-full bg-gray-50 p-2 rounded-lg outline-none disabled:bg-gray-50 disabled:border-transparent border-2 border-transparent focus:border-[#25D366]"
              />
            </div>
          </div>
          
          <InfoRow label="Membro desde" value={new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} icon={<Calendar className="w-5 h-5" />} />
        </div>
      </div>
      
      {isEditing && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-[#1C1C1C] font-medium">{value}</p>
      </div>
    </div>
  );
}
