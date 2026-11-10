/** Mede, em vários tamanhos de tela, rolagem horizontal e elementos que passam da largura. Uso: node scripts/e2e/responsivo.cjs [url-base] */
const { chromium } = require('playwright-core');
const BASE = process.argv[2] || 'http://localhost:5173';
const SIZES = [[320, 640], [360, 740], [414, 860], [600, 900], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1536, 864], [1920, 1080], [2560, 1300], [3440, 1440]];
const ROUTES = ['/', '/vault', '/novo', '/personagens', '/inventario', '/recarga', '/comparar?a=exemplo&b=exemplo', '/projeto/exemplo', '/projeto/exemplo/personagem/Mavuika', '/projeto/exemplo/personagem/Mavuika?aba=otimizar', '/projeto/exemplo/rotacao', '/projeto/exemplo/armas', '/projeto/exemplo/recarga', '/card/exemplo', '/entrar'];
(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || 'msedge', headless: true });
  const bad = [];
  for (const [w, h] of SIZES) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    for (const r of ROUTES) {
      await page.goto(BASE + r, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(1200);
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        const wide = [];
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (b.width && b.right > vw + 2 && getComputedStyle(el).position !== 'fixed') {
            let p = el.parentElement, clipped = false;
            while (p && p !== document.body) { const o = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 2) { clipped = true; break; } p = p.parentElement; }
            if (!clipped) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}(+${Math.round(b.right - vw)})`);
          }
        }
        return { over: sw - vw, wide: [...new Set(wide)].slice(0, 5) };
      });
      if (res.over > 2 || res.wide.length) bad.push(`${w}px ${r}: rolagem +${res.over}px ${res.wide.join(' ')}`);
    }
    await page.close();
  }
  await browser.close();
  console.log(bad.length ? bad.join('\n') : 'nenhum problema');
  console.log(`\n${bad.length} problemas em ${SIZES.length * ROUTES.length} combinações`);
})();
