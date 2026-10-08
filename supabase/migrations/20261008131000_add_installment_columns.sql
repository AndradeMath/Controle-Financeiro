alter table public.lancamentos
  add column if not exists "parcelaAtual" integer,
  add column if not exists "totalParcelas" integer;
