/**
 * Depois de um deploy novo o navegador pode abrir um index.html antigo, que aponta para arquivos (inclusive o do Worker) que não existem
 * mais. Nesse caso recarrega a página UMA vez; o marcador em sessionStorage impede o laço de recargas. O marcador some depois de alguns
 * segundos de uso normal, para um deploy futuro poder recarregar de novo.
 */
const KEY = 'astralys:recarregou-por-deploy';

export function reloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  location.reload();
  return true;
}

/** Liga o tratamento do `vite:preloadError` (arquivo da aplicação que sumiu) e limpa o marcador quando o app já está de pé. */
export function installDeployRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnce();
  });
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* sem sessionStorage: nada a limpar */
    }
  }, 8000);
}
