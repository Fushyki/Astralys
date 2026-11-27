/**
 * Mede, em vários tamanhos de tela, rolagem horizontal e elementos que passam da largura; e confere o notebook de 1366×768 a
 * 125%: sem rolagem horizontal e com o botão principal de cada tela à vista.
 * Uso: node scripts/e2e/responsivo.cjs [url-base] [--notebook]   (com --notebook, só a parte do notebook; é a que o `npm run e2e` roda)
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith('--')) || 'http://localhost:5173';
const OUT = path.join(__dirname, 'out');
const SIZES = [[320, 640], [360, 740], [414, 860], [600, 900], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1536, 864], [1920, 1080], [2560, 1300], [3440, 1440]];
const ROUTES = ['/', '/vault', '/novo', '/personagens', '/inventario', '/recarga', '/comparar?a=exemplo&b=exemplo', '/projeto/exemplo', '/projeto/exemplo/personagem/Mavuika', '/projeto/exemplo/personagem/Mavuika?aba=otimizar', '/projeto/exemplo/rotacao', '/projeto/exemplo/armas', '/projeto/exemplo/recarga', '/card/exemplo'];

/** Tela e o botão principal dela. */
const NOTEBOOK = [
  ['inicio', '/', 'a:has-text("Montar um time")'],
  ['times', '/vault', 'button.vt-plus'],
  ['equipe', '/projeto/exemplo', 'a:has-text("Próximo passo")'],
  ['rotacao', '/projeto/exemplo/rotacao', 'a:has-text("Gerar card")'],
  ['otimizador', '/projeto/exemplo/otimizador', 'a:has-text("Importar o inventário")'],
];
/**
 * `1366×768` com `deviceScaleFactor: 1.25` só aumenta a densidade. O zoom de 125% de verdade também encolhe a janela para
 * 1093×614 pontos CSS; ali o botão do Otimizador fica abaixo da dobra (a tela rola até ele), o que só mudaria reorganizando-a.
 */
const ZOOMS = [
  { nome: '1366x768', viewport: { width: 1366, height: 768 }, rola: [] },
  { nome: 'zoom125', viewport: { width: 1093, height: 614 }, rola: ['otimizador'] },
];

async function matrix(browser) {
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
  console.log(bad.length ? bad.join('\n') : 'nenhum problema');
  console.log(`\n${bad.length} problemas em ${SIZES.length * ROUTES.length} combinações`);
  return bad.length === 0;
}

async function notebook(browser) {
  fs.mkdirSync(OUT, { recursive: true });
  const results = [];
  const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
  for (const { nome, viewport, rola } of ZOOMS) {
    for (const [tela, url, main] of NOTEBOOK) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1.25 });
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      const button = page.locator(main).first();
      await button.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const over = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth);
      check(`${nome} ${url}: sem rolagem horizontal`, over <= 0, over > 0 ? `+${over}px` : '');
      await page.screenshot({ path: path.join(OUT, `notebook-${nome}-${tela}.png`) });
      const found = (await button.count()) > 0;
      if (found && rola.includes(tela)) await button.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      // À vista: inteiro dentro da janela e sem nada por cima.
      const visible = found && (await button.evaluate((e) => {
        const r = e.getBoundingClientRect();
        const inside = r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= document.documentElement.clientWidth && r.bottom <= innerHeight;
        return inside && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }));
      check(`${nome} ${url}: botão principal à vista${rola.includes(tela) ? ' (depois de rolar)' : ''}`, visible);
      await page.close();
    }
  }
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  return results.every(Boolean);
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || 'msedge', headless: true });
  let ok = true;
  if (!args.includes('--notebook')) ok = await matrix(browser);
  ok = (await notebook(browser)) && ok;
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
