import { cartoesIniciais } from "../data/cartoes";

export const centrosDeCustoIniciais = [
  { categoria: "Alimentação", subcategoria: "Mercado" },
  { categoria: "Alimentação", subcategoria: "Restaurante" },
  { categoria: "Transporte", subcategoria: "Uber" },
  { categoria: "Transporte", subcategoria: "Combustível" },
];

export function carregarLancamentos() {
  const dados = localStorage.getItem("lancamentos");

  if (!dados) return [];

  const lancamentos = JSON.parse(dados);
  if (!Array.isArray(lancamentos)) {
    throw new Error("Os lançamentos salvos possuem um formato inválido.");
  }

  const idsNumericos = lancamentos
    .map((lancamento) => Number(lancamento.idTransacao))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  let proximoId = idsNumericos.reduce(
    (maiorId, id) => Math.max(maiorId, id),
    0,
  ) + 1;
  const idsUtilizados = new Set();
  let houveAlteracao = false;

  const lancamentosComIds = lancamentos.map((lancamento) => {
    const id = Number(lancamento.idTransacao);
    if (
      Number.isSafeInteger(id) &&
      id > 0 &&
      !idsUtilizados.has(id)
    ) {
      idsUtilizados.add(id);
      return lancamento;
    }

    while (idsUtilizados.has(proximoId)) proximoId += 1;
    const atualizado = { ...lancamento, idTransacao: proximoId };
    idsUtilizados.add(proximoId);
    proximoId += 1;
    houveAlteracao = true;
    return atualizado;
  });

  if (houveAlteracao) salvarLancamentos(lancamentosComIds);
  return lancamentosComIds;
}

export function salvarLancamentos(lancamentos) {
  localStorage.setItem(
    "lancamentos",
    JSON.stringify(lancamentos)
  );
}

export function carregarOrcamentos() {
  const dados = localStorage.getItem("orcamentos");

  return dados ? JSON.parse(dados) : {};
}

export function salvarOrcamentos(orcamentos) {
  localStorage.setItem("orcamentos", JSON.stringify(orcamentos));
}

export function carregarCartoes() {
  const dados = localStorage.getItem("cartoes");

  return dados ? JSON.parse(dados) : cartoesIniciais;
}

export function salvarCartoes(cartoes) {
  localStorage.setItem("cartoes", JSON.stringify(cartoes));
}

export function carregarMetasEconomia() {
  const dados = localStorage.getItem("metasEconomia");

  return dados ? JSON.parse(dados) : {};
}

export function salvarMetasEconomia(metas) {
  localStorage.setItem("metasEconomia", JSON.stringify(metas));
}

export function carregarCentrosDeCusto() {
  const dados = localStorage.getItem("centrosDeCusto");
  return dados ? JSON.parse(dados) : centrosDeCustoIniciais;
}

export function salvarCentrosDeCusto(centros) {
  localStorage.setItem("centrosDeCusto", JSON.stringify(centros));
}