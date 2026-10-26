/**
 * Navegação nova (Times · Personagens · Inventário · Otimizador · Ferramentas), Inventário e Otimizador de artefatos.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/otimizador.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.join(__dirname, 'fixtures', 'otimizador.good.json');

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));

  await page.goto(`${BASE}/inventario`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  // ---- Menu ----
  const nav = await page.$$eval('.dz-nav > a, .dz-header .dz-navbtn', (a) => a.map((x) => x.textContent.trim()));
  check('o menu é Times · Personagens · Inventário · Ferramentas (otimizar é individual: fica no personagem)', nav.join('|') === 'Times|Personagens|Inventário|Ferramentas ▾', nav.join('|'));
  check('Inventário está marcado', (await page.getAttribute('.dz-nav a:has-text("Inventário")', 'aria-current')) === 'page');

  // ---- Inventário ----
  check('sem inventário, a tela oferece importar o arquivo', (await page.locator('button:has-text("Escolher arquivo")').count()) === 1);
  await page.setInputFiles('input[type=file]', FIXTURE);
  await page.waitForSelector('.inv-grid .inv-art');
  const counts = await page.textContent('.inv-import .opt.now b');
  check('importa o arquivo GOOD e mostra a contagem', /40 artefatos/.test(counts), counts);
  check('a grade mostra as peças com imagem do set', (await page.locator('.inv-grid .inv-art').count()) === 40 && (await page.locator('.inv-grid .inv-art img').count()) > 0);
  await page.click('.ot-chip:has-text("Areia")');
  check('filtrar por posição deixa só as Areias', (await page.locator('.inv-grid .inv-art').count()) === 8);
  await page.click('.ot-chip:has-text("Areia")');
  await page.selectOption('select[aria-label="Set"]', { index: 1 });
  check('filtrar por set reduz a lista', (await page.locator('.inv-grid .inv-art').count()) < 40);
  await page.screenshot({ path: path.join(OUT, 'inventario.png') });

  // ---- Otimizar: aba dentro do personagem ----
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika`, { waitUntil: 'networkidle' });
  check('a página do personagem tem a aba Otimizar', (await page.$$eval('.pc-views button', (b) => b.map((x) => x.textContent))).includes('Otimizar'));
  check('não existe mais botão "Otimizar artefatos" no Equipamento', (await page.locator('a:has-text("Otimizar artefatos")').count()) === 0);
  await page.click('.pc-views button:has-text("Otimizar")');
  await page.waitForSelector('.ot-top');
  check('abre o otimizador do Mavuika dentro da página dele', /aba=otimizar/.test(page.url()) && /Mavuika/.test(await page.textContent('.pc-tabs [aria-selected="true"]')));
  check('a faixa do time tem 2 telas: Equipe, Rotação e buffs', (await page.$$eval('.dz-subnav nav a', (a) => a.map((x) => x.textContent.replace(/^\d · /, '').trim()))).join('|') === 'Equipe|Rotação e buffs');
  check('"O que otimizar" tem 3 escolhas: Dano, Buff e Stat', (await page.locator('.ot-seg[aria-label="O que otimizar"] button').count()) === 3 && (await page.getAttribute('.ot-seg[aria-label="O que otimizar"] button:has-text("Dano")', 'aria-pressed')) === 'true');
  check('em Dano há 3 alvos: rotação do time, só dele e um golpe do kit', (await page.$$eval('.ot-seg[aria-label="Dano de"] button', (b) => b.map((x) => x.textContent.trim()))).join('|') === 'Rotação do time|Só Mavuika|Um golpe');

  const addMin = async (key, value) => {
    await page.selectOption('select[aria-label="Stat do mínimo"]', key);
    await page.fill('input[aria-label="Valor do mínimo"]', value);
    await page.click('.ot-min-add .dz-btn');
  };
  const rmMin = async (label) => { await page.click(`button[aria-label="Remover mínimo de ${label}"]`); };
  const prev = await page.textContent('.ot-strip .stat');
  check('a rota antiga /otimizador/:nome leva à aba do personagem', await (async () => { await page.goto(`${BASE}/projeto/exemplo/otimizador/Mavuika`, { waitUntil: 'networkidle' }); return /personagem\/Mavuika\?aba=otimizar/.test(page.url()); })());
  await page.waitForSelector('.ot-top');
  check('mostra quantas peças entram por posição', /40 peças \(8 · 8 · 8 · 8 · 8\)/.test(prev), prev);

  await page.click('.oa-weapon');
  check('clicar na arma na aba Otimizar abre o popup de trocar arma', (await page.locator('[role="dialog"][aria-label="Trocar arma"]').count()) === 1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // ---- Otimizar (dano do time) ----
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const builds = await page.locator('.ot-build').count();
  check('a busca devolve até 5 builds', builds >= 1 && builds <= 5, String(builds));
  check('diz que a busca foi completa', /Busca completa/.test(await page.textContent('.ot-strip')));
  // Guia visual v2: imagens, alturas iguais, grade de builds e nenhum texto sublinhado
  const tilesOk = await page.$$eval('.ot-build', (b) => b.every((x) => x.querySelectorAll('.pcard').length === 5 && [...x.querySelectorAll('.pcard .art')].every((a) => a.querySelector('img') || a.querySelector('.ph'))));
  check('todo build mostra as 5 peças com imagem (ou o glifo da posição)', tilesOk);
  const imgs = await page.$$eval('.ot-build .pcard .art > img', (i) => i.length);
  check('as peças carregam a imagem do artefato do Lunaris', imgs >= 5, String(imgs));
  const topH = await page.$$eval('.ot-top > .dz-panel', (p) => p.map((x) => Math.round(x.getBoundingClientRect().height)));
  check('os 3 painéis de filtro têm a mesma altura', topH.length === 3 && new Set(topH).size === 1, topH.join(','));
  const rowH = await page.$$eval('.ot-results > .ot-build', (b) => { const t0 = Math.round(b[0].getBoundingClientRect().top); return b.filter((x) => Math.abs(x.getBoundingClientRect().top - t0) < 4).map((x) => Math.round(x.getBoundingClientRect().height)); });
  check('os builds da mesma linha têm a mesma altura', new Set(rowH).size === 1, rowH.join(','));
  const perRow = rowH.length;
  check('2 builds por linha em 1440 px', perRow === 2, String(perRow));
  const under = await page.$$eval('.pc-page *', (els) => els.filter((e) => getComputedStyle(e).textDecorationLine.includes('underline')).length);
  check('nenhum texto sublinhado na aba Otimizar', under === 0, String(under));
  const gutters = await page.evaluate(() => { const r = document.querySelector('.pc-page').getBoundingClientRect(); return [Math.round(r.left), Math.round(window.innerWidth - r.right)]; });
  check('margem lateral da página de 24 px no máximo em 1440 px', gutters.every((g) => g <= 24), gutters.join('/'));
  check('cada build mostra as 5 peças com imagem e substats', (await page.locator('.ot-build').first().locator('.pcard').count()) === 5);
  const vals = await page.$$eval('.ot-build .val b', (b) => b.map((x) => Number(x.textContent.replace(/\./g, ''))));
  check('os builds vêm do melhor para o pior', vals.every((v, i) => i === 0 || v <= vals[i - 1]) && vals[0] > 0, vals.join(' > '));
  await page.screenshot({ path: path.join(OUT, 'otimizador.png'), fullPage: true });

  // ---- Equipar ----
  await page.locator('.ot-build').first().locator('button:has-text("Equipar")').click();
  check('Equipar marca o build como equipado', (await page.locator('.ot-build button:has-text("Equipado")').count()) === 1);
  await page.click('.pc-views button:has-text("Resumo e build")');
  await page.waitForSelector('.pc-gear');
  check('depois de Equipar, o Equipamento mostra as 5 peças reais do inventário', (await page.locator('.gt-piece.real').count()) === 5 && (await page.locator('.gt-piece.real.empty').count()) === 0);
  check('com peças reais os substats mostram a soma exata das peças', /Soma exata dos substats das 5 peças/.test(await page.textContent('.dz-panel:has(h2:text-is("Substats das peças"))')));
  await page.locator('.gt-piece.real').nth(2).click();
  await page.waitForSelector('.dz-dialog .pp-tile');
  check('tocar numa peça abre o inventário com as peças da posição (Areia)', /Areia do inventário/.test(await page.textContent('.dz-dialog')) && (await page.locator('.dz-dialog .pp-tile').count()) === 8);
  await page.locator('.dz-dialog .pp-tile').nth(3).click();
  await page.waitForTimeout(500);
  check('escolher outra peça troca só aquela posição', (await page.locator('.gt-piece.real').count()) === 5 && (await page.locator('.dz-dialog').count()) === 0);
  await page.locator('.gt-piece.real').nth(0).click();
  await page.waitForSelector('.dz-dialog .pp-tile');
  await page.click('.dz-dialog button:has-text("Deixar sem peça")');
  check('"Deixar sem peça" esvazia a posição', (await page.locator('.gt-piece.real.empty').count()) === 1);
  await page.click('button:has-text("Voltar ao build genérico")');
  check('"Voltar ao build genérico" volta aos rolls e main stats', (await page.locator('.gt-piece.real').count()) === 0 && (await page.locator('.db-subs .sr').count()) === 10);
  await page.click('.pc-views button:has-text("Otimizar")');
  await page.waitForSelector('.ot-top');

  // ---- Restrição de Recarga ----
  await addMin('er', '125');
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build, .note', { timeout: 120000 });
  await page.waitForTimeout(500);
  const ers = await page.$$eval('.ot-build .stats', (f) => f.map((x) => Number((/Recarga(\d+)/.exec(x.textContent) || [])[1])));
  check('com Recarga mínima de 125% nenhum build fica abaixo', ers.every((e) => e >= 125), ers.join(',') || 'nenhum cumpre');

  // ---- Foco num stat ----
  await rmMin('Recarga');
  await page.click('.ot-seg[aria-label="O que otimizar"] button:has-text("Stat")');
  await page.click('.ot-seg button:has-text("Maestria")');
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const em = await page.$$eval('.ot-build .val b', (b) => b.map((x) => Number(x.textContent.replace(/\./g, ''))));
  check('foco em Maestria: o melhor build tem a maior Maestria', em.length > 0 && em[0] >= Math.max(...em), em.join(' > '));

  // ---- Um golpe do kit, com e sem reação ----
  await page.click('.ot-seg[aria-label="O que otimizar"] button:has-text("Dano")');
  await page.click('.ot-seg[aria-label="Dano de"] button:has-text("Um golpe")');
  await page.click('.ot-movebtn'); await page.waitForSelector('.mp-dialog');
  const moves = await page.locator('.mp-card').count();
  check('o popup do golpe lista todos os golpes do personagem', moves >= 10, String(moves));
  const kinds = await page.$$eval('.mp-kinds button', (b) => b.map((x) => x.textContent.replace(/\s*\d+$/, '').trim()));
  check('os golpes se separam por tipo de dano com cor (Normal, Carregado, Imersivo, Habilidade, Supremo)', ['Normal', 'Carregado', 'Imersivo', 'Habilidade', 'Supremo'].every((k) => kinds.includes(k)), kinds.join(','));
  const bgs = await page.$$eval('.mp-card .mp-badge', (b) => new Set(b.map((x) => getComputedStyle(x).backgroundColor)).size);
  check('cada tipo de dano tem a sua cor', bgs >= 4, String(bgs));
  await page.click('.mp-kinds button:has-text("Supremo")'); await page.waitForTimeout(200);
  check('desligar um tipo tira os golpes dele', (await page.locator('.mp-card .mp-badge:has-text("Supremo")').count()) === 0);
  await page.click('.mp-kinds button:has-text("Supremo")');
  await page.fill('.mp-dialog input[type="search"]', 'habilidade'); await page.waitForTimeout(200);
  const before = await page.textContent('.ot-movebtn');
  await page.click('.mp-card >> nth=0'); await page.waitForTimeout(300);
  check('escolher um golpe no popup fecha e troca o botão', (await page.locator('.mp-dialog').count()) === 0 && (await page.textContent('.ot-movebtn')) !== before || (await page.locator('.mp-dialog').count()) === 0);
  const reacts = await page.$$eval('.ot-seg button[aria-pressed]', (b) => b.map((x) => x.textContent.trim()).filter((t) => /Sem reação|Derreter|Vaporizar/.test(t)));
  check('a reação é escolhida: sem reação e Derreter (time com Cryo)', reacts.includes('Sem reação') && reacts.includes('Derreter'), reacts.join(','));
  const crits = await page.$$eval('.ot-seg button', (b) => b.map((x) => x.textContent.trim()).filter((t) => /Média|Sempre|Nunca/.test(t)));
  check('o tipo de crítico é escolhido', crits.includes('Média') && crits.includes('Sempre') && crits.includes('Nunca'), crits.join(','));
  await page.click('.ot-seg button:has-text("Sem reação")');
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const semReacao = Number((await page.textContent('.ot-build .val b')).replace(/\./g, ''));
  await page.click('.ot-seg button:has-text("Derreter")');
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  await page.waitForTimeout(400);
  const comDerreter = Number((await page.textContent('.ot-build .val b')).replace(/\./g, ''));
  check('o mesmo golpe vale mais com Derreter do que sem reação', comDerreter > semReacao, `${semReacao} < ${comDerreter}`);
  check('o resultado diz qual golpe e qual reação foram otimizados', /Derreter/.test(await page.textContent('.ot-build .val small')), await page.textContent('.ot-build .val small'));

  // ---- Buff de suporte (Bennett: ATK fixo que ele dá ao time) ----
  await page.goto(`${BASE}/projeto/exemplo/personagem/Bennett?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.click('.ot-seg[aria-label="O que otimizar"] button:has-text("Buff")');
  check('Buff lista o que o Bennett dá ao time e cresce com o ATK dele', /ATK fixo/.test(await page.textContent('.ot-seg[aria-label="Buff"]')), (await page.textContent('.ot-seg[aria-label="Buff"]')).slice(0, 80));
  await page.click('.ot-go-btn');
  await page.waitForSelector('.ot-build', { timeout: 120000 });
  const buffVals = await page.$$eval('.ot-build .val b', (b) => b.map((x) => Number(x.textContent.replace(/\./g, ''))));
  check('o melhor build é o que dá o maior valor do buff', buffVals.length > 0 && buffVals[0] >= Math.max(...buffVals) && buffVals[0] > 0, buffVals.join(' > '));

  // ---- Equipe: clicar no retrato troca o personagem ----
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  await page.locator('.eq-card button.who').nth(1).click();
  await page.waitForSelector('.dz-dialog');
  check('tocar no retrato abre a escolha de personagem', /Trocar/.test(await page.textContent('.dz-dialog')));
  await page.keyboard.press('Escape');
  check('o cartão tem "Ajustar build" e não tem mais "Otimizar artefatos"', (await page.locator('.eq-card a:has-text("Ajustar build")').count()) === 4 && (await page.locator('.eq-card a:has-text("Otimizar artefatos")').count()) === 0);
  await page.click('.eq-card:has(.name:text-is("Citlali")) a:has-text("Ajustar build")');
  await page.waitForSelector('.pc-gear');
  await page.click('.pc-views button:has-text("Otimizar")');
  await page.waitForSelector('.ot-top');
  check('a aba Otimizar da Citlali abre o otimizador dela (individual)', /personagem\/Citlali/.test(page.url()) && /aba=otimizar/.test(page.url()));
  const citER = Number((await page.textContent('.ot-minchip:has-text("Recarga") b')).replace('%', '').replace(',', '.'));
  check('cada personagem tem a própria configuração: a Citlali já vem com a Recarga que a calculadora pede', citER > 150 && citER < 260, String(citER));
  await addMin('cr', '77');
  await page.click('.pc-tabs a:has-text("Mavuika")'); await page.waitForSelector('.ot-top');
  check('voltar à Mavuika mostra a configuração dela, sem a da Citlali', (await page.locator('.ot-minchip:has-text("Taxa crítica")').count()) === 0);
  await page.click('.pc-tabs a:has-text("Citlali")'); await page.waitForSelector('.ot-top');
  check('a configuração da Citlali fica guardada ao voltar', /77/.test(await page.textContent('.ot-minchip:has-text("Taxa crítica")')));
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  check('a barra de passos tem 2 passos', /Passo 1 de 2/.test(await page.textContent('.dz-stepbar')));

  // ---- Personagens ----
  await page.click('.dz-nav a:has-text("Personagens")');
  await page.waitForSelector('.pe-card');
  check('Personagens mostra os do inventário', (await page.locator('.pe-card').count()) >= 1 && /Mavuika/.test(await page.textContent('.pe-grid')));
  await page.locator('button:has-text("Todos")').first().click();
  await page.waitForTimeout(300);
  check('"Todos" lista bem mais personagens', (await page.locator('.pe-card').count()) > 50);
  await page.screenshot({ path: path.join(OUT, 'personagens.png') });

  // ---- Ferramentas ----
  await page.click('.dz-navbtn');
  const tools = await page.$$eval('.dz-menu-item', (a) => a.map((x) => x.textContent.trim()));
  check('Ferramentas reúne Recarga e Comparar fora de um time', tools.join('|') === 'Recarga de energia|Comparar dois times', tools.join('|'));
  await page.keyboard.press('Escape');

  // ---- celular ----
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika?aba=otimizar`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ot-top');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check('celular sem rolagem horizontal no otimizador', !overflow);
  await page.screenshot({ path: path.join(OUT, 'otimizador-cel.png') });

  console.log(problems.length ? `\nProblemas de consola:\n${problems.join('\n')}` : '\nProblemas de consola: nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  await browser.close();
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})();
