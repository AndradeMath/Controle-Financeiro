import "./parcelamentos.css";

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data) {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${data}T00:00:00`),
  );
}

function Parcelamentos({ lancamentos, cartoes }) {
  const compras = lancamentos
    .map((lancamento, indice) => ({ ...lancamento, indice }))
    .filter(
      (lancamento) =>
        lancamento.tipo === "Despesa" &&
        lancamento.cartaoId,
    )
    .map((lancamento) => {
      const totalParcelas = Math.max(
        1,
        Math.floor(Number(lancamento.totalParcelas) || 1),
      );
      const parcelaAtual = Math.min(
        totalParcelas,
        Math.max(1, Math.floor(Number(lancamento.parcelaAtual) || 1)),
      );
      const valorTotalCentavos = Math.round(
        (Number(lancamento.valor) || 0) * 100,
      );
      const valorParcelaCentavos = Math.round(
        valorTotalCentavos / totalParcelas,
      );
      const parcelasRestantes = totalParcelas - parcelaAtual;
      const saldoAParcelarCentavos = Math.max(
        0,
        valorTotalCentavos - valorParcelaCentavos * parcelaAtual,
      );
      const cartao = cartoes.find(
        (item) => item.id === lancamento.cartaoId,
      );

      return {
        ...lancamento,
        cartaoNome: cartao?.nome || cartao?.banco || "Cartão removido",
        totalParcelas,
        parcelaAtual,
        valorTotalCentavos,
        valorParcelaCentavos,
        parcelasRestantes,
        saldoAParcelarCentavos,
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data) || b.indice - a.indice);

  const parcelamentosAtivos = compras.filter(
    (compra) => compra.parcelasRestantes > 0,
  );
  const valorTotalCentavos = compras.reduce(
    (total, compra) => total + compra.valorTotalCentavos,
    0,
  );
  const saldoAParcelarCentavos = compras.reduce(
    (total, compra) => total + compra.saldoAParcelarCentavos,
    0,
  );

  return (
    <main className="parcelamentos">
      <header className="parcelamentos__cabecalho">
        <p className="parcelamentos__identificacao">ORGANIZAÇÃO DE COMPRAS</p>
        <h1>Controle de parcelamentos</h1>
        <p>Acompanhe as compras feitas nos seus cartões e as parcelas restantes.</p>
      </header>

      <section
        className="parcelamentos__resumo"
        aria-label="Resumo de parcelamentos"
      >
        <article className="parcelamentos__indicador parcelamentos__indicador--ativos">
          <span>Parcelamentos ativos</span>
          <strong>{parcelamentosAtivos.length}</strong>
          <small>Compras com parcelas pendentes</small>
        </article>
        <article className="parcelamentos__indicador parcelamentos__indicador--total">
          <span>Valor total das compras</span>
          <strong>{formatarValor(valorTotalCentavos / 100)}</strong>
          <small>{compras.length} {compras.length === 1 ? "compra cadastrada" : "compras cadastradas"}</small>
        </article>
        <article className="parcelamentos__indicador parcelamentos__indicador--saldo">
          <span>Saldo a parcelar</span>
          <strong>{formatarValor(saldoAParcelarCentavos / 100)}</strong>
          <small>Valor das parcelas futuras</small>
        </article>
      </section>

      <section
        className="parcelamentos__painel"
        aria-labelledby="parcelamentos-tabela-titulo"
      >
        <div className="parcelamentos__painel-cabecalho">
          <div>
            <h2 id="parcelamentos-tabela-titulo">Compras no cartão</h2>
            <p>As informações são atualizadas pelos lançamentos associados aos cartões.</p>
          </div>
          <span className="parcelamentos__contador">
            {compras.length} {compras.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {compras.length === 0 ? (
          <div className="parcelamentos__vazio">
            <span aria-hidden="true">▤</span>
            <strong>Nenhuma compra no cartão cadastrada</strong>
            <p>
              Ao criar ou editar uma despesa, selecione um cartão e informe a
              parcela atual e o total de parcelas.
            </p>
          </div>
        ) : (
          <div className="parcelamentos__tabela-container">
            <table className="parcelamentos__tabela">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Data</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Cartão</th>
                  <th scope="col">Valor total</th>
                  <th scope="col">Parcela atual</th>
                  <th scope="col">Total parcelas</th>
                  <th scope="col">Valor da parcela</th>
                  <th scope="col">Parcelas restantes</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={`${compra.data}-${compra.descricao}-${compra.indice}`}>
                    <td>{compra.indice + 1}</td>
                    <td>{formatarData(compra.data)}</td>
                    <th scope="row">{compra.descricao}</th>
                    <td>
                      <span className={`parcelamentos__cartao parcelamentos__cartao--${compra.cartaoId}`}>
                        {compra.cartaoNome}
                      </span>
                    </td>
                    <td>{formatarValor(compra.valorTotalCentavos / 100)}</td>
                    <td>{compra.parcelaAtual} de {compra.totalParcelas}</td>
                    <td>{compra.totalParcelas}</td>
                    <td>{formatarValor(compra.valorParcelaCentavos / 100)}</td>
                    <td>
                      <span
                        className={
                          compra.parcelasRestantes > 0
                            ? "parcelamentos__restantes"
                            : "parcelamentos__quitado"
                        }
                      >
                        {compra.parcelasRestantes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan="4">Total</th>
                  <td>{formatarValor(valorTotalCentavos / 100)}</td>
                  <td colSpan="3">—</td>
                  <td>{formatarValor(saldoAParcelarCentavos / 100)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="parcelamentos__nota">
          Cadastre compras à vista como 1 de 1. O saldo a parcelar considera
          somente as parcelas posteriores à parcela atual.
        </p>
      </section>
    </main>
  );
}

export default Parcelamentos;
