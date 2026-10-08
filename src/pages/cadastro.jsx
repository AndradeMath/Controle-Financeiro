import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./login.css";

function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [cadastrando, setCadastrando] = useState(false);

  async function cadastrar(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (senha !== confirmacaoSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCadastrando(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(`Não foi possível criar a conta: ${error.message}`);
        return;
      }

      if (!data.session) {
        setSucesso(
          "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",
        );
      }
    } catch (erroCadastro) {
      setErro(`Não foi possível criar a conta: ${erroCadastro.message}`);
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <main className="login">
      <section className="login__cartao" aria-labelledby="cadastro-titulo">
        <div className="login__marca">
          <span className="login__marca-icone" aria-hidden="true">C</span>
          <span>Meu Financeiro</span>
        </div>

        <div className="login__introducao">
          <span className="login__selo">
            <LockKeyhole size={15} aria-hidden="true" />
            Nova conta
          </span>
          <h1 id="cadastro-titulo">Criar usuário</h1>
          <p>Informe seu e-mail e crie uma senha para começar.</p>
        </div>

        <form className="login__formulario" onSubmit={cadastrar}>
          <label htmlFor="cadastro-email">E-mail</label>
          <input
            id="cadastro-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            required
            autoFocus
          />

          <label htmlFor="cadastro-senha">Senha</label>
          <input
            id="cadastro-senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Mínimo de 6 caracteres"
            minLength={6}
            required
          />

          <label htmlFor="cadastro-confirmacao">Confirmar senha</label>
          <input
            id="cadastro-confirmacao"
            type="password"
            autoComplete="new-password"
            value={confirmacaoSenha}
            onChange={(event) => setConfirmacaoSenha(event.target.value)}
            placeholder="Digite a senha novamente"
            minLength={6}
            required
          />

          {erro && (
            <p className="login__erro" role="alert">
              {erro}
            </p>
          )}
          {sucesso && (
            <p className="cadastro__sucesso" role="status">
              {sucesso}
            </p>
          )}

          <button
            className="login__botao"
            type="submit"
            disabled={cadastrando}
          >
            <span>{cadastrando ? "Criando conta..." : "Criar conta"}</span>
            {!cadastrando && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <p className="login__alternativa">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}

export default Cadastro;
