import { cartoesIniciais } from "../data/cartoes";

export function carregarLancamentos() {
  const dados = localStorage.getItem("lancamentos");

  return dados ? JSON.parse(dados) : [];
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