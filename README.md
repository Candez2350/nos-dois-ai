import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NósDois.ai",
  description: "Assistente financeiro inteligente para casais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
# NósDois.ai 💑

**Assistente financeiro inteligente para casais.**

O NósDois.ai é uma plataforma SaaS que elimina as discussões financeiras entre casais. O sistema permite o registro de gastos via chat (texto ou foto), utiliza IA para categorização e leitura de cupons, e gerencia o acerto de contas (fechamentos) de forma automática e justa.

## 🚀 Funcionalidades Atuais

### 🌐 Institucional (Landing Page)
- Página de alta conversão desenvolvida com **Framer Motion**.
- Seções detalhadas: Hero, Problema/Solução, Recursos Técnicos, Preços e FAQ.
- Design totalmente responsivo.

### 📱 Aplicação (Área Logada)
O layout da aplicação adapta-se automaticamente ao dispositivo:
- **Desktop:** Sidebar lateral fixa.
- **Mobile:** Bottom Navigation (barra inferior) estilo app nativo.

#### Módulos do Sistema:
1.  **💬 Chat:** Interface principal para interação com a IA e registro de despesas.
2.  **📊 Dashboard:** Visão geral dos saldos do mês e quem deve a quem.
3.  **📜 Histórico (Novo):**
    - Listagem completa de todos os fechamentos de contas anteriores.
    - Detalhes de quem pagou, quem recebeu, valor liquidado e mês de referência.
4.  **⚙️ Ajustes (Novo):**
    - **Identidade:** Alteração do nome do casal.
    - **Regra de Divisão:**
        - *50/50:* Divisão igualitária.
        - *Proporcional:* Divisão baseada na porcentagem de renda de cada um (ex: 60/40).
    - **Inteligência Artificial:**
        - *Personalidade:* Escolha entre uma IA "Descontraída 😄" ou "Formal 🧐".
    - **Segurança:** Regra de negócio onde apenas o **Parceiro 1 (Assinante)** tem permissão para alterar configurações globais que afetam o cálculo.

## 🛠️ Stack Tecnológica

- **Frontend:** [Next.js 15](https://nextjs.org/) (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Backend / Database:** Supabase (PostgreSQL)
- **Autenticação:** Gerenciamento de sessão via Cookies (`elo_session`).

## 📂 Estrutura de Pastas Importantes

```bash
app/
├── api/                    # Rotas de API (Backend Next.js)
│   ├── auth/               # Login/Logout/Session
│   ├── couples/settings/   # GET/PATCH configurações do casal
│   └── dashboard/history/  # GET histórico de fechamentos
├── app/                    # Área Logada (Protected Routes)
│   ├── chat/               # Página de Chat
│   ├── dashboard/          # Página de Dashboard
│   ├── history/            # Página de Histórico
│   ├── settings/           # Página de Configurações
│   └── layout.tsx          # Layout com Sidebar/BottomNav
├── layout.tsx              # Root Layout
└── page.tsx                # Landing Page
```

## ⚙️ Configuração e Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/elo-financeiro-2.git
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Variáveis de Ambiente (.env.local):**
   Certifique-se de configurar as chaves do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```

4. **Rodar o projeto:**
   ```bash
   npm run dev
   ```