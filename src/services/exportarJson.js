const VERSAO_FORMATO_BACKUP = 1;

function criarNomeArquivo(data) {
  return `backup-financeiro-${data.toISOString().slice(0, 10)}.json`;
}

export function exportarDadosParaJson(dados) {
  const dataExportacao = new Date();
  const backup = {
    formato: "meu-financeiro-backup",
    versao: VERSAO_FORMATO_BACKUP,
    exportadoEm: dataExportacao.toISOString(),
    dados: {
      lancamentos: dados.lancamentos.map(
        (lancamento) =>
          Object.fromEntries(
            Object.entries(lancamento).filter(([campo]) => campo !== "supabaseId"),
          ),
      ),
      orcamentos: dados.orcamentos,
      cartoes: dados.cartoes,
      centrosDeCusto: dados.centrosDeCusto,
      metasEconomia: dados.metasEconomia,
      tema: dados.tema,
    },
  };
  const arquivo = new Blob([`${JSON.stringify(backup, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  const nomeArquivo = criarNomeArquivo(dataExportacao);

  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  return nomeArquivo;
}
