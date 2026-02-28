'use client';

import { useState, useRef } from 'react';
import { Send, ImagePlus, Loader2, Bot } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  expense?: { valor: number; local: string; categoria: string; data: string };
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage(text?: string, file?: File) {
    const content = text?.trim() || (file ? 'Enviando imagem...' : '');
    if (!content && !file) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text?.trim() || '[Foto de recibo]',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setImageFile(null);
    setLoading(true);

    try {
      let body: { text?: string; imageBase64?: string } = {};
      if (file) {
        const base64 = await fileToBase64(file);
        body.imageBase64 = base64;
      } else {
        body.text = text?.trim();
      }

      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar');
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message.replace(/\*/g, ''), // remove markdown bold
        expense: data.expense,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ ${err.message || 'Erro ao processar. Tente de novo.'}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (imageFile) {
      sendMessage(undefined, imageFile);
    } else if (input.trim()) {
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-[#25D366]" />
            </div>
            <p className="font-medium text-[#1C1C1C]">Assistente NósDois</p>
            <p className="text-sm mt-1">Envie uma mensagem ou foto de um recibo para registrar o gasto.</p>
            <p className="text-xs mt-4">Ex: &quot;Gastei R$ 45 no mercado&quot; ou envie a foto do cupom.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#25D366] text-white rounded-br-md'
                  : 'bg-white border border-gray-100 shadow-sm rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.expense && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs opacity-90">
                  R$ {msg.expense.valor.toFixed(2)} · {msg.expense.local} · {msg.expense.categoria}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
              <span className="text-sm text-gray-500">Processando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setImageFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Enviar foto do recibo"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva o gasto ou envie a foto do recibo..."
              className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 outline-none transition-all"
              disabled={loading}
            />
            {imageFile && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#25D366] font-medium">
                📷 1 img
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || (!input.trim() && !imageFile)}
            className="p-4 rounded-2xl bg-[#25D366] text-white hover:bg-[#20bd5a] disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
