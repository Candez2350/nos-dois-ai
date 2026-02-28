<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally

View your app in AI Studio: https://ai.studio/apps/dfff3623-3057-4e60-836e-714e4cc48dc7

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Configure [.env.local](.env.local):
   - `GEMINI_API_KEY` – chave da API Gemini
   - `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` – projeto Supabase
   - `SESSION_SECRET` – valor aleatório para sessão (ex: `openssl rand -hex 32`)
3. Run the app: `npm run dev`

## Fluxo de uso (app)

- **Registro:** na landing, “Testar Grátis” → nome do casal + WhatsApp → gera **código do casal** (ex: ND-A1B2).
- **Login:** em `/login` (ou “Já tenho conta”), informe o código, escolha “Parceiro 1” ou “Parceiro 2” e opcionalmente seu nome. O primeiro login de cada parceiro cria/atualiza o usuário na tabela `users` e associa ao casal.
- **Chat:** em `/app/chat`, envie texto ou foto de recibo; a IA extrai valor/local/categoria e grava em `transactions` com `payer_wa_number` no formato `app_{coupleId}_1` ou `_2`.
- **Dashboard:** em `/app/dashboard`, veja saldo do mês e lista de gastos; use “Fechar período e liquidar” para gerar o acerto e registrar em `settlements` (exige os dois usuários do casal em `users`).

O schema é **app-first**: usuários têm `role` (partner_1/partner_2), casais têm `partner_1_id`/`partner_2_id` (FK para users), e transações têm `payer_user_id` (FK para users). `payer_wa_number` é opcional (legado/WhatsApp).

**Migração:** execute o conteúdo de [supabase/migrations/20260228100000_app_first_schema.sql](supabase/migrations/20260228100000_app_first_schema.sql) no **SQL Editor** do Supabase antes de usar o app com o novo fluxo.
