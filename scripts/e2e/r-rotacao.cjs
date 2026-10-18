/**
 * Redesign, tela Rotação e buffs (/projeto/:id/rotacao): linha do tempo, cascata, buffs que cobrem o golpe, edição,
 * paleta, janelas, configurações, realinhar e persistência.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/r-rotacao.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
const num = (t) => Number(String(t).replace(/\./g, '').replace(',', '.'));

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);
  const dps = () => page.textContent('[data-testid="live-dps"]');
  const hits = () => page.$$('.rt-hit');
  const hitTimes = () => page.$$eval('.rt-hit', (g) => g.map((x) => { const m = /aos ([\d,]+) segundos/.exec(x.getAttribute('aria-label')); return m ? Number(m[1].replace(',', '.')) : -1; }));
  const bigHit = () => page.locator('.rt-hit[aria-label*="Supremo (200 FS)"]').first();
  const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

  await page.goto(`${BASE}/projeto/exemplo/rotacao`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.rt-hit');

  check('24 golpes na linha do tempo', (await hits()).length === 24, String((await hits()).length));
  check('DPS ao vivo do exemplo é 216.600', (await dps()) === '216.600', await dps());
  check('o cabeçalho conta golpes e buffs com janela', /24 golpes · \d+ buffs com janela/.test(await page.textContent('.dz-pagehead')));
  const lanes = await page.$$eval('.rt-svg .buff-src', (e) => e.map((x) => x.textContent));
  check('o exemplo abre com as faixas de buff preenchidas (6 ou mais, com fonte)', lanes.length >= 6 && lanes.some((l) => /Citlali · TTDS/.test(l)) && lanes.some((l) => /ATK fixo Bennett/.test(l)), lanes.join(' | '));
  const wins = await page.$$eval('.rt-win', (e) => e.length);
  check('há barras de buff nas janelas de tempo', wins >= 10, `${wins} barras`);
  check('desfazer e refazer começam desativados', (await page.isDisabled('button:has-text("Desfazer")')) && (await page.isDisabled('button:has-text("Refazer")')));
  await page.screenshot({ path: path.join(OUT, 'r-rotacao.png'), fullPage: true });

  // Selecionar o Supremo: cascata e buffs que cobrem
  await bigHit().click({ force: true }); await settle();
  check('selecionar mostra o nome do golpe e o dano médio 1.239.638', /Supremo \(200 FS\)/.test(await page.textContent('.rt-hitname')) && (await page.textContent('[data-testid="hit-avg"]')) === '1.239.638');
  const cascade = await page.$$eval('.rt-cascade .step .k', (e) => e.map((x) => x.textContent));
  check('cascata na ordem do mockup', cascade.join() === 'Dano base,Bônus de dano,DEF,RES,Reação,Crítico médio', cascade.join());
  const cov = await page.$$eval('.rt-cov', (e) => e.map((x) => x.textContent));
  check('os buffs que cobrem o golpe começam pelo ATK fixo do Bennett (15 a 30%)', /ATK fixo de Bennett/.test(cov[0]) && num(cov[0].match(/\+([\d,]+)%/)[1]) > 15 && num(cov[0].match(/\+([\d,]+)%/)[1]) < 30, cov[0]);
  await page.locator('.rt-hit[aria-label*="aos 0,4 segundos"]').first().click({ force: true }); await settle();
  const dimmed = await page.$$eval('.rt-win', (g) => g.filter((x) => x.getAttribute('opacity') === '0.35').length);
  check('as barras que não cobrem o golpe selecionado (o 1º, aos 0,4 s) ficam esmaecidas', dimmed > 0, `${dimmed} esmaecidas`);
  await bigHit().click({ force: true }); await settle();

  // Reação: tirar o Derreter reduz o dano
  const before = num(await dps());
  await page.selectOption('.dz-panel:has(h2:text-is("Editar golpe")) select', 'none'); await settle();
  check('trocar a reação do golpe para "Sem reação" reduz o DPS ao vivo', num(await dps()) < before * 0.8, `${before} → ${await dps()}`);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z restaura o DPS', (await dps()) === '216.600');
  check('agora Refazer fica ativo', !(await page.isDisabled('button:has-text("Refazer")')));
  await page.click('button:has-text("Refazer")'); await settle();
  await page.click('button:has-text("Desfazer")'); await settle();

  // Arrastar o Supremo
  const t0 = (await hitTimes()).filter((t) => t > 0);
  await bigHit().scrollIntoViewIfNeeded();
  const c = await center(bigHit());
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 40, c.y, { steps: 4 }); await page.mouse.move(c.x + 110, c.y, { steps: 6 }); await page.mouse.up(); await settle();
  const t1 = (await hitTimes()).filter((t) => t > 0);
  check('arrastar muda o tempo do golpe', JSON.stringify(t0) !== JSON.stringify(t1), `${t0.join(',').slice(0, 30)} → ${t1.join(',').slice(0, 30)}`);
  check('o golpe arrastado fica selecionado', (await page.locator('.rt-hit[aria-pressed="true"]').count()) === 1);
  await page.mouse.click(5, 5);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z devolve o tempo', JSON.stringify((await hitTimes()).filter((t) => t > 0)) === JSON.stringify(t0));

  // Paleta
  const ruler = await page.$('.rt-svg rect[style*="crosshair"]');
  const rb = await ruler.boundingBox();
  await page.mouse.click(rb.x + rb.width * 0.5, rb.y + 10); await page.waitForTimeout(200);
  check('clicar na régua marca o instante de inserção', /Inserir em \d+,\d s/.test(await page.textContent('.dz-panel:has(.rt-pal-tabs) h2')), await page.textContent('.dz-panel:has(.rt-pal-tabs) h2'));
  await page.click('.rt-pal-tabs button:has-text("Bennett")');
  const nBefore = (await hits()).length;
  await page.click('.rt-chips .chip >> nth=0'); await settle();
  check('a paleta insere um golpe do Bennett', (await hits()).length === nBefore + 1);
  await page.keyboard.press('Control+z'); await settle();

  // Duplo clique numa faixa de buff cria janela
  const winsBefore = await page.$$eval('.rt-win', (e) => e.length);
  const lastLane = (await page.$$('.rt-svg rect.lane-bg')).pop();
  const lb = await lastLane.boundingBox();
  await page.mouse.dblclick(lb.x + lb.width * 0.985, lb.y + lb.height / 2); await settle();
  check('duplo clique numa faixa cria uma barra de buff', (await page.$$eval('.rt-win', (e) => e.length)) === winsBefore + 1);
  check('a nova janela fica selecionada e pode ser editada', (await page.locator('.dz-panel:has(h2:text-matches("Janela"))').count()) === 1);
  await page.keyboard.press('Control+z'); await settle();

  // Teclado
  const target = (await hits())[5];
  await target.focus();
  const label0 = await target.getAttribute('aria-label');
  await page.keyboard.press('ArrowRight'); await settle();
  check('seta move o golpe focado', label0 !== (await (await hits())[5].getAttribute('aria-label')));
  const countBefore = (await hits()).length;
  await page.keyboard.press('Delete'); await settle();
  check('Delete apaga o golpe focado', (await hits()).length === countBefore - 1);
  await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z'); await settle();

  // Configurações: duração, realinhar
  await page.click('button:has-text("Configurações")');
  const dur = page.locator('.dz-dialog label.dz-field:has(span:text-is("Duração da rotação")) input');
  await dur.fill('35'); await dur.blur(); await settle();
  check('dobrar a duração divide o DPS por 2', num(await dps()) === 108300 || Math.abs(num(await dps()) - 108300) < 2, await dps());
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z restaura a duração', (await dps()) === '216.600');
  await page.click('button:has-text("Configurações")');
  await page.click('.dz-dialog button:has-text("Realinhar")'); await settle();
  await page.keyboard.press('Escape');
  const times = (await hitTimes()).sort((a, b) => a - b);
  check('realinhar deixa os golpes seguidos a partir de 0 s (0, 0,5, 1…)', times.slice(0, 3).join() === '0,0.5,1' && times[23] === 11.5, times.slice(0, 4).join(',') + ' … ' + times[23]);
  await page.keyboard.press('Control+z'); await settle();

  // Persistência e restaurar
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.rt-hit');
  check('recarregar mantém o projeto (24 golpes e 216.600)', (await hits()).length === 24 && (await dps()) === '216.600');
  await page.click('button:has-text("Configurações")');
  await page.click('.dz-dialog button:has-text("Restaurar exemplo")'); await settle();
  await page.keyboard.press('Escape');
  check('restaurar exemplo volta ao original com as faixas de buff', (await hits()).length === 24 && (await dps()) === '216.600' && (await page.$$eval('.rt-win', (e) => e.length)) >= 10);

  // Celular
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-rotacao-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
