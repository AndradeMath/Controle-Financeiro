import { lazy, Suspense, useState } from "react";
import { categorias, normalizarCategoria } from "../data/categorias";
import "./dashboard.css";

const GraficoDespesas = lazy(() => import("./grafico-despesas"));
const GraficoEvolucao = lazy(() => import("./grafico-evolucao"));

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function obterUltimosSeisMeses(mesSelecionado) {
  const [ano, mes] = mesSelecionado.split("-").map(Number);
  return Array.from({ length: 6 }, (_, indice) => {
    const data = new Date(ano, mes - 1 - (5 - indice), 1);
    const mesId = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    return {
      mes: mesId,
      rotulo: new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(data)
        .replace(".", ""),
    };
  });
}

function Dashboard({
  lancamentos,
  mesSelecionado,
  onMesChange,
  metasEconomia,
  onMetasEconomiaChange,
}) {
  const [metaRascunho, setMetaRascunho] = useState(
    () => String(metasEconomia[mesSelecionado] ?? ""),
  );
  const [mensagemMeta, setMensagemMeta] = useState("");
  const [erroMeta, setErroMeta] = useState("");
  const lancamentosDoMes = lancamentos.filter((lancamento) =>
    lancamento.data.startsWith(mesSelecionado),
  );
  const despesasDoMes = lancamentosDoMes.filter(
    (lancamento) => lancamento.tipo === "Despesa",
  );
  const receitas = lancamentosDoMes
    .filter((lancamento) => lancamento.tipo === "Receita")
    .reduce((total, lancamento) => total + Number(lancamento.valor), 0);
  const despesas = despesasDoMes
    .reduce((total, lancamento) => total + Number(lancamento.valor), 0);
  const saldo = receitas - despesas;
  const maiorDespesa = despesasDoMes.reduce(
    (maior, lancamento) =>
      Number(lancamento.valor) > Number(maior?.valor || 0) ? lancamento : maior,
    null,
  );
  const totaisPorCategoria = despesasDoMes
    .reduce((totais, lancamento) => {
      const categoriaSalva = lancamento.categoria?.trim() || "Sem categoria";
      const categoriaPadrao = categorias.find(
        (categoria) =>
          normalizarCategoria(categoria) ===
          normalizarCategoria(categoriaSalva),
      );
      const categoria = categoriaPadrao || categoriaSalva;

      totais.set(
        categoria,
        (totais.get(categoria) || 0) + Number(lancamento.valor),
      );
      return totais;
    }, new Map());
  const quantidadesPorCategoria = despesasDoMes.reduce((quantidades, lancamento) => {
    const categoria = categorias.find(
      (item) =>
        normalizarCategoria(item) === normalizarCategoria(lancamento.categoria),
    ) || lancamento.categoria?.trim() || "Sem categoria";
    quantidades.set(categoria, (quantidades.get(categoria) || 0) + 1);
    return quantidades;
  }, new Map());
  const dadosDespesasPorCategoria = Array.from(
    totaisPorCategoria,
    ([categoria, valor]) => ({ categoria, valor }),
  ).sort((a, b) => b.valor - a.valor);
  const categoriaMaisUtilizada = Array.from(
    quantidadesPorCategoria,
    ([categoria, quantidade]) => ({
      categoria,
      quantidade,
      gasto: totaisPorCategoria.get(categoria) || 0,
    }),
  ).sort((a, b) => b.quantidade - a.quantidade)[0];
  const quantidadeDespesas = despesasDoMes.length;
  const ticketMedio = quantidadeDespesas > 0 ? despesas / quantidadeDespesas : 0;
  const metaEconomia = Number(metasEconomia[mesSelecionado] || 0);
  const percentualMeta = metaEconomia > 0 ? (saldo / metaEconomia) * 100 : 0;
  const mesesEvolucao = obterUltimosSeisMeses(mesSelecionado);
  const dadosEvolucao = mesesEvolucao.map(({ mes, rotulo }) => {
    const lancamentosDoPeriodo = lancamentos.filter((lancamento) =>
      lancamento.data.startsWith(mes),
    );
    return {
      mes,
      rotulo,
      receitas: lancamentosDoPeriodo
        .filter((lancamento) => lancamento.tipo === "Receita")
        .reduce((total, lancamento) => total + Number(lancamento.valor), 0),
      despesas: lancamentosDoPeriodo
        .filter((lancamento) => lancamento.tipo === "Despesa")
        .reduce((total, lancamento) => total + Number(lancamento.valor), 0),
    };
  });

  function salvarMeta(event) {
    event.preventDefault();
    const valorMeta = Number(metaRascunho);
    if (!Number.isFinite(valorMeta) || valorMeta < 0) {
      setErroMeta("Informe uma meta igual ou maior que zero.");
      setMensagemMeta("");
      return;
    }

    try {
      onMetasEconomiaChange({
        ...metasEconomia,
        [mesSelecionado]: valorMeta,
      });
    } catch {
      setErroMeta("Não foi possível salvar a meta. Tente novamente.");
      setMensagemMeta("");
      return;
    }

    setErroMeta("");
    setMensagemMeta("Meta de economia salva.");
  }

  return (
    <section className="dashboard" aria-labelledby="dashboard-titulo">
      <header className="dashboard__cabecalho">
        <div>
          <p className="dashboard__identificacao">VISÃO GERAL</p>
          <h1 id="dashboard-titulo">Dashboard financeiro</h1>
          <p>Acompanhe o resumo dos lançamentos do mês selecionado.</p>
        </div>
        <label className="dashboard__filtro">
          Mês
          <input
            type="month"
            value={mesSelecionado}
            onChange={(event) => {
              setMetaRascunho(String(metasEconomia[event.target.value] ?? ""));
              setMensagemMeta("");
              setErroMeta("");
              onMesChange(event.target.value);
            }}
          />
        </label>
      </header>

      <div className="dashboard__cartoes">
        <article className="dashboard__cartao dashboard__cartao--saldo">
          <span className="dashboard__rotulo">Saldo atual</span>
          <strong>{formatarValor(saldo)}</strong>
          <span className="dashboard__descricao">Receitas menos despesas</span>
        </article>
        <article className="dashboard__cartao dashboard__cartao--receitas">
          <span className="dashboard__rotulo">Receitas</span>
          <strong>{formatarValor(receitas)}</strong>
          <span className="dashboard__descricao">Total de entradas</span>
        </article>
        <article className="dashboard__cartao dashboard__cartao--despesas">
          <span className="dashboard__rotulo">Despesas</span>
          <strong>{formatarValor(despesas)}</strong>
          <span className="dashboard__descricao">Total de saídas</span>
        </article>
      </div>

      <div className="dashboard__kpis-adicionais">
        <article className="dashboard__kpi">
          <span className="dashboard__rotulo">Maior despesa do mês</span>
          {maiorDespesa ? (
            <>
              <strong>{formatarValor(Number(maiorDespesa.valor))}</strong>
              <span className="dashboard__descricao">
                {maiorDespesa.descricao} · {maiorDespesa.categoria}
              </span>
            </>
          ) : (
            <strong className="dashboard__kpi-vazio">Sem despesas</strong>
          )}
        </article>
        <article className="dashboard__kpi">
          <span className="dashboard__rotulo">Categoria mais utilizada</span>
          <strong className="dashboard__kpi-texto">
            {categoriaMaisUtilizada?.categoria || "Nenhuma"}
          </strong>
          <span className="dashboard__descricao">
            {categoriaMaisUtilizada
              ? `${categoriaMaisUtilizada.quantidade} ${categoriaMaisUtilizada.quantidade === 1 ? "lançamento" : "lançamentos"} · ${formatarValor(categoriaMaisUtilizada.gasto)}`
              : "Nenhuma despesa neste mês"}
          </span>
        </article>
        <article className="dashboard__kpi">
          <span className="dashboard__rotulo">Quantidade de lançamentos</span>
          <strong>{lancamentosDoMes.length}</strong>
          <span className="dashboard__descricao">
            {despesasDoMes.length} {despesasDoMes.length === 1 ? "despesa" : "despesas"} · {lancamentosDoMes.length - despesasDoMes.length} {lancamentosDoMes.length - despesasDoMes.length === 1 ? "receita" : "receitas"}
          </span>
        </article>
        <article className="dashboard__kpi">
          <span className="dashboard__rotulo">Ticket médio de despesas</span>
          <strong>{formatarValor(ticketMedio)}</strong>
          <span className="dashboard__descricao">
            {quantidadeDespesas === 0
              ? "Sem despesas no mês"
              : `Média de ${quantidadeDespesas} ${quantidadeDespesas === 1 ? "despesa" : "despesas"}`}
          </span>
        </article>
      </div>

      <section className="dashboard__painel-meta" aria-labelledby="meta-economia-titulo">
        <div className="dashboard__meta-conteudo">
          <div className="dashboard__grafico-cabecalho">
            <h2 id="meta-economia-titulo">Meta de economia</h2>
            <p>Compare a meta mensal com seu saldo (receitas menos despesas).</p>
          </div>
          <form className="dashboard__form-meta" onSubmit={salvarMeta}>
            <label>
              Meta para este mês
              <span className="dashboard__entrada-meta">
                <span aria-hidden="true">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={metaRascunho}
                  onChange={(event) => {
                    setMetaRascunho(event.target.value);
                    setMensagemMeta("");
                    setErroMeta("");
                  }}
                  placeholder="0,00"
                  required
                />
              </span>
            </label>
            <button type="submit">Salvar meta</button>
          </form>
        </div>
        {metaEconomia > 0 ? (
          <>
            <div className="dashboard__meta-valores">
              <span>Economizado: <strong>{formatarValor(saldo)}</strong></span>
              <span>Meta: <strong>{formatarValor(metaEconomia)}</strong></span>
              <strong className={saldo >= metaEconomia ? "dashboard__meta-atingida" : "dashboard__meta-pendente"}>
                {saldo >= metaEconomia
                  ? "Meta atingida"
                  : `${Math.max(0, percentualMeta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% da meta`}
              </strong>
            </div>
            <div
              className="dashboard__meta-progresso"
              role="progressbar"
              aria-label="Progresso da meta de economia"
              aria-valuenow={Math.max(0, Math.min(percentualMeta, 100))}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span style={{ width: `${Math.max(0, Math.min(percentualMeta, 100))}%` }} />
            </div>
          </>
        ) : (
          <p className="dashboard__grafico-vazio">Defina uma meta para acompanhar seu progresso neste mês.</p>
        )}
        {erroMeta && <p className="dashboard__mensagem-erro" role="alert">{erroMeta}</p>}
        {mensagemMeta && <p className="dashboard__mensagem-sucesso" role="status">{mensagemMeta}</p>}
      </section>

      <section className="dashboard__grafico-painel" aria-labelledby="evolucao-titulo">
        <div className="dashboard__grafico-cabecalho">
          <h2 id="evolucao-titulo">Evolução mensal</h2>
          <p>Receitas e despesas nos últimos seis meses, até o mês selecionado.</p>
        </div>
        <Suspense
          fallback={<p className="dashboard__grafico-vazio">Carregando gráfico...</p>}
        >
          <GraficoEvolucao dados={dadosEvolucao} />
        </Suspense>
      </section>

      <section
        className="dashboard__grafico-painel"
        aria-labelledby="grafico-categorias-titulo"
      >
        <div className="dashboard__grafico-cabecalho">
          <h2 id="grafico-categorias-titulo">Gastos por categoria</h2>
          <p>Despesas no mês selecionado</p>
        </div>
        {dadosDespesasPorCategoria.length === 0 ? (
          <p className="dashboard__grafico-vazio">
            Não há despesas para exibir neste mês.
          </p>
        ) : (
          <Suspense
            fallback={<p className="dashboard__grafico-vazio">Carregando gráfico...</p>}
          >
            <GraficoDespesas dados={dadosDespesasPorCategoria} />
          </Suspense>
        )}
      </section>
    </section>
  );
}

export default Dashboard;
