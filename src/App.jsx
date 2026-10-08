import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Tags,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Link,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Cadastro from "./pages/cadastro";
import Lancamentos from "./pages/lancamentos";
import Orcamentos from "./pages/orcamentos";
import Cartoes from "./pages/cartoes";
import Parcelamentos from "./pages/parcelamentos";
import CentrosDeCusto from "./pages/centros-de-custo";
import Configuracoes from "./pages/configuracoes";
import {
  carregarCartoes,
  carregarCentrosDeCusto,
  carregarMetasEconomia,
  carregarOrcamentos,
  salvarCartoes,
  salvarCentrosDeCusto,
  salvarMetasEconomia,
  salvarOrcamentos,
} from "./services/storage";
import { supabase } from "./lib/supabase";
import { AuthContext } from "./contexts/AuthContext";
import { carregarLancamentosDoUsuario } from "./services/lancamentosSupabase";
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
  const [sessao, setSessao] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [erroSessao, setErroSessao] = useState("");
  const [erroSaida, setErroSaida] = useState("");
  const [lancamentosCarregadosParaUsuarioId, setLancamentosCarregadosParaUsuarioId] = useState(null);
  const [erroLancamentos, setErroLancamentos] = useState(null);
  const [tentativaCargaLancamentos, setTentativaCargaLancamentos] = useState(0);
  const contextoAutenticacao = useMemo(
    () => ({
      session: sessao,
      user: sessao?.user ?? null,
      usuarioId: sessao?.user?.id ?? null,
    }),
    [sessao],
  );
  const [tema, setTema] = useState(() => {
    const temaSalvo = localStorage.getItem("tema");
    return temaSalvo === "escuro" ? "escuro" : "claro";
  });
  const [erroTema, setErroTema] = useState("");
  const [lancamentos, setLancamentos] = useState([]);
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

  useEffect(() => {
    let componenteAtivo = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (!componenteAtivo) return;
      setSessao(novaSessao);
      setCarregandoSessao(false);
      setErroSessao("");
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!componenteAtivo) return;
        setSessao(data.session);
        setCarregandoSessao(false);
      })
      .catch((erro) => {
        if (!componenteAtivo) return;
        setErroSessao(erro.message);
        setCarregandoSessao(false);
      });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const usuarioId = sessao?.user?.id;
    let componenteAtivo = true;

    if (!usuarioId) {
      return () => {
        componenteAtivo = false;
      };
    }

    carregarLancamentosDoUsuario(usuarioId)
      .then((dados) => {
        if (!componenteAtivo) return;
        setLancamentos(dados);
        setLancamentosCarregadosParaUsuarioId(usuarioId);
        setErroLancamentos(null);
      })
      .catch((erro) => {
        if (componenteAtivo) {
          setErroLancamentos({ usuarioId, mensagem: erro.message });
        }
      });

    return () => {
      componenteAtivo = false;
    };
  }, [sessao?.user?.id, tentativaCargaLancamentos]);

  async function sair() {
    setErroSaida("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setErroSaida(`Não foi possível sair: ${error.message}`);
    } catch (erro) {
      setErroSaida(`Não foi possível sair: ${erro.message}`);
    }
  }

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

  if (carregandoSessao) {
    return (
      <main className="autenticacao-carregando" role="status">
        Verificando sessão...
      </main>
    );
  }

  if (erroSessao) {
    return (
      <main className="autenticacao-carregando" role="alert">
        <p>Não foi possível verificar a sessão: {erroSessao}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  if (!sessao) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (
    lancamentosCarregadosParaUsuarioId !== sessao.user.id &&
    erroLancamentos?.usuarioId !== sessao.user.id
  ) {
    return (
      <main className="autenticacao-carregando" role="status">
        Carregando seus lançamentos...
      </main>
    );
  }

  if (erroLancamentos?.usuarioId === sessao.user.id) {
    return (
      <main className="autenticacao-carregando" role="alert">
        <p>{erroLancamentos.mensagem}</p>
        <button
          type="button"
          onClick={() => {
            setErroLancamentos(null);
            setTentativaCargaLancamentos((tentativa) => tentativa + 1);
          }}
        >
          Tentar novamente
        </button>
        <button type="button" onClick={sair}>
          Sair
        </button>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={contextoAutenticacao}>
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

        <div className="barra-lateral__conta">
          <p className="barra-lateral__usuario">{sessao.user.email}</p>
          <button
            className="barra-lateral__sair"
            type="button"
            onClick={sair}
          >
            <LogOut size={17} aria-hidden="true" />
            <span>Sair</span>
          </button>
          {erroSaida && (
            <p className="barra-lateral__erro" role="alert">{erroSaida}</p>
          )}
          <p className="barra-lateral__rodape">Suas finanças, organizadas.</p>
        </div>
        </aside>

        <div className="app__conteudo">
          <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/cadastro" element={<Navigate to="/dashboard" replace />} />
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
    </AuthContext.Provider>
  );
}

export default App;
