# Controle Financeiro

Aplicação desenvolvida em React para gerenciamento financeiro pessoal.

## Funcionalidades

- Dashboard financeiro
- Controle de receitas e despesas
- Categorias personalizadas
- Gráficos de análise
- Controle de orçamento
- Controle de cartões
- Metas de economia
- Filtros por período
- Gravação de lançamentos no Supabase, com cópia local no navegador

## Tecnologias

- React
- Vite
- React Router
- Recharts
- JavaScript

## Supabase

Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente da aplicação.
O acesso ao aplicativo usa Supabase Auth com e-mail e senha. Usuários podem criar
uma conta pela tela de cadastro; se a confirmação de e-mail estiver habilitada no
Supabase, precisam confirmar o endereço antes do primeiro login. Os lançamentos
gravados são associados ao usuário autenticado pela coluna `user_id`.
O usuário e a sessão atuais ficam disponíveis às páginas autenticadas por meio
do hook `useAuth` em `src/contexts/AuthContext.jsx`. Ative Row Level Security
(RLS) na tabela `lancamentos` e crie políticas que restrinjam leitura, inclusão,
alteração e exclusão a linhas cujo `user_id` seja igual a `auth.uid()`.
Ao iniciar uma sessão, os lançamentos são carregados diretamente do Supabase e
filtrados pelo usuário autenticado; o `localStorage` não é usado como fonte para
essa lista.
Antes de usar a gravação de lançamentos, execute o SQL de
[`supabase/migrations/20261008131000_add_installment_columns.sql`](./supabase/migrations/20261008131000_add_installment_columns.sql)
no SQL Editor do Supabase para adicionar as colunas de parcelas à tabela `lancamentos`.