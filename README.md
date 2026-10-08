<div align="center">

# 💰 Meu Financeiro

**Organize suas receitas, despesas e objetivos financeiros em um só lugar.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?logo=javascript&logoColor=333)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

## ✨ Sobre o projeto

**Meu Financeiro** é uma aplicação web para registrar movimentações e acompanhar as finanças pessoais. A interface oferece ferramentas para organizar lançamentos, cartões, orçamentos e centros de custo, com dados de lançamentos associados à conta autenticada.

## 🚀 Funcionalidades

| Área | Recursos |
| --- | --- |
| 🔐 **Conta** | Cadastro e login por e-mail e senha, sessão persistente e rotas protegidas |
| 💸 **Lançamentos** | Cadastro, edição, exclusão e classificação de receitas e despesas |
| 💳 **Cartões** | Organização de cartões e acompanhamento de compras |
| 🧾 **Parcelamentos** | Consulta de compras parceladas e parcelas |
| 🏷️ **Organização** | Categorias, subcategorias, centros de custo e formas de pagamento |
| 📊 **Acompanhamento** | Dashboard, gráficos e filtros por período |
| 📄 **Exportação** | Relatórios em planilha `.xlsx` |
| 🎨 **Experiência** | Temas claro e escuro e layout responsivo |

## 🧰 Tecnologias

- **Frontend:** React, JavaScript, CSS e Vite
- **Navegação:** React Router
- **Gráficos:** Recharts
- **Autenticação e banco:** Supabase Auth e PostgreSQL
- **Exportação:** `xlsx-js-style`

## ⚙️ Começando

### Pré-requisitos

- Node.js e npm
- Um projeto no [Supabase](https://supabase.com/)

### Instalação

```bash
git clone https://github.com/AndradeMath/Controle-Financeiro.git
cd Controle-Financeiro
npm install
```

### Configuração do Supabase

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

No painel do Supabase:

1. Habilite o provedor de autenticação por e-mail.
2. Configure **Authentication → URL Configuration** com a URL local apresentada pelo Vite, por exemplo `http://localhost:5173`.
3. Escolha se o cadastro exige confirmação de e-mail. Se estiver habilitada, confirme o endereço antes do primeiro login.
4. Execute no SQL Editor a migração [`20261008131000_add_installment_columns.sql`](./supabase/migrations/20261008131000_add_installment_columns.sql) para adicionar as colunas de parcelamento à tabela `lancamentos`.
5. Garanta que `lancamentos` tenha as colunas usadas pela aplicação, incluindo `user_id`.

> **Segurança:** nunca coloque uma chave `service_role` no frontend. Use somente a chave pública (`anon`/publishable) no `VITE_SUPABASE_ANON_KEY`. Configure RLS no Supabase para que cada usuário acesse apenas as próprias linhas (`user_id = auth.uid()`).

### Executar

```bash
npm run dev
```

O Vite exibirá o endereço local para abrir no navegador.

### Verificações

```bash
npm run lint
npm run build
```

## 🗂️ Estrutura

```text
src/
├── contexts/       # Contexto de autenticação
├── data/           # Categorias e dados iniciais
├── lib/            # Cliente Supabase
├── pages/          # Telas da aplicação
└── services/       # Persistência e exportação
supabase/
└── migrations/     # Migrações SQL
```

## 🔒 Dados e autenticação

- O Supabase Auth mantém e restaura a sessão do usuário.
- As páginas protegidas recebem a identidade pelo contexto `useAuth`.
- Os lançamentos são consultados no Supabase filtrando pelo usuário autenticado e são salvos com seu `user_id`.
- A autorização definitiva dos dados deve ser garantida pelas políticas RLS no banco; filtros da interface não substituem essas políticas.

## 🧭 Próximas melhorias

- Recuperação de senha
- Metas e notificações financeiras
- Aprimoramentos de orçamento e dashboard
- Experiência mobile

## 👨‍💻 Autor

**Matheus Gabriel Silva de Andrade**

Projeto desenvolvido para estudos e portfólio, com foco em React, Supabase e aplicações web.

---

<div align="center">

Feito com 💜 para deixar as finanças mais organizadas.

</div>
