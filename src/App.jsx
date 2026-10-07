import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  Settings,
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
import {
  carregarCartoes,
  carregarLancamentos,
  carregarMetasEconomia,
  carregarOrcamentos,
  salvarCartoes,
  salvarMetasEconomia,
  salvarOrcamentos,
} from "./services/storage";
import "./App.css";

const paginas = [
  { caminho: "/dashboard", nome: "Dashboard", Icone: LayoutDashboard },
  { caminho: "/lancamentos", nome: "Lançamentos", Icone: ArrowLeftRight },
  { caminho: "/orcamentos", nome: "Orçamentos", Icone: ChartNoAxesCombined },
  { caminho: "/cartoes", nome: "Cartões", Icone: CreditCard },
  { caminho: "/configuracoes", nome: "Configurações", Icone: Settings },
];

function PaginaEmConstrucao({ titulo }) {
  return (
    <main className="pagina-placeholder">
      <p className="pagina-placeholder__identificacao">CONTROLE FINANCEIRO</p>
      <h1>{titulo}</h1>
      <section className="pagina-placeholder__painel">
        <h2>Em breve</h2>
        <p>Esta área está sendo preparada e estará disponível em breve.</p>
      </section>
    </main>
  );
}

function App() {
  const [lancamentos, setLancamentos] = useState(carregarLancamentos);
  const [orcamentos, setOrcamentos] = useState(carregarOrcamentos);
  const [cartoes, setCartoes] = useState(carregarCartoes);
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

  function atualizarMetasEconomia(novasMetas) {
    salvarMetasEconomia(novasMetas);
    setMetasEconomia(novasMetas);
  }

  return (
    <div className="app">
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
            path="/configuracoes"
            element={<PaginaEmConstrucao titulo="Configurações" />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
