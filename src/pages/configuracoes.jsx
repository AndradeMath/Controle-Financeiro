import { Download, Moon, Sun } from "lucide-react";
import { useState } from "react";
import "./configuracoes.css";

function Configuracoes({
  tema,
  onTemaChange,
  erro,
  lancamentos,
  orcamentos,
  cartoes,
  centrosDeCusto,
  metasEconomia,
  mesSelecionado,
  onMesChange,
}) {
  const modoEscuro = tema === "escuro";
  const [erroExportacao, setErroExportacao] = useState("");
  const [sucessoExportacao, setSucessoExportacao] = useState("");

  async function exportarExcel() {
    setErroExportacao("");
    setSucessoExportacao("");
    try {
      const { exportarDadosParaExcel } = await import("../services/exportarExcel");
      const nomeArquivo = exportarDadosParaExcel({
        lancamentos,
        orcamentos,
        cartoes,
        centrosDeCusto,
        metasEconomia,
        mesSelecionado,
      });
      setSucessoExportacao(`Arquivo ${nomeArquivo} exportado com sucesso.`);
    } catch {
      setErroExportacao(
        "Não foi possível exportar os dados. Tente novamente ou confira se o navegador permite downloads.",
      );
    }
  }

  return (
    <main className="configuracoes">
      <header className="configuracoes__cabecalho">
        <p className="configuracoes__identificacao">PREFERÊNCIAS</p>
        <h1>Configurações</h1>
        <p>Personalize a aparência do seu espaço financeiro.</p>
      </header>

      <section className="configuracoes__painel" aria-labelledby="aparencia-titulo">
        <div className="configuracoes__icone" aria-hidden="true">
          {modoEscuro ? <Moon size={22} /> : <Sun size={22} />}
        </div>
        <div className="configuracoes__texto">
          <h2 id="aparencia-titulo">Aparência</h2>
          <p>Escolha o tema que deixa sua experiência mais confortável.</p>
        </div>
        <label className="configuracoes__alternador">
          <span>Modo noturno</span>
          <input
            type="checkbox"
            role="switch"
            checked={modoEscuro}
            onChange={(event) =>
              onTemaChange(event.target.checked ? "escuro" : "claro")
            }
            aria-label="Ativar modo noturno"
          />
          <span className="configuracoes__trilho" aria-hidden="true" />
        </label>
        <p className="configuracoes__estado" role="status">
          Tema atual: {modoEscuro ? "Noturno" : "Claro"}
        </p>
        {erro && <p className="configuracoes__erro" role="alert">{erro}</p>}
      </section>

      <section className="configuracoes__painel configuracoes__painel--exportacao" aria-labelledby="exportacao-titulo">
        <div className="configuracoes__icone configuracoes__icone--exportacao" aria-hidden="true">
          <Download size={22} />
        </div>
        <div className="configuracoes__texto">
          <h2 id="exportacao-titulo">Exportar para Excel</h2>
          <p>
            Baixe um arquivo .xlsx com resumo, lançamentos, orçamento, cartões,
            parcelamentos e centros de custo.
          </p>
        </div>
        <label className="configuracoes__filtro-exportacao">
          Mês de referência dos resumos
          <input
            type="month"
            value={mesSelecionado}
            onChange={(event) => onMesChange(event.target.value)}
          />
        </label>
        <button
          className="configuracoes__exportar"
          type="button"
          onClick={exportarExcel}
        >
          <Download size={17} aria-hidden="true" />
          Exportar arquivo
        </button>
        {erroExportacao && (
          <p className="configuracoes__erro-exportacao" role="alert">
            {erroExportacao}
          </p>
        )}
        {sucessoExportacao && (
          <p className="configuracoes__sucesso-exportacao" role="status">
            {sucessoExportacao}
          </p>
        )}
      </section>
    </main>
  );
}

export default Configuracoes;
