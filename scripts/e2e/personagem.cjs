/**
 * Redesign, tela Personagem (/projeto/:id/personagem/:nome): constelação, talentos, rolls, build, tabela de dano,
 * reações, buffs recebidos e ferramentas (otimizador e inventário GOOD).
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/personagem.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4173';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.join(__dirname, 'fixtures', 'inventario.good.json');

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };
const num = (t) => Number(String(t).replace(/\./g, '').replace(',', '.').replace('%', ''));

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(1000);
  const field = (label) => page.locator(`label.dz-field:has(span:text-is("${label}"))`);
  const firstAvg = async () => page.$eval('.pc-dmg tbody tr:nth-child(2) td.avg', (e) => e.textContent);
  const eff = () => page.textContent('[data-testid="effective-talents"]');
  const openSubs = async () => { if (await page.locator('.db-subs button:has-text("Editar substats")').count()) { await page.click('.db-subs button:has-text("Editar substats")'); await page.waitForTimeout(300); } };
  const openMore = async () => { if (!(await page.locator('.gr-more[open]').count())) { await page.click('.gr-more summary'); await page.waitForTimeout(200); } };

  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.db-cols');
  // Resumo e build são a mesma aba; os nomes antigos continuam valendo nos passos abaixo.
  const view = async (name) => { const tab = /^(Resumo|Build)$/.test(name) ? 'Resumo e build' : name; await page.click(`.pc-views button:has-text("${tab}")`); await page.waitForTimeout(250); };

  // Duas abas: Resumo e build (padrão) e Avançado
  const views = await page.$$eval('.pc-views button', (b) => b.map((x) => x.textContent));
  check('o personagem tem 4 abas: Resumo e build, Talentos, Otimizar e Avançado', views.join() === 'Resumo e build,Talentos,Otimizar,Avançado', views.join());

  // Talentos e constelações: texto do jogo, passos de nível, mapa de estrelas, condições e "ver tudo"
  await page.click('.pc-views button:has-text("Talentos")');
  await page.waitForSelector('.tl-card');
  check('Talentos: constelação, 3 talentos e 3 passivas em cartões (7)', (await page.locator('.tl-grid > .tl-card').count()) === 7 && (await page.locator('.tl-card.cons').count()) === 1);
  check('a coluna do personagem some nesta aba e a grade usa a largura toda', (await page.locator('.pc-aside').count()) === 0);
  const rowTops = await page.$$eval('.tl-grid > .tl-card:not(.cons)', (c) => c.slice(0, 3).map((x) => Math.round(x.getBoundingClientRect().height)));
  check('os 3 talentos da mesma linha têm a mesma altura', new Set(rowTops).size === 1, rowTops.join(','));
  const underlined = await page.$$eval('.tl *', (els) => els.filter((e) => getComputedStyle(e).textDecorationLine.includes('underline')).length);
  check('nenhum texto sublinhado na aba Talentos', underlined === 0, String(underlined));
  await page.click('g[aria-label="Constelação 2"]'); await settle();
  check('clicar na estrela C2 acende até ela (C2 no passo)', /C2/.test(await page.textContent('.tl-card.cons .step span')) && (await page.locator('.tl-card.cons .cst[data-lit="true"]').count()) === 2);
  await page.click('button[aria-label="Diminuir: Constelação"]'); await settle();
  await page.click('button[aria-label="Diminuir: Constelação"]'); await settle();
  check('o passo − volta a C0', /C0/.test(await page.textContent('.tl-card.cons .step span')));
  await page.click('button[aria-label="Aumentar: Nível de Habilidade elemental"]'); await settle();
  check('o passo de nível da habilidade sobe para Nv 11', /Nv 11/.test(await page.textContent('.tl-card[aria-label="Momento do Nome"] .step span')));
  await page.keyboard.press('Control+z'); await settle();
  await page.click('.tl-card[aria-label="Momento do Nome"] .tl-desc button'); await page.waitForSelector('.dz-dialog');
  check('"ver tudo" abre o texto completo do jogo e Esc fecha', (await page.textContent('.dz-dialog .tl-full')).length > 150);
  await page.keyboard.press('Escape');
  check('Esc fecha o texto completo', (await page.locator('.dz-dialog').count()) === 0);
  const tlBefore = await page.locator('.tl-cond[data-active="true"]').count();
  await page.locator('.tl-cond[data-active="true"]').first().locator('input').uncheck(); await page.waitForTimeout(900);
  check('desligar uma condição do personagem a marca como desligada', (await page.locator('.tl-cond[data-active="true"]').count()) === tlBefore - 1);
  await page.locator('.tl-cond[data-active="false"]:not([data-locked="true"])').first().locator('input').check(); await page.waitForTimeout(600);
  await page.click('.pc-views button:has-text("Resumo e build")');
  check('abre no Resumo, com o painel de colunas', (await page.getAttribute('.pc-views button:has-text("Resumo e build")', 'aria-selected')) === 'true' && (await page.locator('.db-cols').count()) === 1);
  check('o Resumo não tem o bloco "Maiores golpes" nem a tabela inteira', (await page.locator('.dz-panel:has(h2:text-is("Maiores golpes"))').count()) === 0 && (await page.locator('.dz-panel:has(h2:text-is("Tabela de dano"))').count()) === 0);
  check('Resumo e build na mesma página: faixa de build, substats e atributos', (await page.locator('.pcard.weapon').count()) === 1 && (await page.locator('.gt-piece').count()) === 5 && (await page.locator('.db-subs').count()) === 1 && (await page.locator('.db-panel:has(h3:text-is("Atributos"))').count()) === 1);
  check('as ferramentas ficam só no Avançado', (await page.locator('.dz-panel:has(h2:text-is("Ferramentas"))').count()) === 0);

  // Abas e cabeçalho
  const tabs = await page.$$eval('.pc-tabs a', (a) => a.map((x) => x.textContent));
  check('uma sub-aba por personagem com a % do dano', tabs.length === 4 && /Mavuika.*95,3%/.test(tabs[0]) && /Citlali.*2,7%/.test(tabs[1]), tabs.join(' | '));
  check('a aba Equipe do time está marcada (o personagem fica dentro dela)', (await page.getAttribute('.dz-subnav a:has-text("Equipe")', 'aria-current')) === 'page');

  // Atributos do gabarito
  const attrs = await page.locator('.db-panel:has(h3:text-is("Atributos"))').textContent();
  check('atributos finais do gabarito (ATK 5.791, EM 424, Taxa 98,9%, Dano 231,8%)', /5\.791/.test(attrs) && /424/.test(attrs) && /98,9%/.test(attrs) && /231,8%/.test(attrs));
  check('mostra o valor base ao lado do ATK', /1\.100 ATK base/.test(attrs));

  // Tabela de dano (aba Avançado): sem nomes repetidos, reação filtrada
  await view('Avançado');
  await page.waitForSelector('.pc-dmg');
  check('a aba escolhida vai para o endereço (?aba=avancado)', /aba=avancado/.test(page.url()));
  const names = await page.$$eval('.pc-dmg tbody tr:not(.grp) td:first-child', (e) => e.map((x) => x.textContent.replace(/\s*·\s*\d+×$/, '').trim()));
  check('a tabela não tem nomes repetidos dentro do mesmo grupo', new Set(names).size >= names.length - 1, `${names.length} golpes`);
  check('as quedas viram "Queda (baixa altitude)" e "Queda (alta altitude)"', names.includes('Queda (baixa altitude)') && names.includes('Queda (alta altitude)'));
  const groups = await page.$$eval('.pc-dmg tr.grp', (e) => e.map((x) => x.textContent));
  check('grupos com o nível do talento', groups.length === 3 && groups.every((g) => /nv 10/.test(g)), groups.join(' | '));
  const reactions = await page.$$eval('.dz-seg[aria-label="Reação da tabela de dano"] button', (b) => b.map((x) => x.textContent));
  check('só as reações possíveis com o time (Sem reação e Derreter)', reactions.join() === 'Sem reação,Derreter', reactions.join());
  const avg0 = num(await firstAvg());
  await page.click('.dz-seg[aria-label="Reação da tabela de dano"] button:has-text("Derreter")'); await page.waitForTimeout(300);
  const avgMelt = num(await firstAvg());
  check('escolher Derreter aumenta o dano da tabela', avgMelt > avg0 * 2, `${avg0} → ${avgMelt}`);

  // Reações deste time
  const rx = await page.locator('.dz-panel:has(h2:text-is("Reações deste time"))').textContent();
  check('reações do time: Derreter ×3,29 e Sobrecarga', /Derreter \(Pyro\)/.test(rx) && /×3,29/.test(rx) && /Sobrecarga/.test(rx));

  // Buffs recebidos
  const buffs = await page.$$eval('.pc-buffs .b', (b) => b.map((x) => x.textContent));
  check('buffs recebidos com fonte e participação', buffs.length >= 6 && buffs.some((t) => /ATK fixo de Bennett/.test(t) && /21,5%/.test(t)), `${buffs.length} buffs`);
  check('buffs sem origem ficam marcados A CONFIRMAR', buffs.some((t) => /A CONFIRMAR/.test(t)));
  const avgBefore = num(await firstAvg());
  await page.click('.pc-buffs .b:has-text("ATK fixo de Bennett") input'); await settle();
  const avgOff = num(await firstAvg());
  check('desmarcar o ATK fixo do Bennett reduz o dano (e mostra "desligado")', avgOff < avgBefore * 0.85 && /desligado/.test(await page.locator('.pc-buffs .b:has-text("ATK fixo de Bennett")').textContent()), `${avgBefore} → ${avgOff}`);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z liga o buff de volta', Math.abs(num(await firstAvg()) - avgBefore) < 1);

  // Constelação e talentos
  check('talentos efetivos iniciais 10/10/10', /10\/10\/10/.test(await eff()));
  await page.click('g[aria-label^="Constelação 3"]'); await settle();
  check('C3 soma +3 ao Supremo (10/10/13)', /10\/10\/13/.test(await eff()), await eff());
  check('a estrela C3 fica acesa e o selo mostra C3', (await page.getAttribute('g[aria-label^="Constelação 3"]', 'aria-pressed')) === 'true' && /C3/.test(await page.textContent('.sc-cons .badge')));
  await page.keyboard.press('Control+z'); await settle();
  await page.fill('input[aria-label="Nível de talento: Habilidade"]', '13'); await page.locator('input[aria-label="Nível de talento: Habilidade"]').blur(); await settle();
  check('subir o nível da habilidade para 13', /10\/13\/10/.test(await eff()), await eff());
  await page.keyboard.press('Control+z'); await settle();

  // Rolls manuais (aba Build)
  await view('Build');
  await openSubs();
  check('o painel de substats mostra as estrelas (otimizado)', (await page.locator('.db-subs .sr').count()) === 10 && /OTIMIZADO/.test(await page.textContent('.db-subs .badge')));
  check('modo Otimizar mostra o orçamento de rolls (40 de 40)', /40 de 40 rolls · 20 fixos em crítico/.test(await page.locator('.dz-panel:has(h2:text-is("Substats (rolls)"))').textContent()));
  await page.click('.dz-seg[aria-label="Modo dos substats"] button:has-text("À mão")'); await settle();
  check('o modo à mão mostra os valores brutos (em %) por padrão', (await field('Taxa crít. (valor total em %)').count()) === 1);
  await field('Taxa crít. (valor total em %)').locator('input').fill('33'); await field('Taxa crít. (valor total em %)').locator('input').blur(); await settle();
  check('33% de Taxa Crítica vira 10 rolls (33 ÷ 3,3)', (await page.click('.dz-seg[aria-label="Unidade dos substats"] button:has-text("Rolls")'), await field('Taxa crít. (máx. 30)').locator('input').inputValue()) === '10');
  const crit = await page.locator('.db-panel:has(h3:text-is("Atributos"))').textContent();
  check('editar rolls à mão muda a Taxa crítica', !/98,9%/.test(crit), crit.match(/Taxa crítica\s*[\d,]+%/)?.[0]);
  await page.click('.dz-seg[aria-label="Modo dos substats"] button:has-text("Otimizar")'); await settle();
  check('voltar ao Otimizar restaura os 98,9%', /98,9%/.test(await page.locator('.db-panel:has(h3:text-is("Atributos"))').textContent()));

  // Editor de build
  await page.click('.db-toolbar button:has-text("Editar build")'); await page.waitForSelector('.dz-dialog');
  check('o editor só traz os atributos das peças (arma e set têm seletores próprios)', (await page.locator('.dz-dialog label.dz-field:has(span:text-is("Arma"))').count()) === 0 && (await page.locator('.dz-dialog .fx-slot[data-slot="sands"]').count()) === 1);
  await page.keyboard.press('Escape');
  check('Esc fecha o editor', (await page.locator('.dz-dialog').count()) === 0);
  check('a faixa de build mostra a arma e as 5 peças', (await page.$$('.gt-piece')).length === 5 && /A Thousand Blazing Suns/.test(await page.textContent('.pcard.weapon')));

  // Equipamento com imagens e passivas em português
  check('a arma tem imagem e cada peça mostra o set', (await page.locator('.pcard.weapon .art img').count()) === 1 && /Obsidian Codex/.test(await page.textContent('.gt-piece')));
  await openMore();
  const passive = await page.textContent('.pc-pcard[aria-label="Passiva da arma"]');
  check('a passiva da arma aparece em português, com o nome', /Brilho Escaldante/.test(passive), passive.replace(/\s+/g, ' ').slice(0, 110));
  const setCard = await page.textContent('.pc-pcard[aria-label="Bônus dos sets"]');
  check('os bônus do set (2 e 4 peças) aparecem em português', /2 peças/.test(setCard) && /4 peças/.test(setCard) && /Obsidian Codex/.test(setCard));
  const r1 = await page.textContent('.pc-pcard[aria-label="Passiva da arma"] p');
  await page.click('.pc-refine button:has-text("R5")'); await settle();
  check('o refino R5 muda o texto da passiva e marca o R5', (await page.textContent('.pc-pcard[aria-label="Passiva da arma"] p')) !== r1 && (await page.getAttribute('.pc-refine button:has-text("R5")', 'aria-pressed')) === 'true');
  await page.click('.pc-refine button:has-text("R1")'); await settle();

  // Popup da arma (no ícone): passiva, stats e o botão de ativar o buff
  await page.click('.pcard.weapon .art.info');
  await page.waitForSelector('[role="dialog"][aria-label^="Passiva de"]');
  check('o ícone da arma abre o popup com a passiva e os stats', (await page.locator('.dz-dialog.wi .wi-sec h3').count()) >= 2 && /ATK base \d/.test(await page.textContent('.wi-top')) && (await page.locator('.dz-dialog .wcard').count()) === 0);
  const sw = page.locator('.wi-buff input');
  if (await sw.count()) {
    const before = await sw.first().isChecked();
    await sw.first().click(); await settle();
    check('o botão do buff liga e desliga', (await page.locator('.wi-buff input').first().isChecked()) === !before);
    await page.locator('.wi-buff input').first().click(); await settle();
  } else check('a arma sem buff cadastrado avisa isso', /não tem buff/.test(await page.textContent('.dz-dialog.wi')));
  await page.keyboard.press('Escape');
  check('Esc fecha o popup', (await page.locator('.dz-dialog.wi').count()) === 0);

  // Buffs de teste: qualquer tipo de bônus no Editar build
  await view('Build');
  const atkBefore = await page.textContent('.db-panel:has(h3:text-is("Atributos")) li:has-text("ATK") b');
  await page.click('button:has-text("Editar build")');
  await page.waitForSelector('.dz-dialog .cb');
  await page.selectOption('.cb select[aria-label="Tipo de bônus"]', 'ATK%');
  await page.fill('.cb input[aria-label="Valor do bônus"]', '50');
  await page.click('.cb button:has-text("Adicionar")'); await settle();
  check('o Editar build aceita buffs de teste de qualquer tipo (grupos do catálogo)', (await page.locator('.cb-list li').count()) === 1 && (await page.locator('.cb select[aria-label="Tipo de bônus"] optgroup').count()) >= 6, `${await page.locator('.cb-list li').count()} itens, ${await page.locator('.cb select[aria-label="Tipo de bônus"] optgroup').count()} grupos`);
  await page.keyboard.press('Escape'); await settle();
  const atkAfter = await page.textContent('.db-panel:has(h3:text-is("Atributos")) li:has-text("ATK") b');
  check('o buff de teste entra no cálculo (ATK sobe)', Number(atkAfter.replace(/\./g, '')) > Number(atkBefore.replace(/\./g, '')), `${atkBefore} → ${atkAfter}`);
  await page.keyboard.press('Control+z'); await settle();

  // Trocar arma: grade com imagens, filtro por raridade e busca
  await page.click('.pcard.weapon .setname'); await page.waitForSelector('.dz-dialog .wcard');
  check('o seletor de armas é uma grade de cards com imagem', (await page.locator('.dz-dialog .wcard').count()) > 10 && (await page.locator('.dz-dialog .wcard img').count()) > 5);
  check('a arma atual vem marcada como Equipada', (await page.locator('.dz-dialog .wcard[data-current="true"]').count()) === 1);
  await page.click('.dz-dialog .dz-seg button:has-text("4★")'); await settle();
  const only5 = await page.locator('.dz-dialog .wcard[data-rarity="4"]').count();
  check('desligar 4★ some com as armas de 4 estrelas', only5 === 0);
  const before = await page.locator('.dz-dialog .wcard').count();
  await page.fill('.dz-dialog input[type="search"]', 'Wolf'); await settle();
  check('a busca filtra as armas pelo nome', (await page.locator('.dz-dialog .wcard').count()) < before && (await page.locator('.dz-dialog .wcard').count()) >= 1);
  await page.keyboard.press('Escape');
  check('Esc fecha o seletor de armas', (await page.locator('.dz-dialog').count()) === 0);
  await page.click('.pcard.weapon .setname'); await page.waitForSelector('.dz-dialog .wcard');
  await page.fill('.dz-dialog input[type="search"]', 'Royal Greatsword'); await settle();
  await page.click('.dz-dialog .wcard:has-text("Royal Greatsword")'); await settle();
  check('escolher uma arma troca a arma e fecha o seletor', /Royal Greatsword/.test(await page.textContent('.pcard.weapon')) && (await page.locator('.dz-dialog').count()) === 0);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z devolve a arma anterior', /A Thousand Blazing Suns/.test(await page.textContent('.pcard.weapon')));

  // Trocar set: grade com imagem e o bônus de 2 peças
  await page.click('.pc-pcard[aria-label="Bônus dos sets"] button:has-text("Trocar set")'); await page.waitForSelector('.dz-dialog .scard');
  check('o seletor de sets é uma grade de cards com imagem e bônus', (await page.locator('.dz-dialog .scard').count()) > 10 && (await page.locator('.dz-dialog .scard img').count()) > 5 && /2 peças/.test(await page.textContent('.dz-dialog .scard')));
  check('o set atual vem marcado como Em uso', (await page.locator('.dz-dialog .scard[data-current="true"]').count()) === 1);
  await page.fill('.dz-dialog input[type="search"]', 'Noblesse'); await settle();
  check('a busca filtra os sets', (await page.locator('.dz-dialog .scard').count()) === 1);
  await page.click('.dz-dialog .scard'); await settle();
  const setText = await page.textContent('.pc-pcard[aria-label="Bônus dos sets"]');
  check('escolher o set troca o bônus mostrado (4 peças)', /Noblesse Oblige/.test(setText) && /4 peças/.test(setText) && (await page.locator('.dz-dialog').count()) === 0, setText.replace(/\s+/g, ' ').slice(0, 90));
  await page.click('.pc-pcard[aria-label="Bônus dos sets"] button:has-text("Trocar set")'); await page.waitForSelector('.dz-dialog .scard');
  await page.click('.dz-dialog .dz-seg button:has-text("2 + 2")');
  await page.fill('.dz-dialog input[type="search"]', 'Noblesse'); await settle(); await page.click('.dz-dialog .scard');
  await page.fill('.dz-dialog input[type="search"]', 'Instructor'); await settle(); await page.click('.dz-dialog .scard'); await settle();
  check('2 + 2: dois sets com o bônus de 2 peças de cada', /2 \+ 2 peças/.test(await page.textContent('.pc-pcard[aria-label="Bônus dos sets"]')));
  await page.keyboard.press('Control+z'); await settle();
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z devolve o set original', /Obsidian Codex/.test(await page.textContent('.pc-pcard[aria-label="Bônus dos sets"]')));

  await view('Avançado');
  check('o Avançado não tem mais o painel Ferramentas', (await page.locator('.dz-panel:has(h2:text-is("Ferramentas"))').count()) === 0);

  // Valor de +1 roll: abaixo de "Reações deste time"
  const roll = await page.locator('.dz-panel:has(h2:text-is("Valor de +1 roll"))').textContent();
  check('valor de +1 roll mostra Dano crítico como o mais valioso', /Dano Crítico.*\+1,[89]\d%/.test(roll), roll.match(/Dano Crítico[^A-Z]*/)?.[0]);
  const below = await page.evaluate(() => { const r = document.querySelector('.dz-panel:has(h2)') && [...document.querySelectorAll('.dz-panel')].find((p) => p.querySelector('h2')?.textContent === 'Reações deste time'); const v = [...document.querySelectorAll('.dz-panel')].find((p) => p.querySelector('h2')?.textContent === 'Valor de +1 roll'); return r && v && v.getBoundingClientRect().top >= r.getBoundingClientRect().bottom - 1 && Math.abs(v.getBoundingClientRect().left - r.getBoundingClientRect().left) < 2; });
  check('o Valor de +1 roll fica abaixo de Reações deste time', !!below);

  // Inventário GOOD (pela ligação do painel de substats): leva à tela Inventário
  await view('Build');
  await openSubs();
  await page.click('.dz-panel:has(h2:text-is("Substats (rolls)")) button:has-text("Usar o inventário GOOD")'); await page.waitForTimeout(800);
  check('o link do Build leva à tela Inventário', /\/inventario/.test(page.url()));
  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika`, { waitUntil: 'networkidle' });

  // Navegação entre personagens e id inexistente
  await view('Avançado');
  await page.click('.pc-tabs a:has-text("Citlali")');
  await page.waitForURL(/personagem\/Citlali/);
  await page.waitForSelector('.pc-dmg');
  check('trocar de aba abre a calculadora da Citlali (reações Cryo)', /Citlali/.test(await page.textContent('.sc-art h2')) && /Derreter \(Cryo\)/.test(await page.textContent('.dz-panel:has(h2:text-is("Reações deste time"))')));
  await page.goto(`${BASE}/projeto/exemplo/personagem/Fantasma`, { waitUntil: 'networkidle' });
  await page.waitForURL(/personagem\/Mavuika/);
  check('personagem que não está no time volta para o primeiro', true);

  await page.screenshot({ path: path.join(OUT, 'r-personagem.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(500);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-personagem-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
