import { useMemo, useState } from "react";
import { categorias, limitesMensaisSugeridos, normalizarCategoria } from "../data/categorias";
import "./orcamentos.css";

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function valorEmCentavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

function formatarMes(mes) {
  if (!mes) return "";
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, numeroMes - 1, 1));
}

function obterStatus(limiteCentavos, gastoCentavos) {
  if (limiteCentavos === 0 && gastoCentavos === 0) {
    return { texto: "Sem limite", classe: "sem-limite", percentual: 0 };
  }

  const percentual = limiteCentavos === 0
    ? 100
    : (gastoCentavos / limiteCentavos) * 100;

  if (gastoCentavos > limiteCentavos) {
    return { texto: "Acima do limite", classe: "acima", percentual };
  }

  if (percentual >= 80) {
    return { texto: "Atenção", classe: "atencao", percentual };
  }

  return { texto: "Dentro do limite", classe: "dentro", percentual };
}

function Orcamentos({
  lancamentos,
  mesSelecionado,
  onMesChange,
  orcamentos,
  onOrcamentosChange,
}) {
  const [limites, setLimites] = useState(
    () => orcamentos[mesSelecionado] || limitesMensaisSugeridos,
  );
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const gastosPorCategoria = useMemo(() => {
    return lancamentos
      .filter((lancamento) => lancamento.tipo === "Despesa")
      .reduce((gastos, lancamento) => {
        const categoria = categorias.find(
          (item) => normalizarCategoria(item) === normalizarCategoria(lancamento.categoria),
        );
        if (!categoria) return gastos;

        gastos[categoria] =
          (gastos[categoria] || 0) + valorEmCentavos(lancamento.valor);
        return gastos;
      }, {});
  }, [lancamentos]);

  const linhas = categorias.map((categoria) => {
    const naoAplicavel = categoria === "Renda";
    const limiteCentavos = naoAplicavel ? 0 : valorEmCentavos(limites[categoria]);
    const gastoCentavos = gastosPorCategoria[categoria] || 0;
    const status = naoAplicavel
      ? { texto: "Não aplicável", classe: "nao-aplicavel", percentual: 0 }
      : obterStatus(limiteCentavos, gastoCentavos);

    return {
      categoria,
      naoAplicavel,
      limiteCentavos,
      gastoCentavos,
      saldoCentavos: limiteCentavos - gastoCentavos,
      status,
    };
  });

  const totais = linhas.reduce(
    (resultado, linha) => {
      if (linha.naoAplicavel) return resultado;
      resultado.limite += linha.limiteCentavos;
      resultado.gasto += linha.gastoCentavos;
      return resultado;
    },
    { limite: 0, gasto: 0 },
  );

  function atualizarLimite(categoria, valor) {
    setLimites((atuais) => ({ ...atuais, [categoria]: valor }));
    setMensagem("");
    setErro("");
  }

  function salvarLimites(event) {
    event.preventDefault();
    const limitesNumericos = Object.fromEntries(
      categorias.map((categoria) => [
        categoria,
        categoria === "Renda" ? 0 : Number(limites[categoria] || 0),
      ]),
    );
    const novosOrcamentos = {
      ...orcamentos,
      [mesSelecionado]: limitesNumericos,
    };

    try {
      onOrcamentosChange(novosOrcamentos);
    } catch {
      setErro("Não foi possível salvar os limites. Tente novamente.");
      setMensagem("");
      return;
    }

    setMensagem("Limites mensais salvos com sucesso.");
    setErro("");
  }

  return (
    <main className="orcamentos">
      <header className="orcamentos__cabecalho">
        <div>
          <p className="orcamentos__identificacao">PLANEJAMENTO FINANCEIRO</p>
          <h1>Orçamentos por categoria</h1>
          <p>Defina limites mensais e acompanhe seus gastos.</p>
        </div>
        <label className="orcamentos__filtro">
          Mês de referência
          <input
            type="month"
            value={mesSelecionado}
            onChange={(event) => onMesChange(event.target.value)}
          />
        </label>
      </header>

      <section className="orcamentos__resumo" aria-label="Resumo do orçamento mensal">
        <article className="orcamentos__cartao orcamentos__cartao--limite">
          <span>Limite total</span>
          <strong>{formatarValor(totais.limite / 100)}</strong>
          <small>{formatarMes(mesSelecionado)}</small>
        </article>
        <article className="orcamentos__cartao">
          <span>Gasto realizado</span>
          <strong>{formatarValor(totais.gasto / 100)}</strong>
          <small>Despesas do mês</small>
        </article>
        <article className="orcamentos__cartao">
          <span>Saldo disponível</span>
          <strong className={totais.limite - totais.gasto < 0 ? "orcamentos__valor--negativo" : ""}>
            {formatarValor((totais.limite - totais.gasto) / 100)}
          </strong>
          <small>Limite total menos gastos</small>
        </article>
      </section>

      <form onSubmit={salvarLimites}>
        <section className="orcamentos__painel" aria-labelledby="tabela-orcamentos-titulo">
          <div className="orcamentos__tabela-cabecalho">
            <div>
              <h2 id="tabela-orcamentos-titulo">Acompanhamento por categoria</h2>
              <p>Os gastos são calculados automaticamente a partir dos lançamentos do mês.</p>
            </div>
            <button type="submit" className="orcamentos__salvar">
              Salvar limites
            </button>
          </div>

          <div className="orcamentos__tabela-container">
            <table className="orcamentos__tabela">
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col">Limite mensal</th>
                  <th scope="col">Gasto realizado</th>
                  <th scope="col">Saldo disponível</th>
                  <th scope="col">% utilizado</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.categoria}>
                    <th scope="row">{linha.categoria}</th>
                    <td>
                      {linha.naoAplicavel ? (
                        <span className="orcamentos__na">Não aplicável</span>
                      ) : (
                        <label className="orcamentos__limite-input">
                          <span className="orcamentos__sr-only">
                            Limite mensal para {linha.categoria}
                          </span>
                          <span aria-hidden="true">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={limites[linha.categoria] ?? ""}
                            onChange={(event) =>
                              atualizarLimite(linha.categoria, event.target.value)
                            }
                            required
                          />
                        </label>
                      )}
                    </td>
                    <td>{formatarValor(linha.gastoCentavos / 100)}</td>
                    <td className={linha.saldoCentavos < 0 ? "orcamentos__valor--negativo" : ""}>
                      {linha.naoAplicavel ? "—" : formatarValor(linha.saldoCentavos / 100)}
                    </td>
                    <td>
                      {linha.naoAplicavel || linha.limiteCentavos === 0
                        ? "—"
                        : `${linha.status.percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                      {!linha.naoAplicavel && (
                        <div
                          className="orcamentos__progresso"
                          role="progressbar"
                          aria-label={`Limite utilizado em ${linha.categoria}`}
                          aria-valuenow={Math.min(linha.status.percentual, 100)}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          <span
                            className={`orcamentos__progresso-barra orcamentos__progresso-barra--${linha.status.classe}`}
                            style={{ width: `${Math.min(linha.status.percentual, 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`orcamentos__status orcamentos__status--${linha.status.classe}`}>
                        {linha.status.texto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td>{formatarValor(totais.limite / 100)}</td>
                  <td>{formatarValor(totais.gasto / 100)}</td>
                  <td>{formatarValor((totais.limite - totais.gasto) / 100)}</td>
                  <td>
                    {totais.limite === 0
                      ? "—"
                      : `${((totais.gasto / totais.limite) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                  </td>
                  <td>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {erro && <p className="orcamentos__mensagem orcamentos__mensagem--erro" role="alert">{erro}</p>}
          {mensagem && <p className="orcamentos__mensagem" role="status">{mensagem}</p>}
          <p className="orcamentos__nota">
            Os valores sugeridos podem ser alterados. A categoria Renda não se aplica a limites de despesas.
          </p>
        </section>
      </form>
    </main>
  );
}

export default Orcamentos;
