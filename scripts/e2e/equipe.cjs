/**
 * Redesign, tela Equipe (/projeto/:id): KPIs do exemplo, cartões, troca/remoção/adição de personagem e navegação.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/equipe.cjs
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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { // O Lunaris não tem ícone do Viajante (404 esperado; o avatar cai na inicial).
    if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(900);
  const cards = () => page.$$eval('.eq-card .name', (e) => e.map((x) => x.textContent));
  const kpi = (label) => page.locator(`.dz-kpi:has(.lbl:text-is("${label}")) .v`).textContent();

  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.eq-card');

  check('DPS do time do exemplo é 216.600', (await kpi('DPS do time')) === '216.600', await kpi('DPS do time'));
  check('dano da rotação do exemplo é 3.790.496', (await kpi('Dano da rotação')) === '3.790.496', await kpi('Dano da rotação'));
  check('a reação principal é Derreter', (await kpi('Reação principal')) === 'Derreter');
  check('quatro cartões na ordem do time', (await cards()).join() === 'Mavuika,Citlali,Iansan,Bennett', (await cards()).join());
  const roles = await page.$$eval('.eq-card .role', (e) => e.map((x) => x.textContent));
  check('papéis vêm da participação no dano (DPS principal e suportes)', /DPS principal · Pyro/.test(roles[0]) && roles.slice(1).every((r) => /Suporte/.test(r)), roles.join(' | '));
  const mav = await page.locator('.eq-card:has(.name:text-is("Mavuika"))').textContent();
  const gear = page.locator('.eq-card:has(.name:text-is("Mavuika")) .eq-gear');
  check('o cartão da Mavuika mostra ATK e críticos reais', /5\.791/.test(mav) && /98,9%/.test(mav) && /231,8%/.test(mav));
  check('arma e artefatos são só imagem (sem o texto do equipamento)', !/A Thousand Blazing Suns/.test(mav) && !/Obsidian Codex/.test(mav) && (await gear.locator('img').count()) === 6);
  check('as imagens têm nome acessível com arma e set', /A Thousand Blazing Suns/.test(await gear.locator('.eq-tile.weapon').getAttribute('aria-label')) && /Obsidian Codex/.test(await gear.locator('.eq-pieces').getAttribute('title')));
  check('o set 4 peças não usa as cores de 2+2', (await gear.getAttribute('data-mode')) === 'four' && (await gear.locator('.eq-tile.piece[data-tone]').count()) === 0);
  await gear.locator('.eq-tile.weapon').click();
  await page.waitForSelector('.dz-dialog .wcard');
  check('tocar na arma abre a troca de arma', /Trocar arma/.test(await page.textContent('.dz-dialog')));
  await page.keyboard.press('Escape');
  await gear.locator('.eq-tile.piece').first().click();
  await page.waitForSelector('.dz-dialog .scard');
  check('tocar num artefato abre a troca de set', /Set de artefatos/.test(await page.textContent('.dz-dialog')));
  await page.click('.dz-dialog button:has-text("2 + 2 peças")');
  const items = page.locator('.dz-dialog .scard');
  await items.nth(0).click();
  await items.nth(1).click();
  await page.waitForTimeout(600);
  check('2+2 vira dois sets com cores e selo "2" diferentes', (await gear.getAttribute('data-mode')) === 'two-two' && (await gear.locator('.eq-tile.piece[data-tone="a"]').count()) >= 2 && (await gear.locator('.eq-tile.piece[data-tone="b"]').count()) >= 2 && (await gear.locator('.eq-tile .badge').count()) >= 5);
  await page.screenshot({ path: path.join(OUT, 'r-equipe-2x2.png') });
  await page.keyboard.press('Control+z'); await settle();
  const cit = await page.locator('.eq-card:has(.name:text-is("Citlali"))').textContent();
  check('a Citlali mostra o que dá ao time (RES e Maestria)', /RES Pyro\/Hydro −20%/.test(cit) && /\+120 EM/.test(cit), cit.match(/RES[^A-Z]*/)?.[0]);
  const ben = await page.locator('.eq-card:has(.name:text-is("Bennett"))').textContent();
  check('o Bennett mostra o ATK fixo e o set', /ATK fixo/.test(ben) && /\+20% ATK/.test(ben));
  const chips = await page.$$eval('.dz-chips .dz-chip', (e) => e.map((x) => x.textContent));
  check('chips de configuração e ressonância Pyro', chips.some((c) => /Inimigo nível 100/.test(c)) && chips.some((c) => /Rotação de 17,5 s/.test(c)) && chips.some((c) => /Ressonância Pyro/.test(c)), chips.join(' | '));
  await page.screenshot({ path: path.join(OUT, 'r-equipe.png'), fullPage: true });

  // Navegação
  check('a aba Equipe está marcada', (await page.getAttribute('.dz-subnav a:has-text("Equipe")', 'aria-current')) === 'page');
  await page.click('.eq-card:has(.name:text-is("Citlali")) a:has-text("Ajustar build")');
  await page.waitForURL(/\/projeto\/exemplo\/personagem\/Citlali/);
  check('Ajustar build leva à aba do personagem', true);
  await page.goBack(); await page.waitForSelector('.eq-card');

  // Trocar, remover e adicionar
  await page.click('.eq-card:has(.name:text-is("Bennett")) button.who');
  await page.fill('.dz-dialog input[type="search"]', 'Xingqiu');
  await page.click('.dz-dialog .pick:has-text("Xingqiu")'); await settle();
  check('trocar o Bennett pelo Xingqiu', (await cards()).join() === 'Mavuika,Citlali,Iansan,Xingqiu', (await cards()).join());
  const pyroChip = await page.locator('.dz-chips').textContent();
  check('ao sair o 2º Pyro, a ressonância Pyro some do cabeçalho', !/Ressonância Pyro/.test(pyroChip), pyroChip.slice(0, 80));
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z desfaz a troca', (await cards()).join() === 'Mavuika,Citlali,Iansan,Bennett', (await cards()).join());

  check('não há mais botão Remover nos cartões', (await page.locator('.eq-card button:has-text("Remover")').count()) === 0);
  await page.click('.eq-card:has(.name:text-is("Bennett")) button.who');
  await page.click('.dz-dialog button:has-text("Deixar a vaga vazia")'); await settle();
  check('esvaziar a vaga deixa 3 personagens e 1 personagem vazio', (await cards()).length === 3 && (await page.locator('.eq-add').count()) === 1 && /Personagem vazio/.test(await page.textContent('.eq-add')));
  await page.click('.eq-add');
  check('o diálogo não oferece quem já está no time', !(await page.$$eval('.dz-dialog .pick .n', (e) => e.map((x) => x.textContent))).some((n) => ['Mavuika', 'Citlali', 'Iansan'].includes(n)));
  await page.keyboard.press('Escape');
  check('Esc fecha o diálogo', (await page.locator('.dz-dialog').count()) === 0);
  await page.keyboard.press('Control+z'); await settle();

  // Favoritar e duplicar
  await page.click('button:has-text("Salvar nos Times")');
  await page.waitForURL('**/vault'); await page.waitForSelector('.vt-card');
  check('Salvar nos Times leva aos Times com o time favoritado', (await page.locator('.vt-fav[aria-pressed="true"]').count()) === 1);
  await page.goto(`${BASE}/projeto/exemplo`, { waitUntil: 'networkidle' }); await page.waitForSelector('.eq-card');
  check('o botão passa a "Salvo nos Times"', (await page.locator('button:has-text("Salvo nos Times")').count()) === 1);
  await page.click('button:has-text("Duplicar")');
  await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/);
  await page.waitForSelector('.eq-card');
  check('duplicar abre a cópia com o mesmo DPS', (await kpi('DPS do time')) === '216.600');

  // Persistência
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.eq-card');
  check('a cópia sobrevive ao recarregar', (await cards()).length === 4);

  // Buffs recebidos: ligar e desligar por personagem
  const mavCard = page.locator('.eq-card:has(.name:text-is("Mavuika"))');
  const citCard = page.locator('.eq-card:has(.name:text-is("Citlali"))');
  check('cada cartão tem "Buffs recebidos" com a contagem de ativos', (await page.locator('.eq-buffs .bc-head').count()) === 4 && /\d+\/\d+/.test(await mavCard.locator('.bc-badge').textContent()));
  await mavCard.locator('.bc-head').click();
  const mavOn0 = Number((await mavCard.locator('.bc-badge').textContent()).split('/')[0]);
  const dps0 = await kpi('DPS do time');
  await mavCard.locator('.bcard:has(.bc-tag:text-is("Arma")) input').uncheck(); await settle();
  check('desligar a arma da Mavuika baixa o DPS e o contador', (await kpi('DPS do time')) !== dps0 && Number((await mavCard.locator('.bc-badge').textContent()).split('/')[0]) === mavOn0 - 1, `${dps0} -> ${await kpi('DPS do time')}`);
  await mavCard.locator('.bcard:has(.bc-tag:text-is("Arma")) input').check(); await settle();
  check('religar volta ao DPS de antes', (await kpi('DPS do time')) === dps0);
  // um buff de equipe desligado só para a Mavuika continua ligado para a Citlali
  await citCard.locator('.bc-head').click();
  const citBefore = await citCard.locator('.bcard[data-active="true"]').count();
  await mavCard.locator('.bcard:has(.bc-n:text-is("ATK fixo de Bennett")) input').uncheck(); await settle();
  check('desligar o ATK do Bennett só para a Mavuika não mexe nos buffs da Citlali', (await citCard.locator('.bcard[data-active="true"]').count()) === citBefore);
  await mavCard.locator('.bc-bulk button:text-is("Desligar todos")').click(); await settle();
  check('"Desligar todos" zera os ativos dele', (await mavCard.locator('.bc-badge').textContent()).startsWith('0/'));
  await mavCard.locator('.bc-bulk button:text-is("Ligar todos")').click(); await settle();
  check('"Ligar todos" volta ao DPS do exemplo', (await kpi('DPS do time')) === dps0);
  check('o exemplo avisa que está no modo planilha', (await page.locator('.eq-compat').count()) === 1);
  await page.click('.eq-compat button'); await settle();
  check('"Usar todos os efeitos" libera as constelações e some o aviso', (await page.locator('.eq-compat').count()) === 0 && (await kpi('DPS do time')) !== dps0);

  // Celular
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-equipe-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
