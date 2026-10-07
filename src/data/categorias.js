export const categorias = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Renda",
  "Outros",
];

export const limitesMensaisSugeridos = {
  "Alimentação": 1000,
  "Moradia": 2000,
  "Transporte": 600,
  "Saúde": 500,
  "Educação": 500,
  "Lazer": 400,
  "Renda": 0,
  "Outros": 300,
};

export function normalizarCategoria(categoria = "") {
  return categoria
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
