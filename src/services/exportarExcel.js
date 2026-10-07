import * as XLSX from "xlsx-js-style";
import { categorias, limitesMensaisSugeridos, normalizarCategoria } from "../data/categorias";

const formatoMoeda = '"R$" #,##0.00';
const formatoPercentual = "0.0%";
const estiloTitulo = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
  fill: { patternType: "solid", fgColor: { rgb: "17365D" } },
  alignment: { vertical: "center" },
};
const estiloSubtitulo = {
  font: { color: { rgb: "53657A" }, italic: true, sz: 10 },
};
const estiloCabecalho = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
  fill: { patternType: "solid", fgColor: { rgb: "4472C4" } },
  alignment: { vertical: "center", wrapText: true },
};
function emCentavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarMes(data) {
  if (!data) return "";
  const [ano, numeroMes] = data.split("-").map(Number);
  const mesAbreviado = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  }).format(new Date(ano, numeroMes - 1, 1));
  return `${mesAbreviado.replace(".", "")}/${ano}`;
}

function obterPeriodo(mes) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(ano, numeroMes, 0).getDate();
  return {
    inicio: `${mes}-01`,
    fim: `${mes}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

function criarPlanilha({
  titulo,
  subtitulo,
  periodo,
  cabecalhos,
  linhas,
  larguras,
  colunasMoeda = [],
  colunasPercentual = [],
  colunasData = [],
}) {
  const dados = [
    [titulo],
    [subtitulo],
    [],
    ["Período", formatarData(periodo.inicio), "a", formatarData(periodo.fim)],
    [],
    cabecalhos,
    ...linhas,
  ];
  const planilha = XLSX.utils.aoa_to_sheet(dados);
  const ultimaColuna = cabecalhos.length - 1;
  const primeiraLinhaTabela = 5;
  const ultimaLinha = dados.length - 1;

  planilha["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: ultimaColuna } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: ultimaColuna } },
  ];
  planilha["!cols"] = larguras.map((wch) => ({ wch }));
  planilha["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: primeiraLinhaTabela, c: 0 },
      e: { r: ultimaLinha, c: ultimaColuna },
    }),
  };
  planilha["!rows"] = [{ hpt: 28 }, { hpt: 20 }, { hpt: 8 }, { hpt: 20 }, { hpt: 8 }, { hpt: 30 }];

  for (let coluna = 0; coluna <= ultimaColuna; coluna += 1) {
    const tituloCelula = XLSX.utils.encode_cell({ r: 0, c: coluna });
    const subtituloCelula = XLSX.utils.encode_cell({ r: 1, c: coluna });
    if (planilha[tituloCelula]) planilha[tituloCelula].s = estiloTitulo;
    if (planilha[subtituloCelula]) planilha[subtituloCelula].s = estiloSubtitulo;
    const cabecalhoCelula = XLSX.utils.encode_cell({
      r: primeiraLinhaTabela,
      c: coluna,
    });
    if (planilha[cabecalhoCelula]) planilha[cabecalhoCelula].s = estiloCabecalho;
  }

  colunasData.forEach((coluna) => {
    for (let linha = primeiraLinhaTabela + 1; linha <= ultimaLinha; linha += 1) {
      const celula = planilha[XLSX.utils.encode_cell({ r: linha, c: coluna })];
      if (celula) celula.z = "dd/mm/yyyy";
    }
  });
  ["B4", "D4"].forEach((endereco) => {
    if (planilha[endereco]) planilha[endereco].z = "dd/mm/yyyy";
  });

  for (let linha = primeiraLinhaTabela + 1; linha <= ultimaLinha; linha += 1) {
    for (let coluna = 0; coluna <= ultimaColuna; coluna += 1) {
      const endereco = XLSX.utils.encode_cell({ r: linha, c: coluna });
      const celula = planilha[endereco];
      if (!celula) continue;
      celula.s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: linha % 2 === 0 ? "EAF3F8" : "FFFFFF" },
        },
        alignment: { vertical: "center" },
      };
    }
  }

  colunasMoeda.forEach((coluna) => {
    for (let linha = primeiraLinhaTabela + 1; linha <= ultimaLinha; linha += 1) {
      const celula = planilha[XLSX.utils.encode_cell({ r: linha, c: coluna })];
      if (celula && typeof celula.v === "number") celula.z = formatoMoeda;
    }
  });
  colunasPercentual.forEach((coluna) => {
    for (let linha = primeiraLinhaTabela + 1; linha <= ultimaLinha; linha += 1) {
      const celula = planilha[XLSX.utils.encode_cell({ r: linha, c: coluna })];
      if (celula && typeof celula.v === "number") celula.z = formatoPercentual;
    }
  });

  return planilha;
}

function criarPlanilhaResumo({
  periodo,
  lancamentosDoMes,
  meta,
}) {
  const receitas = lancamentosDoMes
    .filter((lancamento) => lancamento.tipo === "Receita")
    .reduce((total, lancamento) => total + emCentavos(lancamento.valor), 0);
  const despesas = lancamentosDoMes
    .filter((lancamento) => lancamento.tipo === "Despesa")
    .reduce((total, lancamento) => total + emCentavos(lancamento.valor), 0);
  const despesasDoMes = lancamentosDoMes.filter(
    (lancamento) => lancamento.tipo === "Despesa",
  );
  const maiorDespesa = despesasDoMes.reduce(
    (maior, lancamento) => Math.max(maior, emCentavos(lancamento.valor)),
    0,
  );
  const porCategoria = despesasDoMes.reduce((totais, lancamento) => {
    const categoria =
      categorias.find(
        (item) =>
          normalizarCategoria(item) ===
          normalizarCategoria(lancamento.categoria),
      ) || lancamento.categoria;
    totais[categoria] = (totais[categoria] || 0) + emCentavos(lancamento.valor);
    return totais;
  }, {});
  const categoriaMaisUtilizada = despesasDoMes.reduce((maisUsada, lancamento) => {
    const categoria =
      categorias.find(
        (item) =>
          normalizarCategoria(item) ===
          normalizarCategoria(lancamento.categoria),
      ) || lancamento.categoria;
    maisUsada[categoria] = (maisUsada[categoria] || 0) + 1;
    return maisUsada;
  }, {});
  const categoriaTop = Object.entries(categoriaMaisUtilizada).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const quantidade = lancamentosDoMes.length;
  const saldo = receitas - despesas;
  const metaCentavos = emCentavos(meta);
  const progressoMeta = metaCentavos > 0 ? Math.max(0, saldo) / metaCentavos : 0;
  const linhas = [
    ["Receitas", receitas / 100],
    ["Despesas", despesas / 100],
    ["Saldo do período", saldo / 100],
    ["Quantidade de lançamentos", quantidade],
    [
      "Ticket médio de despesas",
      despesasDoMes.length ? despesas / despesasDoMes.length / 100 : 0,
    ],
    ["Maior despesa", maiorDespesa / 100],
    ["Categoria mais utilizada", categoriaTop?.[0] || "Nenhuma"],
    ["Lançamentos na categoria mais utilizada", categoriaTop?.[1] || 0],
    ["Meta de economia", metaCentavos / 100],
    ["Progresso da meta", progressoMeta],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["CONTROLE FINANCEIRO"],
    ["Visão automática das receitas, despesas e saldo do período selecionado"],
    [],
    ["Período", formatarData(periodo.inicio), "a", formatarData(periodo.fim)],
    [],
    ["Indicador", "Valor"],
    ...linhas,
    [],
    ["Despesas por categoria"],
    ["Categoria", "Despesas"],
    ...categorias.map((categoria) => [
      categoria,
      (porCategoria[categoria] || 0) / 100,
    ]),
  ]);

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
  ];
  worksheet["!cols"] = [{ wch: 38 }, { wch: 22 }, { wch: 5 }, { wch: 20 }];
  worksheet["!rows"] = [{ hpt: 30 }, { hpt: 22 }];
  worksheet.B4.z = "dd/mm/yyyy";
  worksheet.D4.z = "dd/mm/yyyy";

  ["A1", "B1"].forEach((cell) => {
    if (worksheet[cell]) worksheet[cell].s = estiloTitulo;
  });
  ["A2", "B2"].forEach((cell) => {
    if (worksheet[cell]) worksheet[cell].s = estiloSubtitulo;
  });
  ["A6", "B6", "A19", "B19"].forEach((cell) => {
    if (worksheet[cell]) worksheet[cell].s = estiloCabecalho;
  });
  for (let linha = 6; linha <= 16; linha += 1) {
    const label = worksheet[`A${linha}`];
    const valor = worksheet[`B${linha}`];
    if (label) label.s = { fill: { patternType: "solid", fgColor: { rgb: "DDEBF7" } } };
    if (valor && [7, 8, 9, 11, 12, 15].includes(linha)) {
      valor.z = formatoMoeda;
    }
    if (valor && linha === 16) valor.z = formatoPercentual;
  }
  for (let linha = 20; linha < 20 + categorias.length; linha += 1) {
    const celula = worksheet[`B${linha}`];
    if (celula) celula.z = formatoMoeda;
  }
  worksheet["!autofilter"] = { ref: `A19:B${19 + categorias.length}` };
  return worksheet;
}

export function criarWorkbookFinanceiro({
  lancamentos,
  orcamentos,
  cartoes,
  centrosDeCusto,
  metasEconomia,
  mesSelecionado,
}) {
  const periodo = obterPeriodo(mesSelecionado);
  const lancamentosDoMes = lancamentos.filter((lancamento) =>
    lancamento.data.startsWith(mesSelecionado),
  );
  const despesasDoMes = lancamentosDoMes.filter(
    (lancamento) => lancamento.tipo === "Despesa",
  );
  const workbook = XLSX.utils.book_new();

  const linhasLancamentos = [...lancamentos]
    .sort((a, b) => a.data.localeCompare(b.data) || a.idTransacao - b.idTransacao)
    .map((lancamento) => [
      lancamento.idTransacao,
      formatarData(lancamento.data),
      formatarMes(lancamento.data),
      lancamento.descricao,
      lancamento.categoria,
      lancamento.subcategoria || "",
      lancamento.tipo,
      Number(lancamento.valor || 0),
      lancamento.formaPagamento ||
        (lancamento.cartaoId
          ? "Crédito"
          : lancamento.tipo === "Receita"
            ? "Transferência"
            : "Não informado"),
      cartoes.find((cartao) => cartao.id === lancamento.cartaoId)?.nome || "",
      lancamento.parcelaAtual || "",
      lancamento.totalParcelas || "",
    ]);
  const sheetLancamentos = criarPlanilha({
    titulo: "LANÇAMENTOS",
    subtitulo: "Histórico de receitas e despesas cadastradas",
    periodo,
    cabecalhos: [
      "ID da Transação",
      "Data",
      "Mês",
      "Descrição",
      "Categoria",
      "Subcategoria",
      "Tipo",
      "Valor",
      "Forma Pagamento",
      "Cartão",
      "Parcela Atual",
      "Total de Parcelas",
    ],
    linhas: linhasLancamentos,
    larguras: [16, 13, 12, 30, 18, 20, 12, 16, 19, 16, 15, 18],
    colunasMoeda: [7],
    colunasData: [1],
  });
  sheetLancamentos["!autofilter"].ref = `A6:L${Math.max(6, linhasLancamentos.length + 5)}`;

  const limites = orcamentos[mesSelecionado] || limitesMensaisSugeridos;
  const gastoPorCategoria = despesasDoMes.reduce((resultado, lancamento) => {
    const categoria = categorias.find(
      (item) =>
        normalizarCategoria(item) ===
        normalizarCategoria(lancamento.categoria),
    );
    if (categoria) {
      resultado[categoria] =
        (resultado[categoria] || 0) + emCentavos(lancamento.valor);
    }
    return resultado;
  }, {});
  const linhasOrcamento = categorias.map((categoria) => {
    const limite = categoria === "Renda" ? 0 : emCentavos(limites[categoria]);
    const gasto = gastoPorCategoria[categoria] || 0;
    const percentual = limite > 0 ? gasto / limite : 0;
    const status =
      categoria === "Renda"
        ? "Não aplicável"
        : limite === 0 && gasto === 0
          ? "Sem limite"
          : gasto > limite
            ? "Acima do limite"
            : percentual >= 0.8
              ? "Atenção"
              : "Dentro do limite";
    return [categoria, limite / 100, gasto / 100, (limite - gasto) / 100, percentual, status];
  });
  const sheetOrcamento = criarPlanilha({
    titulo: "ORÇAMENTO POR CATEGORIA",
    subtitulo: "Limites mensais e acompanhamento automático dos gastos",
    periodo,
    cabecalhos: [
      "Categoria",
      "Limite Mensal",
      "Gasto Realizado",
      "Saldo Disponível",
      "% Utilizado",
      "Status",
    ],
    linhas: linhasOrcamento,
    larguras: [20, 18, 19, 19, 15, 20],
    colunasMoeda: [1, 2, 3],
    colunasPercentual: [4],
  });
  sheetOrcamento["!autofilter"].ref = `A6:F${5 + linhasOrcamento.length}`;

  const gastosPorCartao = despesasDoMes.reduce((resultado, lancamento) => {
    if (!lancamento.cartaoId) return resultado;
    resultado[lancamento.cartaoId] =
      (resultado[lancamento.cartaoId] || 0) + emCentavos(lancamento.valor);
    return resultado;
  }, {});
  const linhasCartoes = cartoes.map((cartao) => {
    const limite = emCentavos(cartao.limite);
    const gasto = gastosPorCartao[cartao.id] || 0;
    const percentual = limite > 0 ? gasto / limite : 0;
    const status =
      limite === 0
        ? "Definir limite"
        : gasto > limite
          ? "Acima do limite"
          : percentual >= 0.8
            ? "Atenção"
            : "Dentro do limite";
    return [
      cartao.banco,
      cartao.nome,
      limite / 100,
      cartao.fechamento || "",
      cartao.vencimento || "",
      gasto / 100,
      (limite - gasto) / 100,
      percentual,
      status,
    ];
  });
  const despesasSemCartao = despesasDoMes.filter(
    (lancamento) => !cartoes.some((cartao) => cartao.id === lancamento.cartaoId),
  );
  const sheetCartoes = criarPlanilha({
    titulo: "CONTROLE DE CARTÕES",
    subtitulo: "Cadastro, limites e gastos por cartão no período selecionado",
    periodo,
    cabecalhos: [
      "Banco",
      "Cartão",
      "Limite",
      "Dia Fechamento",
      "Dia Vencimento",
      "Gasto no Período",
      "Limite Disponível",
      "% Utilizado",
      "Status",
    ],
    linhas: [
      ...linhasCartoes,
      [],
      ["Cartões cadastrados", cartoes.length],
      [
        "Gastos vinculados",
        Object.values(gastosPorCartao).reduce((total, valor) => total + valor, 0) / 100,
      ],
      ["Despesas sem cartão", despesasSemCartao.length],
    ],
    larguras: [17, 17, 17, 18, 18, 20, 20, 15, 20],
    colunasMoeda: [2, 5, 6],
    colunasPercentual: [7],
  });
  sheetCartoes["!autofilter"].ref = `A6:I${5 + linhasCartoes.length}`;

  const comprasParceladas = lancamentos
    .filter(
      (lancamento) =>
        lancamento.tipo === "Despesa" && lancamento.cartaoId,
    )
    .map((lancamento) => {
      const totalParcelas = Math.max(1, Number(lancamento.totalParcelas) || 1);
      const parcelaAtual = Math.min(
        totalParcelas,
        Math.max(1, Number(lancamento.parcelaAtual) || 1),
      );
      const valorTotal = emCentavos(lancamento.valor);
      const valorParcela = Math.round(valorTotal / totalParcelas);
      const restantes = totalParcelas - parcelaAtual;
      return {
        lancamento,
        totalParcelas,
        parcelaAtual,
        valorTotal,
        valorParcela,
        restantes,
        saldoRestante: Math.max(0, valorTotal - valorParcela * parcelaAtual),
      };
    });
  const linhasParcelamentos = comprasParceladas.map((compra) => [
    compra.lancamento.idTransacao,
    formatarData(compra.lancamento.data),
    compra.lancamento.descricao,
    cartoes.find((cartao) => cartao.id === compra.lancamento.cartaoId)?.nome || "Cartão removido",
    compra.valorTotal / 100,
    `${compra.parcelaAtual} de ${compra.totalParcelas}`,
    compra.totalParcelas,
    compra.valorParcela / 100,
    compra.restantes,
  ]);
  const sheetParcelamentos = criarPlanilha({
    titulo: "CONTROLE DE PARCELAMENTOS",
    subtitulo: "Acompanhamento das compras parceladas registradas nos lançamentos",
    periodo,
    cabecalhos: [
      "ID",
      "Data",
      "Descrição",
      "Cartão",
      "Valor Total",
      "Parcela Atual",
      "Total Parcelas",
      "Valor da Parcela",
      "Parcelas Restantes",
    ],
    linhas: [
      ...linhasParcelamentos,
      [],
      ["Parcelamentos ativos", comprasParceladas.filter((compra) => compra.restantes > 0).length],
      ["Valor total", comprasParceladas.reduce((total, compra) => total + compra.valorTotal, 0) / 100],
      ["Saldo a parcelar", comprasParceladas.reduce((total, compra) => total + compra.saldoRestante, 0) / 100],
    ],
    larguras: [12, 13, 30, 18, 17, 18, 18, 19, 20],
    colunasMoeda: [4, 7],
    colunasData: [1],
  });
  sheetParcelamentos["!autofilter"].ref = `A6:I${5 + linhasParcelamentos.length}`;

  const linhasCentros = centrosDeCusto.map((centro) => {
    const relacionados = despesasDoMes.filter(
      (lancamento) =>
        normalizarCategoria(lancamento.categoria) ===
          normalizarCategoria(centro.categoria) &&
        normalizarCategoria(lancamento.subcategoria || "") ===
          normalizarCategoria(centro.subcategoria),
    );
    const total = relacionados.reduce(
      (soma, lancamento) => soma + emCentavos(lancamento.valor),
      0,
    );
    return [centro.categoria, centro.subcategoria, relacionados.length, total / 100];
  });
  const sheetCentros = criarPlanilha({
    titulo: "CENTROS DE CUSTO",
    subtitulo: "Cadastro de categorias e subcategorias para classificação dos lançamentos",
    periodo,
    cabecalhos: ["Categoria", "Subcategoria", "Lançamentos", "Total de Despesas"],
    linhas: linhasCentros,
    larguras: [23, 27, 18, 22],
    colunasMoeda: [3],
  });
  sheetCentros["!autofilter"].ref = `A6:D${Math.max(6, 5 + linhasCentros.length)}`;

  const meta = metasEconomia[mesSelecionado] || 0;
  XLSX.utils.book_append_sheet(
    workbook,
    criarPlanilhaResumo({
      periodo,
      lancamentosDoMes,
      meta,
    }),
    "Resumo",
  );
  XLSX.utils.book_append_sheet(workbook, sheetLancamentos, "Lançamentos");
  XLSX.utils.book_append_sheet(workbook, sheetOrcamento, "Orçamento");
  XLSX.utils.book_append_sheet(workbook, sheetCartoes, "Cartões");
  XLSX.utils.book_append_sheet(workbook, sheetParcelamentos, "Parcelamentos");
  XLSX.utils.book_append_sheet(workbook, sheetCentros, "Centros de Custo");

  return workbook;
}

export function exportarDadosParaExcel(dados) {
  const workbook = criarWorkbookFinanceiro(dados);
  const nomeArquivo = `controle-financeiro-${dados.mesSelecionado}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo, { compression: true });
  return nomeArquivo;
}
