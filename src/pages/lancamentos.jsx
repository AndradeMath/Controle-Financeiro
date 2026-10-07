import { useState } from "react";
import { salvarLancamentos } from "../services/storage";
import { categorias } from "../data/categorias";
import "./lancamentos.css";

function formatarData(data) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${data}T00:00:00`));
}

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function Lancamentos({
  lancamentos,
  cartoes,
  mesSelecionado,
  onLancamentosChange,
}) {
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [tipo, setTipo] = useState("Despesa");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function adicionarLancamento(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const valorNumerico = Number(valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    const descricaoLimpa = descricao.trim();
    const categoriaLimpa = categoria.trim();
    if (!descricaoLimpa || !categoriaLimpa) {
      setErro("Preencha a descrição e a categoria do lançamento.");
      return;
    }

    const novoLancamento = {
      data,
      descricao: descricaoLimpa,
      categoria: categoriaLimpa,
      tipo,
      valor: valorNumerico,
      ...(tipo === "Despesa" && cartaoId ? { cartaoId } : {}),
    };
    const novaLista = [...lancamentos, novoLancamento];

    try {
      salvarLancamentos(novaLista);
    } catch {
      setErro("Não foi possível salvar o lançamento. Tente novamente.");
      return;
    }

    onLancamentosChange(novaLista);
    setData("");
    setDescricao("");
    setCategoria("");
    setCartaoId("");
    setTipo("Despesa");
    setValor("");
    setSucesso("Lançamento salvo com sucesso.");
  }

  function excluirLancamento(indice) {
    const lancamento = lancamentos[indice];
    const confirmado = window.confirm(
      `Deseja excluir o lançamento "${lancamento.descricao}"?`,
    );

    if (!confirmado) return;

    const novaLista = lancamentos.filter((_, itemIndice) => itemIndice !== indice);

    try {
      salvarLancamentos(novaLista);
    } catch {
      setErro("Não foi possível excluir o lançamento. Tente novamente.");
      setSucesso("");
      return;
    }

    onLancamentosChange(novaLista);
    setErro("");
    setSucesso("Lançamento excluído com sucesso.");
  }

  const lancamentosDoMes = lancamentos
    .map((lancamento, indiceOriginal) => ({ lancamento, indiceOriginal }))
    .filter(({ lancamento }) => lancamento.data.startsWith(mesSelecionado))
    .reverse();

  return (
    <main className="lancamentos">
      <header className="lancamentos__cabecalho">
        <p className="lancamentos__identificacao">CONTROLE FINANCEIRO</p>
        <h1>Lançamentos</h1>
        <p>Registre suas receitas e despesas em um só lugar.</p>
      </header>

      <section className="lancamentos__painel" aria-labelledby="form-titulo">
        <h2 id="form-titulo">Novo lançamento</h2>
        <form className="lancamentos__formulario" onSubmit={adicionarLancamento}>
          <label>
            Descrição
            <input
              type="text"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Ex.: Compra no mercado"
              required
            />
          </label>

          <label>
            Categoria
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              required
            >
              <option value="" disabled>Selecione uma categoria</option>
              {categorias.map((opcao) => (
                <option key={opcao} value={opcao}>{opcao}</option>
              ))}
            </select>
          </label>

          <label>
            Data
            <input
              type="date"
              value={data}
              onChange={(event) => setData(event.target.value)}
              required
            />
          </label>

          <label>
            Tipo
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
            >
              <option value="Despesa">Despesa</option>
              <option value="Receita">Receita</option>
            </select>
          </label>

          {tipo === "Despesa" && (
            <label>
              Cartão utilizado (opcional)
              <select
                value={cartaoId}
                onChange={(event) => setCartaoId(event.target.value)}
              >
                <option value="">Sem cartão</option>
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={cartao.id}>
                    {cartao.nome} ({cartao.banco})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Valor (R$)
            <input
              type="number"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="0,00"
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <button type="submit">Salvar lançamento</button>
        </form>
        {erro && <p className="lancamentos__mensagem lancamentos__mensagem--erro" role="alert">{erro}</p>}
        {sucesso && <p className="lancamentos__mensagem lancamentos__mensagem--sucesso" role="status">{sucesso}</p>}
      </section>

      <section className="lancamentos__painel" aria-labelledby="lista-titulo">
        <div className="lancamentos__lista-cabecalho">
          <h2 id="lista-titulo">Lançamentos do mês</h2>
          <span>{lancamentosDoMes.length} {lancamentosDoMes.length === 1 ? "registro" : "registros"}</span>
        </div>
        {lancamentosDoMes.length === 0 ? (
          <p className="lancamentos__vazio">Não há lançamentos no mês selecionado.</p>
        ) : (
          <ul className="lancamentos__lista">
            {lancamentosDoMes.map(({ lancamento, indiceOriginal }) => {
              return (
                <li className="lancamentos__item" key={`${lancamento.data}-${lancamento.descricao}-${indiceOriginal}`}>
                  <div>
                    <strong>{lancamento.descricao}</strong>
                    <span>
                      {lancamento.categoria} · {formatarData(lancamento.data)}
                      {lancamento.cartaoId && ` · ${cartoes.find((cartao) => cartao.id === lancamento.cartaoId)?.nome || "Cartão"}`}
                    </span>
                  </div>
                  <div className="lancamentos__acoes">
                    <strong className={`lancamentos__valor lancamentos__valor--${lancamento.tipo === "Receita" ? "receita" : "despesa"}`}>
                      {lancamento.tipo === "Receita" ? "+" : "−"} {formatarValor(lancamento.valor)}
                    </strong>
                    <button
                      className="lancamentos__excluir"
                      type="button"
                      aria-label={`Excluir lançamento ${lancamento.descricao}`}
                      onClick={() => excluirLancamento(indiceOriginal)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

export default Lancamentos;
