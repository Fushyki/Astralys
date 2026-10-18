/**
 * Teste de interação do editor de rotação num navegador real (Edge ou Chrome já instalados; não baixa nada).
 *   1) npm run build && npx vite preview --port 4173
 *   2) npm run e2e            (E2E_URL e E2E_BROWSER=msedge|chrome opcionais; capturas em scripts/e2e/out/)
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

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  await page.goto(`${BASE}/rotacao`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-star');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-star');

  const dps = () => page.$eval('.ast-kpi .v', (e) => e.textContent);
  const rows = () => page.$$eval('.ast-table:not(.ast-dmgtable) tbody tr', (r) => r.length);
  const stars = () => page.$$eval('.ast-star', (r) => r.length);
  const settle = () => page.waitForTimeout(450);
  const undo = async () => { await page.click('button:has-text("Desfazer")'); await settle(); };
  const timeOfRow = (label) => page.$$eval('.ast-table:not(.ast-dmgtable) tbody tr', (trs, l) => { const tr = trs.find((t) => t.children[2].textContent.includes(l)); return tr ? tr.children[0].textContent : null; }, label);

  check('estrelas e linhas iniciais', (await stars()) === 24 && (await rows()) === 24, `${await stars()} estrelas, ${await rows()} linhas`);
  const dps0 = await dps();
  check('DPS inicial = planilha', dps0 === '216.600', dps0);
  await page.screenshot({ path: path.join(OUT, 'tl-inicial.png'), clip: { x: 0, y: 0, width: 1440, height: 1050 } });

  // A estrela maior (Supremo 7,4 s)
  const bigStar = async () => page.evaluateHandle(() => {
    let best = null, br = 0;
    document.querySelectorAll('.ast-star').forEach((g) => { const r = g.querySelectorAll('circle')[2]?.r.baseVal.value ?? 0; if (r > br) { br = r; best = g; } });
    return best;
  });
  const center = async (h) => { const b = await h.asElement().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

  // 1) Arrastar a estrela do Supremo ~ +1,5 s
  let g = await bigStar();
  await g.asElement().scrollIntoViewIfNeeded();
  let c = await center(g);
  const t0 = await timeOfRow('Supremo (200 FS)');
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 40, c.y, { steps: 4 }); await page.mouse.move(c.x + 110, c.y, { steps: 6 }); await page.mouse.up();
  await settle();
  const t1 = await timeOfRow('Supremo (200 FS)');
  check('arrastar muda o tempo do golpe', t0 === '7,4 s' && t1 !== t0, `${t0} → ${t1}`);
  const selected = await page.$$eval('.ast-table:not(.ast-dmgtable) tbody tr[data-selected="true"]', (r) => r.length);
  check('golpe arrastado fica selecionado', selected === 1);

  // 2) Desfazer com Ctrl+Z
  await page.mouse.click(5, 5);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z devolve o tempo', (await timeOfRow('Supremo (200 FS)')) === '7,4 s', await timeOfRow('Supremo (200 FS)'));

  // 3) Converter perfis em janelas
  await page.click('text=Converter perfis em janelas'); await settle();
  const wins = await page.$$eval('.ast-win', (r) => r.length);
  const noticeGone = (await page.$$('.ast-notice')).length === 0;
  check('converter cria janelas e some o aviso', wins >= 4 && noticeGone, `${wins} janelas, aviso removido: ${noticeGone}`);
  const dps1 = await dps();
  console.log(`     DPS depois de converter: ${dps1} (antes ${dps0}; pode mudar)`);

  // 4) Paleta: inserir um golpe do Bennett no marcador
  const ruler = await page.$('.ast-svg rect[style*="crosshair"]');
  const rb = await ruler.boundingBox();
  await page.mouse.click(rb.x + rb.width * 0.5, rb.y + 10);
  await page.click('.ast-tab:has-text("Bennett")');
  const before = await rows();
  await page.click('.ast-move >> nth=0'); await settle();
  check('paleta insere um golpe', (await rows()) === before + 1 && (await stars()) === before + 1, `${before} → ${await rows()} linhas`);

  // 5) Duplo clique numa faixa de buff cria janela
  const winsBefore = await page.$$eval('.ast-win', (r) => r.length);
  const lanes = await page.$$('.ast-svg rect[fill="#141833"]');
  // última faixa de buff (a última rect com esse fill é uma faixa de buff)
  const lastLane = lanes[lanes.length - 1];
  const lb = await lastLane.boundingBox();
  await page.mouse.dblclick(lb.x + lb.width * 0.97, lb.y + lb.height / 2); await settle(); // depois do fim das janelas existentes
  const winsAfter = await page.$$eval('.ast-win', (r) => r.length);
  check('duplo clique cria uma janela de buff', winsAfter === winsBefore + 1, `${winsBefore} → ${winsAfter}`);

  // 6) Teclado numa estrela: seta move +0,1 s, Delete apaga
  const first = (await page.$$('.ast-star'))[5];
  await first.focus();
  const label = await first.getAttribute('aria-label');
  await page.keyboard.press('ArrowRight'); await settle();
  const label2 = await (await page.$$('.ast-star'))[5].getAttribute('aria-label');
  check('seta move o item focado', label !== label2, `${label.split(',')[1]} → ${label2.split(',')[1]}`);
  const rowsBeforeDel = await rows();
  await page.keyboard.press('Delete'); await settle();
  check('Delete apaga o item focado', (await rows()) === rowsBeforeDel - 1);

  // 7) Inspetor: editar execuções de uma ação selecionada
  await (await page.$$('.ast-star'))[2].click({ force: true });
  const hasInspector = (await page.$$('.ast-fields')).length > 0;
  check('inspetor aparece ao selecionar', hasInspector);
  await page.screenshot({ path: path.join(OUT, 'tl-final.png'), clip: { x: 0, y: 380, width: 1440, height: 1100 } });

  // 8) Persistência
  await page.waitForTimeout(700);
  const winsNow = await page.$$eval('.ast-win', (r) => r.length);
  const noticeBefore = (await page.$$('.ast-notice')).length;
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ast-star');
  const winsReload = await page.$$eval('.ast-win', (r) => r.length);
  check('recarregar mantém as edições (janelas e conversão)', winsReload === winsNow && winsNow > 0 && noticeBefore === 0 && (await page.$$('.ast-notice')).length === 0, `${winsNow} → ${winsReload} janelas`);
  await page.click('text=Restaurar exemplo'); await settle();
  check('restaurar exemplo volta ao original', (await rows()) === 24 && (await dps()) === '216.600');

  // 8b) Realinhar: mantém a ordem, tira os espaços e desfaz num passo
  const timesCol = () => page.$$eval('.ast-table:not(.ast-dmgtable) tbody tr', (trs) => trs.map((t) => t.children[0].textContent));
  const namesCol = () => page.$$eval('.ast-table:not(.ast-dmgtable) tbody tr', (trs) => trs.map((t) => t.children[1].textContent + '|' + t.children[2].textContent));
  const namesBefore = await namesCol();
  const timesBefore = await timesCol();
  await page.click('button:has-text("Realinhar")'); await settle();
  const timesAfter = await timesCol();
  check('realinhar deixa os golpes seguidos a partir de 0 s', timesAfter.slice(0, 4).join() === '0,0 s,0,5 s,1,0 s,1,5 s' && timesAfter[23] === '11,5 s', timesAfter.slice(0, 4).join(' | ') + ' … ' + timesAfter[23]);
  check('realinhar mantém a ordem dos golpes', (await namesCol()).join('#') === namesBefore.join('#'));
  await undo();
  check('desfazer o realinhamento devolve os tempos originais', (await timesCol()).join() === timesBefore.join());
  await page.fill('input[aria-label^="Intervalo entre golpes"]', '1'); 
  await page.click('button:has-text("Realinhar")'); await settle();
  check('o intervalo é configurável (1 s)', (await timesCol()).slice(0, 3).join() === '0,0 s,1,0 s,2,0 s', (await timesCol()).slice(0, 3).join(' | '));
  await page.fill('input[aria-label^="Intervalo entre golpes"]', '0'); 
  check('intervalo inválido desativa o botão', await page.isDisabled('button:has-text("Realinhar")'));
  await page.fill('input[aria-label^="Intervalo entre golpes"]', '0.5');
  await undo();
  const dpsNormal = await dps();
  const dur = page.locator('label.ast-field:has(span:text-is("Duração da rotação")) input');
  await dur.fill('35'); await dur.blur(); await settle();
  check('dobrar a duração divide o DPS por 2', (await dps()) === '108.300', `${dpsNormal} → ${await dps()}`);
  await undo();
  check('desfazer a duração restaura o DPS', (await dps()) === dpsNormal);

  // 9) Móvel
  await page.setViewportSize({ width: 400, height: 800 });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check('móvel sem scroll horizontal da página', !overflow);

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
