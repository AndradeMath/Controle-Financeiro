import { useState } from "react";
import { salvarLancamentos } from "../services/storage";
import { categorias } from "../data/categorias";
import "./lancamentos.css";
import { supabase } from "../lib/supabase";

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
  centrosDeCusto,
  mesSelecionado,
  onLancamentosChange,
}) {
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [cartaoId, setCartaoId] = useState("");
  const [parcelaAtual, setParcelaAtual] = useState("1");
  const [totalParcelas, setTotalParcelas] = useState("1");
  const [tipo, setTipo] = useState("Despesa");
  const [formaPagamento, setFormaPagamento] = useState("Débito");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [indiceEmEdicao, setIndiceEmEdicao] = useState(null);

  function limparFormulario() {
    setData("");
    setDescricao("");
    setCategoria("");
    setSubcategoria("");
    setCartaoId("");
    setParcelaAtual("1");
    setTotalParcelas("1");
    setTipo("Despesa");
    setFormaPagamento("Débito");
    setValor("");
    setIndiceEmEdicao(null);
  }

  function mapearParaSupabase(lancamento) {
    return {
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

  async function salvarLancamento(event) {
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

    const parcelaAtualNumerica = Number(parcelaAtual);
    const totalParcelasNumerico = Number(totalParcelas);
    if (
      tipo === "Despesa" &&
      cartaoId &&
      (!Number.isInteger(parcelaAtualNumerica) ||
        !Number.isInteger(totalParcelasNumerico) ||
        parcelaAtualNumerica < 1 ||
        totalParcelasNumerico < 1 ||
        parcelaAtualNumerica > totalParcelasNumerico)
    ) {
      setErro("Informe parcelas válidas: a parcela atual deve estar entre 1 e o total de parcelas.");
      return;
    }

    const novoLancamento = {
      idTransacao:
        indiceEmEdicao === null
          ? lancamentos.reduce(
              (maiorId, lancamento) =>
                Math.max(maiorId, Number(lancamento.idTransacao) || 0),
              0,
            ) + 1
          : lancamentos[indiceEmEdicao].idTransacao,
      ...(indiceEmEdicao !== null && lancamentos[indiceEmEdicao].supabaseId
        ? { supabaseId: lancamentos[indiceEmEdicao].supabaseId }
        : {}),
      data,
      descricao: descricaoLimpa,
      categoria: categoriaLimpa,
      ...(tipo === "Despesa" && subcategoria
        ? { subcategoria: subcategoria.trim() }
        : {}),
      tipo,
      formaPagamento,
      valor: valorNumerico,
      ...(tipo === "Despesa" && cartaoId ? { cartaoId } : {}),
      ...(tipo === "Despesa" && cartaoId
        ? {
            parcelaAtual: parcelaAtualNumerica,
            totalParcelas: totalParcelasNumerico,
          }
        : {}),
    };
    const novaLista = [...lancamentos];
    if (indiceEmEdicao === null) {
      novaLista.push(novoLancamento);
    } else {
      novaLista[indiceEmEdicao] = novoLancamento;
    }

    setSalvando(true);
    try {
      let lancamentoPersistido = novoLancamento;
      const supabaseId = novoLancamento.supabaseId;
      const resposta = supabaseId
        ? await supabase
            .from("lancamentos")
            .update(mapearParaSupabase(novoLancamento))
            .eq("id", supabaseId)
            .select("id")
            .single()
        : await supabase
            .from("lancamentos")
            .insert(mapearParaSupabase(novoLancamento))
            .select("id")
            .single();

      if (resposta.error) throw new Error(resposta.error.message);

      lancamentoPersistido = {
        ...novoLancamento,
        supabaseId: resposta.data.id,
      };
      novaLista[indiceEmEdicao === null ? novaLista.length - 1 : indiceEmEdicao] =
        lancamentoPersistido;
    } catch (erroSupabase) {
      setErro(`Não foi possível salvar no Supabase: ${erroSupabase.message}`);
      setSalvando(false);
      return;
    }

    onLancamentosChange(novaLista);
    try {
      salvarLancamentos(novaLista);
    } catch {
      setErro("O lançamento foi salvo no Supabase, mas não foi possível atualizar o armazenamento local.");
    }

    const estavaEditando = indiceEmEdicao !== null;
    limparFormulario();
    setSucesso(
      estavaEditando
        ? "Lançamento atualizado com sucesso no Supabase."
        : "Lançamento salvo com sucesso no Supabase.",
    );
    setSalvando(false);
  }

  function editarLancamento(indice) {
    const lancamento = lancamentos[indice];
    setData(lancamento.data);
    setDescricao(lancamento.descricao);
    setCategoria(lancamento.categoria);
    setSubcategoria(lancamento.subcategoria || "");
    setCartaoId(lancamento.cartaoId || "");
    setParcelaAtual(String(lancamento.parcelaAtual || 1));
    setTotalParcelas(String(lancamento.totalParcelas || 1));
    setTipo(lancamento.tipo);
    setFormaPagamento(
      lancamento.formaPagamento ||
        (lancamento.cartaoId
          ? "Crédito"
          : lancamento.tipo === "Receita"
            ? "Transferência"
            : "Não informado"),
    );
    setValor(String(lancamento.valor));
    setIndiceEmEdicao(indice);
    setErro("");
    setSucesso("");
  }

  async function excluirLancamento(indice) {
    const lancamento = lancamentos[indice];
    const confirmado = window.confirm(
      `Deseja excluir o lançamento "${lancamento.descricao}"?`,
    );

    if (!confirmado) return;

    const novaLista = lancamentos.filter((_, itemIndice) => itemIndice !== indice);

    setErro("");
    setSucesso("");
    try {
      if (lancamento.supabaseId) {
        const { error: erroSupabase } = await supabase
          .from("lancamentos")
          .delete()
          .eq("id", lancamento.supabaseId)
          .select("id")
          .single();
        if (erroSupabase) throw new Error(erroSupabase.message);
      }
    } catch (erroSupabase) {
      setErro(`Não foi possível excluir o lançamento: ${erroSupabase.message}`);
      return;
    }

    onLancamentosChange(novaLista);
    try {
      salvarLancamentos(novaLista);
    } catch {
      setErro(
        lancamento.supabaseId
          ? "O lançamento foi excluído do Supabase, mas não foi possível atualizar o armazenamento local."
          : "O lançamento foi removido da lista, mas não foi possível atualizar o armazenamento local.",
      );
    }
    if (indiceEmEdicao === indice) {
      limparFormulario();
    } else if (indiceEmEdicao !== null && indice < indiceEmEdicao) {
      setIndiceEmEdicao(indiceEmEdicao - 1);
    }
    setSucesso(
      lancamento.supabaseId
        ? "Lançamento excluído com sucesso no Supabase."
        : "Lançamento local excluído com sucesso.",
    );
  }

  const lancamentosDoMes = lancamentos
    .map((lancamento, indiceOriginal) => ({ lancamento, indiceOriginal }))
    .filter(({ lancamento }) => lancamento.data.startsWith(mesSelecionado))
    .reverse();
  const subcategorias = centrosDeCusto
    .filter((centro) => centro.categoria === categoria)
    .map((centro) => centro.subcategoria);

  return (
    <main className="lancamentos">
      <header className="lancamentos__cabecalho">
        <p className="lancamentos__identificacao">CONTROLE FINANCEIRO</p>
        <h1>Lançamentos</h1>
        <p>Registre suas receitas e despesas em um só lugar.</p>
      </header>

      <section className="lancamentos__painel" aria-labelledby="form-titulo">
        <h2 id="form-titulo">
          {indiceEmEdicao === null ? "Novo lançamento" : "Editar lançamento"}
        </h2>
        <form className="lancamentos__formulario" onSubmit={salvarLancamento}>
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
              onChange={(event) => {
                setCategoria(event.target.value);
                setSubcategoria("");
              }}
              required
            >
              <option value="" disabled>Selecione uma categoria</option>
              {!categorias.includes(categoria) && categoria && (
                <option value={categoria}>{categoria}</option>
              )}
              {categorias.map((opcao) => (
                <option key={opcao} value={opcao}>{opcao}</option>
              ))}
            </select>
          </label>

          {tipo === "Despesa" && (
            <label>
              Centro de custo / subcategoria (opcional)
              <select
                value={subcategoria}
                onChange={(event) => setSubcategoria(event.target.value)}
              >
                <option value="">Sem subcategoria</option>
                {subcategoria &&
                  !subcategorias.includes(subcategoria) && (
                    <option value={subcategoria}>{subcategoria} (atual)</option>
                  )}
                {subcategorias.map((opcao) => (
                  <option key={opcao} value={opcao}>{opcao}</option>
                ))}
              </select>
            </label>
          )}

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
              onChange={(event) => {
                const novoTipo = event.target.value;
                setTipo(novoTipo);
                setFormaPagamento(
                  novoTipo === "Receita" ? "Transferência" : "Débito",
                );
              }}
            >
              <option value="Despesa">Despesa</option>
              <option value="Receita">Receita</option>
            </select>
          </label>

          <label>
            Forma de pagamento
            <select
              value={formaPagamento}
              onChange={(event) => setFormaPagamento(event.target.value)}
            >
              <option value="Crédito">Crédito</option>
              <option value="Débito">Débito</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Transferência">Transferência</option>
              <option value="Boleto">Boleto</option>
              <option value="Outro">Outro</option>
              <option value="Não informado">Não informado</option>
            </select>
          </label>

          {tipo === "Despesa" && (
            <label>
              Cartão utilizado (opcional)
              <select
                value={cartaoId}
                onChange={(event) => {
                  const novoCartaoId = event.target.value;
                  setCartaoId(novoCartaoId);
                  if (novoCartaoId) {
                    setFormaPagamento("Crédito");
                  } else if (formaPagamento === "Crédito") {
                    setFormaPagamento("Débito");
                  }
                }}
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

          {tipo === "Despesa" && cartaoId && (
            <>
              <label>
                Parcela atual
                <input
                  type="number"
                  min="1"
                  max={totalParcelas || undefined}
                  step="1"
                  value={parcelaAtual}
                  onChange={(event) => setParcelaAtual(event.target.value)}
                  required
                />
              </label>

              <label>
                Total de parcelas
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={totalParcelas}
                  onChange={(event) => setTotalParcelas(event.target.value)}
                  required
                />
              </label>
            </>
          )}

          <label>
            {tipo === "Despesa" && cartaoId
              ? "Valor total da compra (R$)"
              : "Valor (R$)"}
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

          <div className="lancamentos__botoes-formulario">
            <button type="submit" disabled={salvando}>
              {salvando
                ? "Salvando..."
                : indiceEmEdicao === null
                  ? "Salvar lançamento"
                  : "Salvar alterações"}
            </button>
            {indiceEmEdicao !== null && (
              <button
                className="lancamentos__cancelar"
                type="button"
                disabled={salvando}
                onClick={() => {
                  limparFormulario();
                  setErro("");
                  setSucesso("");
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {tipo === "Despesa" && cartaoId && (
          <p className="lancamentos__ajuda-parcelas">
            Compras à vista podem ser cadastradas como 1 de 1. O valor
            informado continua sendo o valor total da compra.
          </p>
        )}
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
                      ID {lancamento.idTransacao} · {lancamento.categoria}
                      {lancamento.subcategoria && ` / ${lancamento.subcategoria}`}
                      {" · "}{formatarData(lancamento.data)}
                      {` · ${lancamento.formaPagamento || (lancamento.cartaoId ? "Crédito" : "Não informado")}`}
                      {lancamento.cartaoId && ` · ${cartoes.find((cartao) => cartao.id === lancamento.cartaoId)?.nome || "Cartão"}`}
                    </span>
                  </div>
                  <div className="lancamentos__acoes">
                    <strong className={`lancamentos__valor lancamentos__valor--${lancamento.tipo === "Receita" ? "receita" : "despesa"}`}>
                      {lancamento.tipo === "Receita" ? "+" : "−"} {formatarValor(lancamento.valor)}
                    </strong>
                    <button
                      className="lancamentos__editar"
                      type="button"
                      aria-label={`Editar lançamento ${lancamento.descricao}`}
                      disabled={salvando}
                      onClick={() => editarLancamento(indiceOriginal)}
                    >
                      Editar
                    </button>
                    <button
                      className="lancamentos__excluir"
                      type="button"
                      aria-label={`Excluir lançamento ${lancamento.descricao}`}
                      disabled={salvando}
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
