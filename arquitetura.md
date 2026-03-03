# Arquitetura do Sistema - Elo Financeiro

Este documento descreve a arquitetura do projeto Elo Financeiro, uma aplicação web para gerenciamento de finanças de casais.

## Visão Geral

A aplicação é uma [Single Page Application (SPA)](https://developer.mozilla.org/en-US/docs/Glossary/SPA) construída com [Next.js](https://nextjs.org/), que serve tanto o frontend quanto o backend (através de API Routes). O banco de dados é o [Supabase](https://supabase.io/), que provê um banco de dados PostgreSQL, autenticação e funcionalidades de tempo-real.

## Componentes Principais

### 1. Frontend

-   **Framework:** [Next.js](https://nextjs.org/) (utilizando o App Router) com [React](https://reactjs.org/) 18.
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/).
-   **Estilização:** [Tailwind CSS](https://tailwindcss.com/) para estilização utilitária e componentes customizados.
-   **UI Components:** A aplicação utiliza componentes React customizados, localizados em `components/`, e ícones da biblioteca [lucide-react](https://lucide.dev/guide/react).
-   **Estado:** O estado da aplicação é gerenciado localmente nos componentes com os hooks do React (`useState`, `useEffect`, `useCallback`, etc.).

### 2. Backend (API Routes)

-   **Framework:** As rotas de API do [Next.js](https://nextjs.org/docs/api-routes/introduction) são usadas para fornecer a lógica de backend.
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/).
-   **Localização:** O código do backend está localizado em `app/api/`.
-   **Autenticação:** A autenticação é customizada, utilizando a biblioteca [iron-session](https://github.com/vvo/iron-session) para gerenciar sessões com cookies. As rotas de autenticação (`login`, `logout`, `session`) interagem com o Supabase para verificar e criar usuários.

### 3. Banco de Dados

-   **Provedor:** [Supabase](https://supabase.io/).
-   **Banco:** [PostgreSQL](https://www.postgresql.org/).
-   **Acesso:** O acesso ao banco de dados é feito de duas formas:
    -   **Admin (Backend):** As API Routes utilizam o cliente admin do Supabase (`@supabase/supabase-js`) com a chave de serviço para ter acesso privilegiado ao banco. Veja `lib/supabase-admin.ts`.
    -   **Browser (Frontend):** O frontend utiliza a chave pública (anon key) do Supabase para interagir com o banco de dados, principalmente para a funcionalidade de tempo-real. Veja `lib/supabase-browser.ts`.
-   **Schema:** O schema do banco de dados, migrações e triggers estão localizados no diretório `supabase/`.

### 4. Funcionalidades de Tempo-Real (Realtime)

-   A aplicação utiliza o [Supabase Realtime](https://supabase.com/docs/guides/realtime) para atualizar a interface do usuário em tempo real quando ocorrem mudanças no banco de dados.
-   **Exemplo:** O dashboard (`app/(protected)/dashboard/page.tsx`) escuta por mudanças na tabela `settlements` para exibir ou ocultar solicitações de fechamento de período em tempo real.

### 5. Serviços Externos

-   **Inteligência Artificial:** A aplicação utiliza a API do [Google Gemini](https://ai.google.dev/) para analisar descrições de despesas (texto ou imagem com OCR) e extrair informações como valor, local, categoria e data. A lógica para isso está em `lib/gemini-service.ts`.

## Fluxo de Dados (Exemplo: Fechamento de Período)

1.  O usuário clica no botão "Fechar Período" no dashboard.
2.  O componente do dashboard (`app/(protected)/dashboard/page.tsx`) chama a função `handleClosePeriod`.
3.  `handleClosePeriod` envia uma requisição `POST` para a API Route `/api/dashboard/close-period`.
4.  A API Route, por sua vez, utiliza o `lib/finance-service.ts` para calcular o balanço do período e criar uma nova entrada na tabela `settlements` no Supabase com o status `PENDING`.
5.  O Supabase Realtime notifica os clientes conectados sobre a nova entrada na tabela `settlements`.
6.  O dashboard, que está escutando por essas mudanças, atualiza seu estado e exibe um card para o outro parceiro aprovar o fechamento, ou uma mensagem de "Aguardando aprovação" para quem solicitou.

## Estrutura de Diretórios Relevante

-   `app/`: Contém as páginas e rotas da aplicação (App Router).
    -   `(protected)/`: Agrupa as rotas que exigem autenticação.
    -   `api/`: Contém as rotas de backend.
-   `components/`: Componentes React reutilizáveis.
-   `lib/`: Módulos e serviços compartilhados (Supabase clients, serviços de finanças, Gemini, etc.).
-   `supabase/`: Definições do banco de dados (migrações, triggers, etc.).
