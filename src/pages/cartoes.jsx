import { useMemo, useState } from "react";
import "./cartoes.css";

function emCentavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarMes(mes) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, numeroMes - 1, 1));
}

function obterStatus(limite, gasto) {
  if (limite <= 0) {
    return { texto: "Definir limite", classe: "definir" };
  }
  if (gasto > limite) return { texto: "Acima do limite", classe: "acima" };
  if ((gasto / limite) * 100 >= 80) {
    return { texto: "Atenção", classe: "atencao" };
  }
  return { texto: "Dentro do limite", classe: "dentro" };
}

function Cartoes({
  cartoes,
  lancamentos,
  mesSelecionado,
  onMesChange,
  onCartoesChange,
}) {
  const [cartoesEditados, setCartoesEditados] = useState(() =>
    cartoes.map((cartao) => ({ ...cartao })),
  );
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const cartaoIds = useMemo(
    () => new Set(cartoes.map((cartao) => cartao.id)),
    [cartoes],
  );

  const gastosPorCartao = useMemo(
    () =>
      lancamentos
        .filter(
          (lancamento) =>
            lancamento.tipo === "Despesa" &&
            cartaoIds.has(lancamento.cartaoId),
        )
        .reduce((totais, lancamento) => {
          totais[lancamento.cartaoId] =
            (totais[lancamento.cartaoId] || 0) + emCentavos(lancamento.valor);
          return totais;
        }, {}),
    [lancamentos, cartaoIds],
  );

  const despesasSemCartao = lancamentos.filter(
    (lancamento) =>
      lancamento.tipo === "Despesa" &&
      (!lancamento.cartaoId || !cartaoIds.has(lancamento.cartaoId)),
  );
  const gastoSemCartao = despesasSemCartao.reduce(
    (total, lancamento) => total + emCentavos(lancamento.valor),
    0,
  );
  const gastoVinculado = Object.values(gastosPorCartao).reduce(
    (total, valor) => total + valor,
    0,
  );

  const linhas = cartoesEditados.map((cartao) => {
    const limite = emCentavos(cartao.limite);
    const gasto = gastosPorCartao[cartao.id] || 0;
    const percentual = limite > 0 ? (gasto / limite) * 100 : 0;

    return {
      ...cartao,
      limiteCentavos: limite,
      gastoCentavos: gasto,
      disponivelCentavos: limite - gasto,
      percentual,
      status: obterStatus(limite, gasto),
    };
  });

  const totalLimites = linhas.reduce(
    (total, cartao) => total + cartao.limiteCentavos,
    0,
  );

  function atualizarCartao(id, campo, valor) {
    setCartoesEditados((atuais) =>
      atuais.map((cartao) =>
        cartao.id === id ? { ...cartao, [campo]: valor } : cartao,
      ),
    );
    setMensagem("");
    setErro("");
  }

  function salvarConfiguracoes(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    const cartoesInvalidos = cartoesEditados.filter((cartao) => {
      const limite = Number(cartao.limite);
      const fechamento = cartao.fechamento === "" ? null : Number(cartao.fechamento);
      const vencimento = cartao.vencimento === "" ? null : Number(cartao.vencimento);
      return (
        !Number.isFinite(limite) ||
        limite < 0 ||
        (fechamento !== null && (!Number.isInteger(fechamento) || fechamento < 1 || fechamento > 31)) ||
        (vencimento !== null && (!Number.isInteger(vencimento) || vencimento < 1 || vencimento > 31))
      );
    });

    if (cartoesInvalidos.length > 0) {
      setErro("Confira os limites e informe dias entre 1 e 31.");
      return;
    }

    const cartoesSalvos = cartoesEditados.map((cartao) => ({
      ...cartao,
      limite: Number(cartao.limite || 0),
      fechamento: cartao.fechamento === "" ? "" : Number(cartao.fechamento),
      vencimento: cartao.vencimento === "" ? "" : Number(cartao.vencimento),
    }));

    try {
      onCartoesChange(cartoesSalvos);
    } catch {
      setErro("Não foi possível salvar os cartões. Tente novamente.");
      return;
    }

    setCartoesEditados(cartoesSalvos);
    setMensagem("Configurações dos cartões salvas com sucesso.");
  }

  return (
    <main className="cartoes">
      <header className="cartoes__cabecalho">
        <div>
          <p className="cartoes__identificacao">CONTROLE DE CARTÕES</p>
          <h1>Cartões</h1>
          <p>Cadastre limites e acompanhe os gastos do período selecionado.</p>
        </div>
        <label className="cartoes__filtro">
          Mês de referência
          <input
            type="month"
            value={mesSelecionado}
            onChange={(event) => onMesChange(event.target.value)}
          />
        </label>
      </header>

      <section className="cartoes__resumo" aria-label="Resumo de cartões">
        <article className="cartoes__resumo-card">
          <span>Cartões cadastrados</span>
          <strong>{cartoes.length}</strong>
        </article>
        <article className="cartoes__resumo-card">
          <span>Gastos vinculados</span>
          <strong>{formatarValor(gastoVinculado / 100)}</strong>
          <small>{formatarMes(mesSelecionado)}</small>
        </article>
        <article className="cartoes__resumo-card">
          <span>Despesas sem cartão</span>
          <strong>{formatarValor(gastoSemCartao / 100)}</strong>
          <small>{despesasSemCartao.length} {despesasSemCartao.length === 1 ? "lançamento" : "lançamentos"}</small>
        </article>
        <article className="cartoes__resumo-card">
          <span>Limite total cadastrado</span>
          <strong>{formatarValor(totalLimites / 100)}</strong>
        </article>
      </section>

      <form onSubmit={salvarConfiguracoes}>
        <section className="cartoes__painel" aria-labelledby="cartoes-tabela-titulo">
          <div className="cartoes__painel-cabecalho">
            <div>
              <h2 id="cartoes-tabela-titulo">Cartões cadastrados</h2>
              <p>Informe os limites e os dias de fechamento e vencimento.</p>
            </div>
            <button className="cartoes__salvar" type="submit">
              Salvar configurações
            </button>
          </div>

          <div className="cartoes__tabela-container">
            <table className="cartoes__tabela">
              <thead>
                <tr>
                  <th scope="col">Banco</th>
                  <th scope="col">Cartão</th>
                  <th scope="col">Limite</th>
                  <th scope="col">Dia fechamento</th>
                  <th scope="col">Dia vencimento</th>
                  <th scope="col">Gasto no período</th>
                  <th scope="col">Limite disponível</th>
                  <th scope="col">% utilizado</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((cartao) => (
                  <tr key={cartao.id}>
                    <th scope="row">{cartao.banco}</th>
                    <td>{cartao.nome}</td>
                    <td>
                      <label className="cartoes__entrada">
                        <span className="cartoes__sr-only">Limite do cartão {cartao.nome}</span>
                        <span aria-hidden="true">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cartao.limite}
                          onChange={(event) =>
                            atualizarCartao(cartao.id, "limite", event.target.value)
                          }
                          required
                        />
                      </label>
                    </td>
                    <td>
                      <label className="cartoes__dia">
                        <span className="cartoes__sr-only">Dia de fechamento do cartão {cartao.nome}</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="—"
                          value={cartao.fechamento}
                          onChange={(event) =>
                            atualizarCartao(cartao.id, "fechamento", event.target.value)
                          }
                        />
                      </label>
                    </td>
                    <td>
                      <label className="cartoes__dia">
                        <span className="cartoes__sr-only">Dia de vencimento do cartão {cartao.nome}</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="—"
                          value={cartao.vencimento}
                          onChange={(event) =>
                            atualizarCartao(cartao.id, "vencimento", event.target.value)
                          }
                        />
                      </label>
                    </td>
                    <td>{formatarValor(cartao.gastoCentavos / 100)}</td>
                    <td className={cartao.disponivelCentavos < 0 ? "cartoes__negativo" : ""}>
                      {formatarValor(cartao.disponivelCentavos / 100)}
                    </td>
                    <td>
                      {cartao.limiteCentavos > 0
                        ? `${cartao.percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                        : "—"}
                      <div
                        className="cartoes__progresso"
                        role="progressbar"
                        aria-label={`Limite utilizado no cartão ${cartao.nome}`}
                        aria-valuenow={Math.min(cartao.percentual, 100)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <span
                          className={`cartoes__progresso-barra cartoes__progresso-barra--${cartao.status.classe}`}
                          style={{ width: `${Math.min(cartao.percentual, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`cartoes__status cartoes__status--${cartao.status.classe}`}>
                        {cartao.status.texto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan="2">Total</th>
                  <td>{formatarValor(totalLimites / 100)}</td>
                  <td colSpan="2">—</td>
                  <td>{formatarValor(gastoVinculado / 100)}</td>
                  <td>{formatarValor((totalLimites - gastoVinculado) / 100)}</td>
                  <td>
                    {totalLimites > 0
                      ? `${((gastoVinculado / totalLimites) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                      : "—"}
                  </td>
                  <td>—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {erro && <p className="cartoes__mensagem cartoes__mensagem--erro" role="alert">{erro}</p>}
          {mensagem && <p className="cartoes__mensagem" role="status">{mensagem}</p>}
          <p className="cartoes__nota">
            Para incluir uma despesa nos gastos de um cartão, selecione-o no formulário de Lançamentos.
            Despesas sem cartão continuam registradas, mas não reduzem o limite dos cartões.
          </p>
        </section>
      </form>
    </main>
  );
}

export default Cartoes;
