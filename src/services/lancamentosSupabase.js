import { supabase } from "../lib/supabase";

export async function carregarLancamentosDoUsuario(usuarioId) {
  const { data, error } = await supabase
    .from("lancamentos")
    .select("*")
    .eq("user_id", usuarioId)
    .order("data", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Não foi possível carregar seus lançamentos: ${error.message}`);
  }

  return data.map((lancamento, indice) => ({
    idTransacao: Number(lancamento.id) || indice + 1,
    supabaseId: lancamento.id,
    data: String(lancamento.data).slice(0, 10),
    descricao: lancamento.descricao,
    categoria: lancamento.categoria,
    ...(lancamento.subcategoria
      ? { subcategoria: lancamento.subcategoria }
      : {}),
    tipo: lancamento.tipo,
    formaPagamento: lancamento.forma_pagamento || "Não informado",
    valor: Number(lancamento.valor),
    ...(lancamento.cartao ? { cartaoId: lancamento.cartao } : {}),
    ...(lancamento.parcelaAtual != null
      ? { parcelaAtual: Number(lancamento.parcelaAtual) }
      : {}),
    ...(lancamento.totalParcelas != null
      ? { totalParcelas: Number(lancamento.totalParcelas) }
      : {}),
  }));
}
