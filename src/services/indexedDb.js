const NOME_BANCO = "meu-financeiro";
const VERSAO_BANCO = 1;
const NOME_ARMAZENAMENTO = "dados-usuario";
let filaDeGravacao = Promise.resolve();

function abrirBanco() {
  if (!globalThis.indexedDB) {
    return Promise.reject(
      new Error("Este navegador não oferece suporte ao IndexedDB."),
    );
  }

  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result;
      if (!banco.objectStoreNames.contains(NOME_ARMAZENAMENTO)) {
        banco.createObjectStore(NOME_ARMAZENAMENTO, { keyPath: "usuarioId" });
      }
    };
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () =>
      reject(new Error(`Não foi possível abrir o backup local: ${requisicao.error?.message || "erro desconhecido"}`));
    requisicao.onblocked = () =>
      reject(new Error("O backup local está bloqueado por outra aba aberta."));
  });
}

export async function carregarBackupLocal(usuarioId) {
  const banco = await abrirBanco();

  return new Promise((resolve, reject) => {
    const transacao = banco.transaction(NOME_ARMAZENAMENTO, "readonly");
    const requisicao = transacao.objectStore(NOME_ARMAZENAMENTO).get(usuarioId);

    requisicao.onsuccess = () => resolve(requisicao.result ?? null);
    requisicao.onerror = () =>
      reject(new Error(`Não foi possível ler o backup local: ${requisicao.error?.message || "erro desconhecido"}`));
    transacao.oncomplete = () => banco.close();
    transacao.onerror = () => {
      banco.close();
      reject(new Error(`Não foi possível ler o backup local: ${transacao.error?.message || "erro desconhecido"}`));
    };
  });
}

function gravarBackupLocal(usuarioId, dados) {
  return abrirBanco().then((banco) => {
    const salvoEm = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const transacao = banco.transaction(NOME_ARMAZENAMENTO, "readwrite");
      transacao.objectStore(NOME_ARMAZENAMENTO).put({
        usuarioId,
        salvoEm,
        dados,
      });
      transacao.oncomplete = () => {
        banco.close();
        resolve(salvoEm);
      };
      transacao.onerror = () => {
        banco.close();
        reject(new Error(`Não foi possível atualizar o backup local: ${transacao.error?.message || "erro desconhecido"}`));
      };
      transacao.onabort = () => {
        banco.close();
        reject(new Error(`A atualização do backup local foi cancelada: ${transacao.error?.message || "erro desconhecido"}`));
      };
    });
  });
}

export function salvarBackupLocal(usuarioId, dados) {
  const gravacao = filaDeGravacao.then(() =>
    gravarBackupLocal(usuarioId, dados),
  );
  filaDeGravacao = gravacao.catch(() => {});
  return gravacao;
}
