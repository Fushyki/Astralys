/**
 * Rotação e buffs (/projeto/:id/rotacao), mockup RotacaoEstelar: blocos, inserção em ordem, golpe contínuo, janelas de
 * buff, sequência, gráficos, duração automática e celular.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/rotacao.cjs
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
const num = (s) => Number(String(s).replace(/\./g, '').replace(',', '.'));

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(450);
  const dps = () => page.textContent('[data-testid="live-dps"]');
  const hits = () => page.$$('.rt-hit');
  const panel = (t) => page.locator(`.dz-panel.bar:has(h2:text-is("${t}"))`);
  const rows = () => page.locator('.rt-table tbody tr');

  await page.goto(`${BASE}/projeto/exemplo/rotacao`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.rt-hit');

  // ---- Estrutura ----
  const titles = await page.$$eval('.dz-panel.bar > .bar-head h2', (e) => e.map((x) => x.textContent.trim()));
  check('os painéis da tela, na ordem do mockup', ['Golpes', 'Linha do tempo', 'Golpe selecionado', 'Buff selecionado', 'Sequência', 'Dano acumulado na rotação', 'Divisão do dano'].join() === titles.join(), titles.join(' | '));
  check('24 golpes na linha do tempo', (await hits()).length === 24, String((await hits()).length));
  check('DPS ao vivo do exemplo é 216.600 (gabarito)', (await dps()) === '216.600', await dps());
  check('o cabeçalho conta golpes e buffs com janela', /24 golpes · \d+ buffs? com janela/.test(await page.textContent('.rt-head .sub')));
  check('a etapa 3 saiu: só 1 e 2 na faixa do time', (await page.$$eval('.dz-subnav nav a', (a) => a.map((x) => x.textContent.trim()))).join('|') === '1 · Equipe|2 · Rotação e buffs');
  const lanes = await page.$$eval('.rt-lane', (e) => e.map((x) => x.querySelector('.lname')?.textContent?.trim() ?? ''));
  check('faixas: Tempo, Em campo e uma por personagem', /^Tempo/.test(lanes[0]) && /^Em campo/.test(lanes[1]) && /Mavuika/.test(lanes[2]) && /Bennett/.test(lanes[5]), lanes.slice(0, 6).join(' | '));
  check('buffs agrupados por quem dá, com faixa tracejada para o que não tem janela ou barras', (await page.locator('.rt-giver').count()) >= 3 && (await page.locator('.rt-bar').count()) >= 10);
  check('"Em campo" não tem texto dentro dos segmentos', (await page.$$eval('.rt-lane.field .seg', (e) => e.every((x) => x.textContent === '' && x.getAttribute('title')))));
  const colW = await page.$$eval('.rt-lane', (e) => e.slice(0, 8).map((x) => getComputedStyle(x).gridTemplateColumns.split(' ')[0]));
  check('todas as faixas usam a coluna de rótulo de 200 px', colW.every((c) => c === '200px'), colW.join(','));
  check('Desfazer e Refazer começam desativados', (await page.isDisabled('button:has-text("Desfazer")')) && (await page.isDisabled('button:has-text("Refazer")')));
  await page.screenshot({ path: path.join(OUT, 'r-rotacao.png'), fullPage: true });

  // ---- Selecionar golpe ----
  await page.locator('.rt-hit[aria-label*="Supremo (200 FS)"]').first().click({ force: true }); await settle();
  check('selecionar mostra o golpe e o dano médio 1.239.638', /Supremo \(200 FS\)/.test(await panel('Golpe selecionado').locator('.rt-title b').textContent()) && (await page.textContent('[data-testid="hit-avg"]')) === '1.239.638');
  const cascade = await page.$$eval('.rt-cascade .step .k', (e) => e.map((x) => x.textContent));
  check('cascata na ordem do mockup', cascade.join() === 'Dano base,Bônus de dano,DEF,RES,Reação,Crítico médio', cascade.join());
  const before = num(await dps());
  await panel('Golpe selecionado').locator('select[aria-label="Reação"]').selectOption('none'); await settle();
  check('trocar a reação para "Sem reação" reduz o DPS ao vivo', num(await dps()) < before * 0.8, `${before} → ${await dps()}`);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z restaura o DPS', (await dps()) === '216.600');
  check('agora Refazer fica ativo', !(await page.isDisabled('button:has-text("Refazer")')));
  await page.click('button:has-text("Refazer")'); await settle();
  await page.click('button:has-text("Desfazer")'); await settle();

  // ---- Inserir em ordem ----
  const n0 = (await hits()).length;
  const nextVal = async () => parseFloat((await page.locator('.rt-mv-box .rt-fld:has-text("Próximo golpe entra em") .rt-inp').textContent()).replace(',', '.'));
  const nextTxt = await nextVal();
  await page.click('.rt-tabs button:has-text("Bennett")');
  for (let i = 0; i < 3; i++) { await page.click('.rt-mvgroup .rt-mv >> nth=0'); await page.waitForTimeout(150); }
  await settle();
  check('"Em ordem": 3 golpes seguidos entram espaçados em 0,4 s', (await hits()).length === n0 + 3);
  const nextAfter = await nextVal();
  check('o "próximo golpe entra em" avança 0,4 s por golpe', Math.abs(nextAfter - (nextTxt + 1.2)) < 0.06, `${nextTxt} → ${nextAfter}`);
  await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z'); await settle();
  check('desfazer 3 vezes volta aos 24 golpes', (await hits()).length === 24);

  // ---- Dano de reação (Redemoinho) ----
  await page.click('.rt-mvgroup .rt-mv:has-text("Redemoinho Hydro")'); await settle();
  const swirlAvg = await page.textContent('[data-testid="hit-avg"]');
  check('Redemoinho Hydro entra na rotação com dano maior que 0', num(swirlAvg) > 0 && /Redemoinho Hydro/.test(await panel('Golpe selecionado').locator('.rt-title b').textContent()), swirlAvg);
  await page.keyboard.press('Control+z'); await settle();

  // ---- Contínuo ----
  await page.click('.rt-tabs button:has-text("Mavuika")');
  await page.click('.rt-seg button:has-text("No instante marcado")');
  await page.click('.rt-mvgroup .rt-mv >> nth=0'); await settle();
  const sel = panel('Golpe selecionado');
  await sel.locator('.rt-seg button:has-text("Contínuo")').click(); await settle();
  check('o contínuo tem Duração e não tem "Até"', (await sel.locator('.rt-fld:has-text("Duração")').count()) === 1 && (await sel.locator('.rt-fld:has-text("Até")').count()) === 0);
  const dur0 = (await page.textContent('.rt-head h1')).trim();
  const lenInput = sel.locator('.rt-fld:has-text("Duração") input');
  await lenInput.fill('25'); await lenInput.blur(); await settle();
  const hdr = (await page.textContent('.rt-head h1')).trim();
  check('definir Duração 25 s estica a rotação e a linha do tempo', /Rotação · 2[5-9],\d s|Rotação · 26,\d s/.test(hdr) && hdr !== dur0, `${dur0} → ${hdr}`);
  check('as execuções acompanham a duração (13 a cada 2 s)', (await sel.locator('.rt-exec .er').count()) >= 10);
  const execLabel = await sel.locator('.rt-exec .rt-lbl').textContent();
  check('"Contínuo" cria execuções editáveis uma a uma', /Execuções · \d+/.test(execLabel) && (await sel.locator('.rt-exec .er').count()) >= 2, execLabel);
  check('a linha do tempo mostra losangos', (await page.locator('.rt-diamond').count()) >= 2);
  const total = await sel.locator('.rt-exec .er').count();
  await sel.locator('.rt-exec .er button[aria-label="Remover esta execução"]').nth(1).click(); await settle();
  check('remover uma execução não apaga as outras', (await sel.locator('.rt-exec .er').count()) === total - 1);
  await sel.locator('button:has-text("+ Execução")').click(); await settle();
  check('+ Execução adiciona uma execução', (await sel.locator('.rt-exec .er').count()) === total);
  await sel.locator('select[aria-label="Reação em 1 de N"]').selectOption('2'); await settle();
  const reactions = await sel.locator('.rt-exec .er select').evaluateAll((e) => e.map((x) => x.value));
  check('"Reação em 1 de 2" põe reação em 1 execução a cada 2 (a 1ª com reação)', reactions[0] !== 'none' && reactions[1] === 'none', reactions.join(','));
  check('a Sequência junta o contínuo em uma linha com "a cada … · ×N"', /a cada [\d,]+ s · ×\d+/.test(await page.locator('.rt-table td.rep.on').first().textContent()));
  await sel.locator('button:has-text("Remover golpe")').click(); await settle();
  check('"Remover golpe" apaga o contínuo inteiro', (await hits()).length === 24 && (await page.locator('.rt-diamond').count()) === 0);

  // ---- Rolagem lateral ----
  await page.click('.rt-seg button:has-text("2×")'); await settle();
  const sb = await page.locator('.rt-hscroll').boundingBox();
  const bh = await page.locator('.rt-sect').boundingBox();
  check('a barra de rolagem lateral fica logo acima de "Buffs no time"', !!sb && !!bh && sb.y < bh.y && bh.y - (sb.y + sb.height) < 8, `${sb && Math.round(sb.y)} / ${bh && Math.round(bh.y)}`);
  await page.locator('.rt-hscroll').fill('300'); await settle();
  const lefts = await page.$$eval('.rt-zoomscroll', (e) => e.map((x) => Math.round(x.scrollLeft)));
  check('a rolagem move as faixas de cima e os buffs juntos', lefts.length === 2 && lefts[0] === 300 && lefts[1] === 300, lefts.join('/'));
  await page.click('.rt-seg button:has-text("1×")'); await settle();

  // ---- Janela de buff ----
  await page.locator('.rt-bar >> nth=0').click(); await settle();
  const bp = panel('Buff selecionado');
  check('selecionar uma barra de buff mostra o tipo de janela', (await bp.locator('.rt-seg button').allTextContents()).join('|') === 'Rotação inteira|Janela|Por golpe');
  const dur = bp.locator('.rt-fld:has-text("Duração") input');
  const ini = num(await bp.locator('.rt-fld:has-text("Início") input').inputValue());
  await dur.fill('3'); await dur.blur(); await settle();
  check('mudar a duração recalcula o fim', Math.abs(num(await bp.locator('.rt-fld:has-text("Fim") input').inputValue()) - (ini + 3)) < 0.06);
  await bp.locator('.rt-seg button:has-text("Rotação inteira")').click(); await settle();
  check('"Rotação inteira" estende a barra', /rotação inteira/.test(await page.locator('.rt-bar[aria-pressed="true"]').first().textContent()));
  await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z'); await settle();
  await bp.locator('button:has-text("Duplicar janela")').click(); await settle();
  const barsAfterDup = await page.locator('.rt-bar').count();
  await bp.locator('button:has-text("Remover janela")').click(); await settle();
  check('duplicar e remover janela', (await page.locator('.rt-bar').count()) === barsAfterDup - 1);

  // ---- Arrastar ----
  const hit = page.locator('.rt-hit[aria-label*="Supremo (200 FS)"]').first();
  await hit.scrollIntoViewIfNeeded();
  const b = await hit.boundingBox();
  const lbl0 = await hit.getAttribute('aria-label');
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 30, b.y + b.height / 2, { steps: 4 }); await page.mouse.move(b.x + b.width / 2 + 90, b.y + b.height / 2, { steps: 6 }); await page.mouse.up(); await settle();
  check('arrastar muda o tempo do golpe', (await page.locator('.rt-hit[aria-pressed="true"]').first().getAttribute('aria-label')) !== lbl0);
  await page.keyboard.press('Control+z'); await settle();

  // ---- Sequência ----
  check('a Sequência mostra 8 linhas e "Mostrar os 24"', (await rows().count()) === 8 && (await page.locator('button:has-text("Mostrar os 24")').count()) === 1);
  const heads = await page.$$eval('.rt-table th', (e) => e.map((x) => x.textContent.trim()));
  check('colunas da Sequência', heads.join('|') === '||#|Tempo|Personagem|Golpe|Repetição|Hits|Reação|Buffs|', heads.join('|'));
  await page.click('button:has-text("Mostrar os 24")'); await settle();
  check('"Mostrar os 24" lista todas', (await rows().count()) === 24);
  await rows().nth(1).locator('input[type=checkbox]').check();
  await rows().nth(2).locator('input[type=checkbox]').check();
  check('Remover selecionados (2) aparece e apaga', (await page.locator('button:has-text("Remover selecionados (2)")').count()) === 1);
  await page.click('button:has-text("Remover selecionados (2)")'); await settle();
  check('as 2 linhas foram removidas', (await hits()).length === 22);
  await page.keyboard.press('Control+z'); await settle();
  check('Desfazer traz as linhas de volta', (await hits()).length === 24);

  // ---- Gráficos ----
  check('o gráfico tem 6 pontos numerados e legenda', (await page.locator('.rt-mark').count()) === 6 && (await page.locator('.rt-legend > span').count()) === 6);
  check('a divisão do dano lista os 4 personagens e a frase Hipercarry', (await page.locator('.rt-split:not([data-testid])').count()) === 4 && /Hipercarry: Mavuika/.test(await panel('Divisão do dano').textContent()));

  check('"Por tipo de dano" lista de onde vem o dano (Supremo, Habilidade…)', (await panel('Divisão do dano').locator('[data-testid^="source-"]').count()) >= 3);
  // ---- Configurações ----
  await page.click('button:has-text("Configurações")');
  const dlg = page.locator('.rt-dialog');
  check('Configurações abre um diálogo com as seções', (await dlg.locator('.rt-cfg-sec h3').allTextContents()).join('|').startsWith('Duração da rotação|Cenário|Elemento dos golpes|Realinhar os golpes'));
  const d = dlg.locator('.rt-fld:has-text("Duração") input').first();
  await d.fill('35'); await d.blur(); await settle();
  check('duração manual (35 s) divide o DPS por 2 (exemplo é modo planilha)', Math.abs(num(await dps()) - 108300) < 2, await dps());
  check('o diálogo mostra o DPS ao vivo', num(await dlg.locator('.rt-cfg-live .num').textContent()) === num(await dps()));
  const res = dlg.locator('.rt-fld:has-text("RES base do inimigo") input');
  const dpsBefore = num(await dps());
  await res.fill('50'); await res.blur(); await settle();
  check('mudar a RES do inimigo muda o dano na hora', num(await dps()) < dpsBefore, `${dpsBefore} → ${await dps()}`);
  await dlg.locator('button:has-text("Realinhar agora")').click(); await settle();
  check('Realinhar agora deixa os golpes seguidos (Apertar a linha fica desligado)', await page.locator('.rt-head button:has-text("Apertar a linha")').isDisabled());
  await page.keyboard.press('Escape');
  check('Esc fecha o diálogo', (await page.locator('.rt-dialog').count()) === 0);
  for (let i = 0; i < 4; i++) await page.keyboard.press('Control+z');
  await settle();
  check('Ctrl+Z restaura o DPS', (await dps()) === '216.600', await dps());
  const tighten = page.locator('.rt-head button:has-text("Apertar a linha")');
  check('"Apertar a linha" no cabeçalho', (await tighten.count()) === 1 && !(await tighten.isDisabled()));
  await tighten.click(); await settle();
  check('com a linha apertada o botão fica desligado', await tighten.isDisabled());
  await page.keyboard.press('Control+z'); await settle();

  // ---- Persistência ----
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.rt-hit');
  check('recarregar mantém o projeto (24 golpes e 216.600)', (await hits()).length === 24 && (await dps()) === '216.600');

  // ---- Larguras ----
  for (const w of [1366, 390]) {
    await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(500);
    check(`${w}px sem rolagem horizontal da página`, !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
    await page.screenshot({ path: path.join(OUT, `r-rotacao-${w}.png`), fullPage: true });
  }

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
