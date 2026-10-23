const FORMATO_BACKUP = "meu-financeiro-backup";
const VERSAO_BACKUP = 1;

function ehObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function validarData(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }
  const [ano, mes, dia] = data.split("-").map(Number);
  const dataValidada = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    dataValidada.getUTCFullYear() === ano &&
    dataValidada.getUTCMonth() === mes - 1 &&
    dataValidada.getUTCDate() === dia
  );
}

function validarMes(mes) {
  return typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

function validarValoresMensais(valores, validarValor) {
  return (
    ehObjeto(valores) &&
    Object.entries(valores).every(
      ([mes, valor]) => validarMes(mes) && validarValor(valor),
    )
  );
}

function validarLancamento(lancamento) {
  if (!ehObjeto(lancamento)) return false;
  const parcelasValidas =
    (lancamento.parcelaAtual === undefined &&
      lancamento.totalParcelas === undefined) ||
    (Number.isInteger(lancamento.parcelaAtual) &&
      Number.isInteger(lancamento.totalParcelas) &&
      lancamento.parcelaAtual >= 1 &&
      lancamento.totalParcelas >= lancamento.parcelaAtual);

  return (
    Number.isSafeInteger(lancamento.idTransacao) &&
    lancamento.idTransacao > 0 &&
    validarData(lancamento.data) &&
    typeof lancamento.descricao === "string" &&
    lancamento.descricao.trim().length > 0 &&
    typeof lancamento.categoria === "string" &&
    lancamento.categoria.trim().length > 0 &&
    ["Despesa", "Receita"].includes(lancamento.tipo) &&
    typeof lancamento.formaPagamento === "string" &&
    Number.isFinite(lancamento.valor) &&
    lancamento.valor > 0 &&
    (lancamento.subcategoria === undefined ||
      typeof lancamento.subcategoria === "string") &&
    (lancamento.cartaoId === undefined ||
      typeof lancamento.cartaoId === "string") &&
    parcelasValidas
  );
}

function validarCartao(cartao) {
  const diaValido = (dia) =>
    dia === "" || (Number.isInteger(dia) && dia >= 1 && dia <= 31);

  return (
    ehObjeto(cartao) &&
    typeof cartao.id === "string" &&
    cartao.id.length > 0 &&
    typeof cartao.banco === "string" &&
    cartao.banco.trim().length > 0 &&
    typeof cartao.nome === "string" &&
    cartao.nome.trim().length > 0 &&
    Number.isFinite(cartao.limite) &&
    cartao.limite >= 0 &&
    diaValido(cartao.fechamento) &&
    diaValido(cartao.vencimento)
  );
}

function normalizarLancamento(lancamento) {
  return Object.fromEntries(
    Object.entries(lancamento).filter(([campo]) => campo !== "supabaseId"),
  );
}

export function validarBackupJson(valor) {
  let backup;
  try {
    backup = typeof valor === "string" ? JSON.parse(valor) : valor;
  } catch {
    throw new Error("O arquivo selecionado não contém um JSON válido.");
  }

  if (
    !ehObjeto(backup) ||
    backup.formato !== FORMATO_BACKUP ||
    backup.versao !== VERSAO_BACKUP ||
    !ehObjeto(backup.dados)
  ) {
    throw new Error(
      "Este arquivo não é um backup compatível do Meu Financeiro.",
    );
  }

  const { dados } = backup;
  const idsLancamentos = new Set();
  const idsCartoes = new Set();
  const lancamentosValidos =
    Array.isArray(dados.lancamentos) &&
    dados.lancamentos.every((lancamento) => {
      if (!validarLancamento(lancamento)) return false;
      if (idsLancamentos.has(lancamento.idTransacao)) return false;
      idsLancamentos.add(lancamento.idTransacao);
      return true;
    });
  const cartoesValidos =
    Array.isArray(dados.cartoes) &&
    dados.cartoes.every((cartao) => {
      if (!validarCartao(cartao) || idsCartoes.has(cartao.id)) return false;
      idsCartoes.add(cartao.id);
      return true;
    });
  const centrosValidos =
    Array.isArray(dados.centrosDeCusto) &&
    dados.centrosDeCusto.every(
      (centro) =>
        ehObjeto(centro) &&
        typeof centro.categoria === "string" &&
        centro.categoria.trim().length > 0 &&
        typeof centro.subcategoria === "string" &&
        centro.subcategoria.trim().length > 0,
    );
  const orcamentosValidos = validarValoresMensais(
    dados.orcamentos,
    (limites) =>
      ehObjeto(limites) &&
      Object.values(limites).every(
        (limite) => Number.isFinite(limite) && limite >= 0,
      ),
  );
  const metasValidas = validarValoresMensais(
    dados.metasEconomia,
    (meta) => Number.isFinite(meta) && meta >= 0,
  );

  if (
    !lancamentosValidos ||
    !cartoesValidos ||
    !centrosValidos ||
    !orcamentosValidos ||
    !metasValidas ||
    !["claro", "escuro"].includes(dados.tema)
  ) {
    throw new Error(
      "O backup contém dados inválidos ou incompletos. Nenhuma alteração foi feita.",
    );
  }

  return {
    ...backup,
    dados: {
      ...dados,
      lancamentos: dados.lancamentos.map(normalizarLancamento),
    },
  };
}
