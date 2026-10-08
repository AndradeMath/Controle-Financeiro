import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(event) {
    event.preventDefault();
    setErro("");
    setEntrando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(
          error.message === "Invalid login credentials"
            ? "Login ou senha inválidos."
            : `Não foi possível entrar: ${error.message}`,
        );
      }
    } catch (erroLogin) {
      setErro(`Não foi possível entrar: ${erroLogin.message}`);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <main className="login">
      <section className="login__cartao" aria-labelledby="login-titulo">
        <div className="login__marca">
          <span className="login__marca-icone" aria-hidden="true">C</span>
          <span>Meu Financeiro</span>
        </div>

        <div className="login__introducao">
          <span className="login__selo">
            <LockKeyhole size={15} aria-hidden="true" />
            Acesso seguro
          </span>
          <h1 id="login-titulo">Bem-vindo de volta</h1>
          <p>Entre com seu login e senha para acessar suas finanças.</p>
        </div>

        <form className="login__formulario" onSubmit={entrar}>
          <label htmlFor="login-email">Login (e-mail)</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            required
            autoFocus
          />

          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Digite sua senha"
            required
          />

          {erro && (
            <p className="login__erro" role="alert">
              {erro}
            </p>
          )}

          <button className="login__botao" type="submit" disabled={entrando}>
            <span>{entrando ? "Entrando..." : "Entrar"}</span>
            {!entrando && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p className="login__rodape">
          Suas finanças, organizadas em um só lugar.
        </p>
        <p className="login__alternativa">
          Ainda não tem uma conta? <Link to="/cadastro">Criar usuário</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
