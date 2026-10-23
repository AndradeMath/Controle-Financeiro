import { Download, Moon, Sun, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { validarBackupJson } from "../services/validarBackupJson";
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
  onRestaurarBackup,
  statusBackupLocal,
}) {
  const modoEscuro = tema === "escuro";
  const inputArquivoRef = useRef(null);
  const [arquivoBackup, setArquivoBackup] = useState(null);
  const [erroExportacao, setErroExportacao] = useState("");
  const [sucessoExportacao, setSucessoExportacao] = useState("");
  const [erroExportacaoJson, setErroExportacaoJson] = useState("");
  const [sucessoExportacaoJson, setSucessoExportacaoJson] = useState("");
  const [erroRestauracao, setErroRestauracao] = useState("");
  const [sucessoRestauracao, setSucessoRestauracao] = useState("");
  const [restaurando, setRestaurando] = useState(false);

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

  async function exportarJson() {
    setErroExportacaoJson("");
    setSucessoExportacaoJson("");
    try {
      const { exportarDadosParaJson } = await import("../services/exportarJson");
      const nomeArquivo = exportarDadosParaJson({
        lancamentos,
        orcamentos,
        cartoes,
        centrosDeCusto,
        metasEconomia,
        tema,
      });
      setSucessoExportacaoJson(`Arquivo ${nomeArquivo} exportado com sucesso.`);
    } catch {
      setErroExportacaoJson(
        "Não foi possível exportar os dados em JSON. Tente novamente ou confira se o navegador permite downloads.",
      );
    }
  }

  async function restaurarBackup() {
    if (!arquivoBackup) return;

    setErroRestauracao("");
    setSucessoRestauracao("");
    setRestaurando(true);
    try {
      const backup = validarBackupJson(await arquivoBackup.text());
      const confirmado = window.confirm(
        "Restaurar este backup substituirá seus lançamentos, cartões, orçamentos, centros de custo, metas e tema atuais. Deseja continuar?",
      );
      if (!confirmado) return;

      await onRestaurarBackup(backup);
      setSucessoRestauracao(
        `Backup ${arquivoBackup.name} restaurado com sucesso.`,
      );
      setArquivoBackup(null);
      if (inputArquivoRef.current) inputArquivoRef.current.value = "";
    } catch (erro) {
      setErroRestauracao(
        erro instanceof Error
          ? erro.message
          : "Não foi possível concluir a restauração. Tente novamente.",
      );
    } finally {
      setRestaurando(false);
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

      <section
        className="configuracoes__painel configuracoes__painel--backup-local"
        aria-labelledby="backup-local-titulo"
      >
        <div className="configuracoes__icone configuracoes__icone--exportacao" aria-hidden="true">
          <Download size={22} />
        </div>
        <div className="configuracoes__texto">
          <h2 id="backup-local-titulo">Backup automático neste dispositivo</h2>
          <p>
            Seus dados são copiados automaticamente para o IndexedDB deste
            navegador e carregados novamente quando você voltar.
          </p>
        </div>
        <p
          className={statusBackupLocal.estado === "erro"
            ? "configuracoes__erro"
            : "configuracoes__estado"}
          role={statusBackupLocal.estado === "erro" ? "alert" : "status"}
          aria-live="polite"
        >
          {statusBackupLocal.estado === "salvando"
            ? "Atualizando o backup local..."
            : statusBackupLocal.mensagem}
        </p>
      </section>

      <section className="configuracoes__painel configuracoes__painel--exportacao" aria-labelledby="exportacao-titulo">
        <div className="configuracoes__icone configuracoes__icone--exportacao" aria-hidden="true">
          <Download size={22} />
        </div>
        <div className="configuracoes__texto">
          <h2 id="exportacao-titulo">Exportar dados</h2>
          <p>
            Baixe um relatório .xlsx ou um backup completo em JSON, pronto para
            restaurar seus dados em outro momento.
          </p>
        </div>
        <div className="configuracoes__acoes-exportacao">
          <label className="configuracoes__filtro-exportacao">
            Mês de referência dos resumos
            <input
              type="month"
              value={mesSelecionado}
              onChange={(event) => onMesChange(event.target.value)}
            />
          </label>
          <div className="configuracoes__botoes-exportacao">
            <button
              className="configuracoes__exportar"
              type="button"
              onClick={exportarExcel}
            >
              <Download size={17} aria-hidden="true" />
              Exportar Excel
            </button>
            <button
              className="configuracoes__exportar configuracoes__exportar--json"
              type="button"
              onClick={exportarJson}
            >
              <Download size={17} aria-hidden="true" />
              Exportar JSON
            </button>
          </div>
        </div>
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
        {erroExportacaoJson && (
          <p className="configuracoes__erro-exportacao" role="alert">
            {erroExportacaoJson}
          </p>
        )}
        {sucessoExportacaoJson && (
          <p className="configuracoes__sucesso-exportacao" role="status">
            {sucessoExportacaoJson}
          </p>
        )}
      </section>

      <section
        className="configuracoes__painel configuracoes__painel--restauracao"
        aria-labelledby="restaurar-backup-titulo"
        aria-busy={restaurando}
      >
        <div
          className="configuracoes__icone configuracoes__icone--restauracao"
          aria-hidden="true"
        >
          <Upload size={22} />
        </div>
        <div className="configuracoes__texto">
          <h2 id="restaurar-backup-titulo">Restaurar backup</h2>
          <p>
            Escolha um arquivo JSON exportado pelo Meu Financeiro. A restauração
            substitui os dados atuais pelos dados do backup.
          </p>
        </div>
        <div className="configuracoes__acoes-restauracao">
          <input
            ref={inputArquivoRef}
            className="configuracoes__input-arquivo"
            type="file"
            accept=".json,application/json"
            aria-label="Arquivo JSON de backup"
            onChange={(event) => {
              setArquivoBackup(event.target.files?.[0] ?? null);
              setErroRestauracao("");
              setSucessoRestauracao("");
            }}
          />
          <button
            className="configuracoes__escolher-arquivo"
            type="button"
            onClick={() => inputArquivoRef.current?.click()}
            disabled={restaurando}
          >
            <Upload size={17} aria-hidden="true" />
            Escolher arquivo
          </button>
          {arquivoBackup && (
            <span className="configuracoes__nome-arquivo">
              {arquivoBackup.name}
            </span>
          )}
          <button
            className="configuracoes__restaurar"
            type="button"
            onClick={restaurarBackup}
            disabled={!arquivoBackup || restaurando}
          >
            {restaurando ? "Restaurando..." : "Restaurar backup"}
          </button>
        </div>
        {erroRestauracao && (
          <p className="configuracoes__erro-exportacao" role="alert">
            {erroRestauracao}
          </p>
        )}
        {sucessoRestauracao && (
          <p className="configuracoes__sucesso-exportacao" role="status">
            {sucessoRestauracao}
          </p>
        )}
      </section>
    </main>
  );
}

export default Configuracoes;
