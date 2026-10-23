import { supabase } from "../lib/supabase";
import { validarBackupJson } from "./validarBackupJson";

const TAMANHO_LOTE = 500;
const CHAVES_LOCAL_STORAGE = [
  "orcamentos",
  "cartoes",
  "centrosDeCusto",
  "metasEconomia",
  "tema",
];

function converterLancamentoParaSupabase(lancamento, usuarioId) {
  return {
    user_id: usuarioId,
    descricao: lancamento.descricao,
    categoria: lancamento.categoria,
    subcategoria: lancamento.subcategoria || null,
    data: lancamento.data,
    tipo: lancamento.tipo,
    forma_pagamento: lancamento.formaPagamento,
    cartao: lancamento.cartaoId || null,
    valor: lancamento.valor,
    parcelaAtual: lancamento.parcelaAtual ?? null,
    totalParcelas: lancamento.totalParcelas ?? null,
  };
}

function assinaturaLancamento(lancamento) {
  return JSON.stringify({
    data: String(lancamento.data).slice(0, 10),
    descricao: lancamento.descricao,
    categoria: lancamento.categoria,
    subcategoria: lancamento.subcategoria || null,
    tipo: lancamento.tipo,
    forma_pagamento: lancamento.forma_pagamento,
    cartao: lancamento.cartao || null,
    valor: Number(lancamento.valor),
    parcelaAtual: lancamento.parcelaAtual ?? null,
    totalParcelas: lancamento.totalParcelas ?? null,
  });
}

async function removerLancamentosImportados(usuarioId, ids) {
  for (let indice = 0; indice < ids.length; indice += TAMANHO_LOTE) {
    const lote = ids.slice(indice, indice + TAMANHO_LOTE);
    const { error } = await supabase
      .from("lancamentos")
      .delete()
      .eq("user_id", usuarioId)
      .in("id", lote);
    if (error) throw new Error(error.message);
  }
}

async function substituirLancamentos(usuarioId, lancamentos) {
  const idsImportados = [];
  const lancamentosPersistidos = new Map();

  try {
    for (
      let indice = 0;
      indice < lancamentos.length;
      indice += TAMANHO_LOTE
    ) {
      const lancamentosDoLote = lancamentos.slice(
        indice,
        indice + TAMANHO_LOTE,
      );
      const lote = lancamentosDoLote.map((lancamento) =>
        converterLancamentoParaSupabase(lancamento, usuarioId),
      );
      const originaisPorAssinatura = new Map();
      lote.forEach((registro, indiceRegistro) => {
        const assinatura = assinaturaLancamento(registro);
        const originais = originaisPorAssinatura.get(assinatura) || [];
        originais.push(lancamentosDoLote[indiceRegistro]);
        originaisPorAssinatura.set(assinatura, originais);
      });
      const { data, error } = await supabase
        .from("lancamentos")
        .insert(lote)
        .select("id, data, descricao, categoria, subcategoria, tipo, forma_pagamento, cartao, valor, parcelaAtual, totalParcelas");

      if (error) throw new Error(error.message);
      if (!Array.isArray(data)) {
        throw new Error("O banco não confirmou todos os lançamentos importados.");
      }
      idsImportados.push(...data.map((lancamento) => lancamento.id));
      if (data.length !== lote.length) {
        throw new Error("O banco não confirmou todos os lançamentos importados.");
      }
      for (const registro of data) {
        const assinatura = assinaturaLancamento(registro);
        const originais = originaisPorAssinatura.get(assinatura);
        const original = originais?.shift();
        if (!original) {
          throw new Error("Não foi possível associar os lançamentos importados.");
        }
        lancamentosPersistidos.set(original.idTransacao, {
          ...original,
          supabaseId: registro.id,
        });
      }
    }

    let consultaExclusao = supabase
      .from("lancamentos")
      .delete()
      .eq("user_id", usuarioId);
    if (idsImportados.length > 0) {
      consultaExclusao = consultaExclusao.not(
        "id",
        "in",
        `(${idsImportados.join(",")})`,
      );
    }
    const { error: erroExclusao } = await consultaExclusao;
    if (erroExclusao) throw new Error(erroExclusao.message);
  } catch (erro) {
    try {
      await removerLancamentosImportados(usuarioId, idsImportados);
    } catch (erroRollback) {
      throw new Error(
        `Falha ao restaurar lançamentos: ${erro.message}. Também não foi possível desfazer os novos registros: ${erroRollback.message}`,
        { cause: erroRollback },
      );
    }
    throw new Error(`Falha ao restaurar lançamentos: ${erro.message}`, {
      cause: erro,
    });
  }

  return lancamentos.map((lancamento) =>
    lancamentosPersistidos.get(lancamento.idTransacao),
  );
}

function salvarDadosLocais(dados) {
  const valoresNovos = {
    orcamentos: dados.orcamentos,
    cartoes: dados.cartoes,
    centrosDeCusto: dados.centrosDeCusto,
    metasEconomia: dados.metasEconomia,
    tema: dados.tema,
  };
  const valoresAnteriores = Object.fromEntries(
    CHAVES_LOCAL_STORAGE.map((chave) => [
      chave,
      localStorage.getItem(chave),
    ]),
  );

  try {
    for (const chave of CHAVES_LOCAL_STORAGE) {
      const valor = chave === "tema"
        ? valoresNovos[chave]
        : JSON.stringify(valoresNovos[chave]);
      localStorage.setItem(chave, valor);
    }
  } catch (erro) {
    try {
      for (const chave of CHAVES_LOCAL_STORAGE) {
        const valorAnterior = valoresAnteriores[chave];
        if (valorAnterior === null) localStorage.removeItem(chave);
        else localStorage.setItem(chave, valorAnterior);
      }
    } catch (erroRollback) {
      throw new Error(
        `Não foi possível salvar as configurações restauradas (${erro.message}) nem desfazer a gravação local (${erroRollback.message}).`,
        { cause: erroRollback },
      );
    }
    throw new Error(
      `Não foi possível salvar as configurações restauradas: ${erro.message}`,
      { cause: erro },
    );
  }

  return () => {
    for (const chave of CHAVES_LOCAL_STORAGE) {
      const valorAnterior = valoresAnteriores[chave];
      if (valorAnterior === null) localStorage.removeItem(chave);
      else localStorage.setItem(chave, valorAnterior);
    }
  };
}

export async function restaurarBackupJson(valor, usuarioId) {
  const backup = validarBackupJson(valor);
  if (!usuarioId) {
    throw new Error("Não foi possível identificar a conta para restaurar o backup.");
  }

  const reverterDadosLocais = salvarDadosLocais(backup.dados);
  let lancamentos;
  try {
    lancamentos = await substituirLancamentos(
      usuarioId,
      backup.dados.lancamentos,
    );
  } catch (erro) {
    try {
      reverterDadosLocais();
    } catch (erroRollback) {
      throw new Error(
        `${erro.message}. Também não foi possível restaurar as configurações locais anteriores: ${erroRollback.message}`,
        { cause: erroRollback },
      );
    }
    throw erro;
  }

  return {
    ...backup.dados,
    lancamentos,
  };
}
