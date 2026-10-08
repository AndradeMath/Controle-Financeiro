import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  const autenticacao = useContext(AuthContext);

  if (!autenticacao) {
    throw new Error("useAuth deve ser usado dentro de AuthContext.Provider.");
  }

  return autenticacao;
}
