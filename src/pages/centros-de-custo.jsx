import { useState } from "react";
import { categorias, normalizarCategoria } from "../data/categorias";
import "./centros-de-custo.css";

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarMes(mes) {
  if (!mes) return "";
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, numeroMes - 1, 1));
}

function CentrosDeCusto({
  centros,
  lancamentos,
  mesSelecionado,
  onMesChange,
  onCentrosChange,
}) {
  const [categoria, setCategoria] = useState(categorias[0]);
  const [subcategoria, setSubcategoria] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const linhas = centros.map((centro) => {
    const lancamentosRelacionados = lancamentos.filter(
      (lancamento) =>
        lancamento.tipo === "Despesa" &&
        normalizarCategoria(lancamento.categoria) ===
          normalizarCategoria(centro.categoria) &&
        normalizarCategoria(lancamento.subcategoria || "") ===
          normalizarCategoria(centro.subcategoria),
    );
    const totalCentavos = lancamentosRelacionados.reduce(
      (total, lancamento) =>
        total + Math.round(Number(lancamento.valor || 0) * 100),
      0,
    );

    return {
      ...centro,
      quantidade: lancamentosRelacionados.length,
      totalCentavos,
    };
  });

  const totalDespesasCentavos = linhas.reduce(
    (total, linha) => total + linha.totalCentavos,
    0,
  );
  const totalLancamentos = linhas.reduce(
    (total, linha) => total + linha.quantidade,
    0,
  );

  function salvarCentro(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");
    const nomeLimpo = subcategoria.trim();

    if (!nomeLimpo) {
      setErro("Informe o nome da subcategoria.");
      return;
    }

    const duplicado = centros.some(
      (centro) =>
        normalizarCategoria(centro.categoria) === normalizarCategoria(categoria) &&
        normalizarCategoria(centro.subcategoria) === normalizarCategoria(nomeLimpo),
    );
    if (duplicado) {
      setErro("Esta subcategoria já está cadastrada para a categoria selecionada.");
      return;
    }

    const novosCentros = [...centros, { categoria, subcategoria: nomeLimpo }];
    try {
      onCentrosChange(novosCentros);
    } catch {
      setErro("Não foi possível salvar o centro de custo. Tente novamente.");
      return;
    }

    setSubcategoria("");
    setMensagem("Centro de custo adicionado com sucesso.");
  }

  function excluirCentro(centro) {
    const novoCentroDeCusto = centros.filter(
      (item) =>
        item.categoria !== centro.categoria ||
        item.subcategoria !== centro.subcategoria,
    );

    try {
      onCentrosChange(novoCentroDeCusto);
    } catch {
      setErro("Não foi possível excluir o centro de custo. Tente novamente.");
      setMensagem("");
      return;
    }

    setErro("");
    setMensagem("Centro de custo removido. Os lançamentos existentes foram mantidos.");
  }

  return (
    <main className="centros-custo">
      <header className="centros-custo__cabecalho">
        <div>
          <p className="centros-custo__identificacao">CLASSIFICAÇÃO FINANCEIRA</p>
          <h1>Centros de custo</h1>
          <p>Organize as despesas em subcategorias e acompanhe seus totais.</p>
        </div>
        <label className="centros-custo__filtro">
          Mês de referência
          <input
            type="month"
            value={mesSelecionado}
            onChange={(event) => onMesChange(event.target.value)}
          />
        </label>
      </header>

      <section className="centros-custo__resumo" aria-label="Resumo dos centros de custo">
        <article className="centros-custo__indicador centros-custo__indicador--cadastros">
          <span>Centros cadastrados</span>
          <strong>{centros.length}</strong>
          <small>Categorias e subcategorias</small>
        </article>
        <article className="centros-custo__indicador centros-custo__indicador--lancamentos">
          <span>Lançamentos classificados</span>
          <strong>{totalLancamentos}</strong>
          <small>{formatarMes(mesSelecionado)}</small>
        </article>
        <article className="centros-custo__indicador centros-custo__indicador--despesas">
          <span>Total de despesas</span>
          <strong>{formatarValor(totalDespesasCentavos / 100)}</strong>
          <small>Despesas classificadas no mês</small>
        </article>
      </section>

      <section className="centros-custo__painel" aria-labelledby="novo-centro-titulo">
        <div className="centros-custo__painel-cabecalho">
          <div>
            <h2 id="novo-centro-titulo">Adicionar centro de custo</h2>
            <p>Escolha uma categoria e cadastre a subcategoria correspondente.</p>
          </div>
        </div>
        <form className="centros-custo__formulario" onSubmit={salvarCentro}>
          <label>
            Categoria
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            >
              {categorias.map((opcao) => (
                <option key={opcao} value={opcao}>{opcao}</option>
              ))}
            </select>
          </label>
          <label>
            Subcategoria
            <input
              type="text"
              value={subcategoria}
              onChange={(event) => setSubcategoria(event.target.value)}
              placeholder="Ex.: Mercado, Restaurante"
              maxLength="60"
              required
            />
          </label>
          <button type="submit">Adicionar</button>
        </form>
        {erro && <p className="centros-custo__mensagem centros-custo__mensagem--erro" role="alert">{erro}</p>}
        {mensagem && <p className="centros-custo__mensagem centros-custo__mensagem--sucesso" role="status">{mensagem}</p>}
      </section>

      <section className="centros-custo__painel" aria-labelledby="lista-centros-titulo">
        <div className="centros-custo__painel-cabecalho">
          <div>
            <h2 id="lista-centros-titulo">Cadastro e acompanhamento</h2>
            <p>Contagem e despesas dos lançamentos no mês selecionado.</p>
          </div>
          <span className="centros-custo__referencia">{formatarMes(mesSelecionado)}</span>
        </div>
        {linhas.length === 0 ? (
          <p className="centros-custo__vazio">
            Nenhum centro cadastrado. Adicione uma categoria e subcategoria acima.
          </p>
        ) : (
          <div className="centros-custo__tabela-container">
            <table className="centros-custo__tabela">
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col">Subcategoria</th>
                  <th scope="col">Lançamentos</th>
                  <th scope="col">Total de despesas</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={`${linha.categoria}-${linha.subcategoria}`}>
                    <th scope="row">{linha.categoria}</th>
                    <td>{linha.subcategoria}</td>
                    <td>{linha.quantidade}</td>
                    <td>{formatarValor(linha.totalCentavos / 100)}</td>
                    <td>
                      <button
                        className="centros-custo__excluir"
                        type="button"
                        aria-label={`Excluir ${linha.subcategoria} de ${linha.categoria}`}
                        onClick={() => excluirCentro(linha)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan="2">Total classificado</th>
                  <td>{totalLancamentos}</td>
                  <td>{formatarValor(totalDespesasCentavos / 100)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="centros-custo__nota">
          A subcategoria é opcional no lançamento. A exclusão remove o cadastro,
          mas mantém as informações já salvas nos lançamentos.
        </p>
      </section>
    </main>
  );
}

export default CentrosDeCusto;
