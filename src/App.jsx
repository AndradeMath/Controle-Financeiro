import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Settings,
  Tags,
} from "lucide-react";
import { useState } from "react";
import {
  Navigate,
  Link,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Lancamentos from "./pages/lancamentos";
import Orcamentos from "./pages/orcamentos";
import Cartoes from "./pages/cartoes";
import Parcelamentos from "./pages/parcelamentos";
import CentrosDeCusto from "./pages/centros-de-custo";
import Configuracoes from "./pages/configuracoes";
import {
  carregarCartoes,
  carregarCentrosDeCusto,
  carregarLancamentos,
  carregarMetasEconomia,
  carregarOrcamentos,
  salvarCartoes,
  salvarCentrosDeCusto,
  salvarMetasEconomia,
  salvarOrcamentos,
} from "./services/storage";
import "./App.css";

const paginas = [
  { caminho: "/dashboard", nome: "Dashboard", Icone: LayoutDashboard },
  { caminho: "/lancamentos", nome: "Lançamentos", Icone: ArrowLeftRight },
  { caminho: "/orcamentos", nome: "Orçamentos", Icone: ChartNoAxesCombined },
  { caminho: "/cartoes", nome: "Cartões", Icone: CreditCard },
  { caminho: "/parcelamentos", nome: "Parcelamentos", Icone: ListChecks },
  { caminho: "/centros-de-custo", nome: "Centros de custo", Icone: Tags },
  { caminho: "/configuracoes", nome: "Configurações", Icone: Settings },
];

function App() {
  const [tema, setTema] = useState(() => {
    const temaSalvo = localStorage.getItem("tema");
    return temaSalvo === "escuro" ? "escuro" : "claro";
  });
  const [erroTema, setErroTema] = useState("");
  const [lancamentos, setLancamentos] = useState(carregarLancamentos);
  const [orcamentos, setOrcamentos] = useState(carregarOrcamentos);
  const [cartoes, setCartoes] = useState(carregarCartoes);
  const [centrosDeCusto, setCentrosDeCusto] = useState(carregarCentrosDeCusto);
  const [metasEconomia, setMetasEconomia] = useState(carregarMetasEconomia);
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${hoje.getFullYear()}-${mes}`;
  });
  const lancamentosDoMes = lancamentos.filter((lancamento) =>
    lancamento.data.startsWith(mesSelecionado),
  );

  function atualizarOrcamentos(novosOrcamentos) {
    salvarOrcamentos(novosOrcamentos);
    setOrcamentos(novosOrcamentos);
  }

  function atualizarCartoes(novosCartoes) {
    salvarCartoes(novosCartoes);
    setCartoes(novosCartoes);
  }

  function atualizarCentrosDeCusto(novosCentros) {
    salvarCentrosDeCusto(novosCentros);
    setCentrosDeCusto(novosCentros);
  }

  function atualizarMetasEconomia(novasMetas) {
    salvarMetasEconomia(novasMetas);
    setMetasEconomia(novasMetas);
  }

  function atualizarTema(novoTema) {
    try {
      localStorage.setItem("tema", novoTema);
      setTema(novoTema);
      setErroTema("");
    } catch {
      setErroTema("Não foi possível salvar sua preferência neste navegador.");
    }
  }

  return (
    <div className="app" data-tema={tema}>
      <aside className="barra-lateral">
        <Link className="barra-lateral__marca" to="/dashboard">
          <span className="barra-lateral__marca-icone" aria-hidden="true">C</span>
          <span>Meu Financeiro</span>
        </Link>

        <nav className="barra-lateral__nav" aria-label="Navegação principal">
          <p className="barra-lateral__rotulo">MENU</p>
          {paginas.map(({ caminho, nome, Icone }) => (
            <NavLink
              key={caminho}
              to={caminho}
              className={({ isActive }) =>
                `barra-lateral__link${isActive ? " barra-lateral__link--ativo" : ""}`
              }
            >
              <Icone size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{nome}</span>
            </NavLink>
          ))}
        </nav>

        <p className="barra-lateral__rodape">Suas finanças, organizadas.</p>
      </aside>

      <div className="app__conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                lancamentos={lancamentos}
                mesSelecionado={mesSelecionado}
                onMesChange={setMesSelecionado}
                orcamentos={orcamentos}
                cartoes={cartoes}
                centrosDeCusto={centrosDeCusto}
                metasEconomia={metasEconomia}
                onMetasEconomiaChange={atualizarMetasEconomia}
              />
            }
          />
          <Route
            path="/lancamentos"
            element={
              <Lancamentos
                lancamentos={lancamentos}
                cartoes={cartoes}
                centrosDeCusto={centrosDeCusto}
                mesSelecionado={mesSelecionado}
                onLancamentosChange={setLancamentos}
              />
            }
          />
          <Route
            path="/orcamentos"
            element={
              <Orcamentos
                key={mesSelecionado}
                lancamentos={lancamentosDoMes}
                mesSelecionado={mesSelecionado}
                onMesChange={setMesSelecionado}
                orcamentos={orcamentos}
                onOrcamentosChange={atualizarOrcamentos}
              />
            }
          />
          <Route
            path="/cartoes"
            element={
              <Cartoes
                key={mesSelecionado}
                cartoes={cartoes}
                lancamentos={lancamentosDoMes}
                mesSelecionado={mesSelecionado}
                onMesChange={setMesSelecionado}
                onCartoesChange={atualizarCartoes}
              />
            }
          />
          <Route
            path="/parcelamentos"
            element={
              <Parcelamentos
                lancamentos={lancamentos}
                cartoes={cartoes}
              />
            }
          />
          <Route
            path="/centros-de-custo"
            element={
              <CentrosDeCusto
                centros={centrosDeCusto}
                lancamentos={lancamentosDoMes}
                mesSelecionado={mesSelecionado}
                onMesChange={setMesSelecionado}
                onCentrosChange={atualizarCentrosDeCusto}
              />
            }
          />
          <Route
            path="/configuracoes"
            element={
              <Configuracoes
                tema={tema}
                onTemaChange={atualizarTema}
                erro={erroTema}
                lancamentos={lancamentos}
                orcamentos={orcamentos}
                cartoes={cartoes}
                centrosDeCusto={centrosDeCusto}
                metasEconomia={metasEconomia}
                mesSelecionado={mesSelecionado}
                onMesChange={setMesSelecionado}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
