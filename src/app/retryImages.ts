/** Se uma imagem do Lunaris falha (ele oscila), tenta de novo no mesmo endereço antes de o React trocar por a letra (onError). */
const MAX_TRIES = 8;

export function installImageRetry() {
  window.addEventListener(
    'error',
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.src.startsWith('https://api.lunaris.moe/')) return;
      const tries = Number(img.dataset.tries ?? 0);
      if (tries >= MAX_TRIES) return;
      e.stopImmediatePropagation();
      img.dataset.tries = String(tries + 1);
      const src = img.src;
      setTimeout(() => { if (img.isConnected) img.src = src; }, Math.min(1000 * (tries + 1), 6000) + Math.random() * 1000);
    },
    true,
  );
}
