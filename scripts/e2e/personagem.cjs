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

  await page.goto(`${BASE}/projeto/exemplo/personagem/Mavuika`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pc-hint');
  // Resumo e build são a mesma aba; os nomes antigos continuam valendo nos passos abaixo.
  const view = async (name) => { const tab = /^(Resumo|Build)$/.test(name) ? 'Resumo e build' : name; await page.click(`.pc-views button:has-text("${tab}")`); await page.waitForTimeout(250); };

  // Duas abas: Resumo e build (padrão) e Avançado
  const views = await page.$$eval('.pc-views button', (b) => b.map((x) => x.textContent));
  check('o personagem tem 3 abas: Resumo e build, Otimizar e Avançado', views.join() === 'Resumo e build,Otimizar,Avançado', views.join());
  check('abre no Resumo, com uma frase que explica a aba', (await page.getAttribute('.pc-views button:has-text("Resumo e build")', 'aria-selected')) === 'true' && /build \(arma, artefatos e substats\)/.test(await page.textContent('.pc-hint')));
  check('o Resumo não tem o bloco "Maiores golpes" nem a tabela inteira', (await page.locator('.dz-panel:has(h2:text-is("Maiores golpes"))').count()) === 0 && (await page.locator('.dz-panel:has(h2:text-is("Tabela de dano"))').count()) === 0);
  check('Resumo e build na mesma página: faixa de build, substats e atributos', (await page.locator('.pc-weapon').count()) === 1 && (await page.locator('.pc-rolls').count()) === 1 && (await page.locator('.dz-panel:has(h2:text-is("Atributos"))').count()) === 1);
  check('as ferramentas ficam só no Avançado', (await page.locator('.dz-panel:has(h2:text-is("Ferramentas"))').count()) === 0);

  // Abas e cabeçalho
  const tabs = await page.$$eval('.pc-tabs a', (a) => a.map((x) => x.textContent));
  check('uma sub-aba por personagem com a % do dano', tabs.length === 4 && /Mavuika.*95,3%/.test(tabs[0]) && /Citlali.*2,7%/.test(tabs[1]), tabs.join(' | '));
  check('a aba Equipe do time está marcada (o personagem fica dentro dela)', (await page.getAttribute('.dz-subnav a:has-text("Equipe")', 'aria-current')) === 'page');

  // Atributos do gabarito
  const attrs = await page.locator('.dz-panel:has(h2:text-is("Atributos"))').textContent();
  check('atributos finais do gabarito (ATK 5.791, EM 424, Taxa 98,9%, Dano 231,8%)', /5\.791/.test(attrs) && /424/.test(attrs) && /98,9%/.test(attrs) && /231,8%/.test(attrs));
  check('mostra o valor base ao lado do ATK', /1\.100 base/.test(attrs));

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
  await page.click('button[aria-label="Constelação 3"]'); await settle();
  check('C3 soma +3 ao Supremo (10/10/13)', /10\/10\/13/.test(await eff()), await eff());
  check('o botão C3 fica marcado', (await page.getAttribute('button[aria-label="Constelação 3"]', 'aria-pressed')) === 'true');
  await page.click('button[aria-label="Constelação 0"]'); await settle();
  await field('Habilidade').locator('input').fill('13'); await field('Habilidade').locator('input').blur(); await settle();
  check('subir o nível da habilidade para 13', /10\/13\/10/.test(await eff()), await eff());
  await page.keyboard.press('Control+z'); await settle();

  // Rolls manuais (aba Build)
  await view('Build');
  check('modo Otimizar mostra o orçamento de rolls (40 de 40)', /40 de 40 rolls · 20 fixos em crítico/.test(await page.locator('.dz-panel:has(h2:text-is("Substats (rolls)"))').textContent()));
  await page.click('.dz-seg[aria-label="Modo dos substats"] button:has-text("À mão")'); await settle();
  check('o modo à mão mostra os valores brutos (em %) por padrão', (await field('Taxa crít. (valor total em %)').count()) === 1);
  await field('Taxa crít. (valor total em %)').locator('input').fill('33'); await field('Taxa crít. (valor total em %)').locator('input').blur(); await settle();
  check('33% de Taxa Crítica vira 10 rolls (33 ÷ 3,3)', (await page.click('.dz-seg[aria-label="Unidade dos substats"] button:has-text("Rolls")'), await field('Taxa crít. (máx. 30)').locator('input').inputValue()) === '10');
  await view('Resumo');
  const crit = await page.locator('.dz-panel:has(h2:text-is("Atributos"))').textContent();
  await view('Build');
  check('editar rolls à mão muda a Taxa crítica', !/98,9%/.test(crit), crit.match(/Taxa crítica\s*[\d,]+%/)?.[0]);
  await page.click('.dz-seg[aria-label="Modo dos substats"] button:has-text("Otimizar")'); await settle();
  await view('Resumo');
  check('voltar ao Otimizar restaura os 98,9%', /98,9%/.test(await page.locator('.dz-panel:has(h2:text-is("Atributos"))').textContent()));
  await view('Build');

  // Editor de build
  await page.click('.dz-panel:has(h2:text-is("Equipamento")) button:has-text("Editar build")'); await page.waitForSelector('.dz-dialog');
  check('o editor só traz os atributos das peças (arma e set têm seletores próprios)', (await page.locator('.dz-dialog label.dz-field:has(span:text-is("Arma"))').count()) === 0 && (await page.locator('.dz-dialog .fx-slot[data-slot="sands"]').count()) === 1);
  await page.keyboard.press('Escape');
  check('Esc fecha o editor', (await page.locator('.dz-dialog').count()) === 0);
  check('a faixa de build mostra a arma e as 5 peças', (await page.$$('.pc-piece')).length === 5 && /A Thousand Blazing Suns/.test(await page.textContent('.pc-weapon')));

  // Equipamento com imagens e passivas em português
  check('as peças e a arma têm imagem', (await page.locator('.pc-gear .art img').count()) >= 5, String(await page.locator('.pc-gear .art img').count()));
  const passive = await page.textContent('.pc-pcard[aria-label="Passiva da arma"]');
  check('a passiva da arma aparece em português, com o nome', /Brilho Escaldante/.test(passive), passive.replace(/\s+/g, ' ').slice(0, 110));
  const setCard = await page.textContent('.pc-pcard[aria-label="Bônus dos sets"]');
  check('os bônus do set (2 e 4 peças) aparecem em português', /2 peças/.test(setCard) && /4 peças/.test(setCard) && /Obsidian Codex/.test(setCard));
  const r1 = await page.textContent('.pc-pcard[aria-label="Passiva da arma"] p');
  await page.click('.pc-refine button:has-text("R5")'); await settle();
  check('o refino R5 muda o texto da passiva e marca o R5', (await page.textContent('.pc-pcard[aria-label="Passiva da arma"] p')) !== r1 && (await page.getAttribute('.pc-refine button:has-text("R5")', 'aria-pressed')) === 'true');
  await page.click('.pc-refine button:has-text("R1")'); await settle();

  // Trocar arma: grade com imagens, filtro por raridade e busca
  await page.click('.pc-weapon'); await page.waitForSelector('.dz-dialog .wcard');
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
  await page.click('.pc-weapon'); await page.waitForSelector('.dz-dialog .wcard');
  await page.fill('.dz-dialog input[type="search"]', 'Royal Greatsword'); await settle();
  await page.click('.dz-dialog .wcard:has-text("Royal Greatsword")'); await settle();
  check('escolher uma arma troca a arma e fecha o seletor', /Royal Greatsword/.test(await page.textContent('.pc-weapon')) && (await page.locator('.dz-dialog').count()) === 0);
  await page.keyboard.press('Control+z'); await settle();
  check('Ctrl+Z devolve a arma anterior', /A Thousand Blazing Suns/.test(await page.textContent('.pc-weapon')));

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

  // Ferramentas: otimizador (aba Avançado)
  await view('Avançado');
  const optStart = await page.textContent('[data-testid="opt-rolls"]');
  await page.$eval('.pc-slider input', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '0'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(300);
  check('o controle do otimizador muda a distribuição mostrada', (await page.textContent('[data-testid="opt-rolls"]')) !== optStart && /-/.test(await page.textContent('[data-testid="opt-vs-current"]')));
  await page.click('button:has-text("Usar 4 rolls em crítico")'); await settle();
  await view('Build');
  check('aplicar fixa os rolls em crítico do build', /4 fixos em crítico/.test(await page.locator('.dz-panel:has(h2:text-is("Substats (rolls)"))').textContent()));
  await view('Avançado');
  await page.keyboard.press('Control+z'); await settle();

  // Ferramentas: +1 roll
  await page.click('.dz-seg[aria-label="Ferramenta"] button:has-text("Valor de +1 roll")');
  const roll = await page.locator('.dz-panel:has(h2:text-is("Ferramentas"))').textContent();
  check('valor de +1 roll mostra Dano crítico como o mais valioso', /Dano Crítico.*\+1,[89]\d%/.test(roll), roll.match(/Dano Crítico[^A-Z]*/)?.[0]);

  // Inventário GOOD (pela ligação do painel de substats)
  await view('Build');
  await page.click('.dz-panel:has(h2:text-is("Substats (rolls)")) button:has-text("Usar o inventário GOOD")'); await page.waitForTimeout(800);
  check('o link do Build leva à aba Avançado', (await page.getAttribute('.pc-views button:has-text("Avançado")', 'aria-selected')) === 'true');
  check('o link abre a ferramenta Inventário GOOD', (await page.getAttribute('.dz-seg[aria-label="Ferramenta"] button:has-text("Inventário GOOD")', 'aria-pressed')) === 'true');
  await page.setInputFiles('input[aria-label="Escolher inventário GOOD"]', FIXTURE); await settle();
  check('importar mostra o resumo do inventário', /1 personagens, 1 armas e 8 artefatos/.test(await page.textContent('.pc-good .summary')));
  await page.click('.pc-good button:has-text("Aplicar o build de Mavuika")'); await page.waitForTimeout(1500);
  const appliedNote = /Build de Mavuika aplicado/.test(await page.textContent('.pc-notes'));
  await view('Build');
  check('aplicar o build do inventário avisa e passa ao modo manual', appliedNote && (await page.getAttribute('.dz-seg[aria-label="Modo dos substats"] button:has-text("À mão")', 'aria-pressed')) === 'true');
  await view('Avançado');
  check('os níveis de talento vêm do inventário (9/8/7)', /9\/8\/7/.test(await eff()), await eff());
  await page.click('.pc-good button:has-text("Buscar o melhor build de Mavuika")');
  await page.waitForSelector('.pc-found', { timeout: 30000 });
  check('a busca acha um build melhor que o equipado', /\+\d/.test(await page.textContent('.pc-loadout .summary')), (await page.textContent('.pc-loadout .summary')).slice(0, 80));

  // Navegação entre personagens e id inexistente
  await page.click('.pc-tabs a:has-text("Citlali")');
  await page.waitForURL(/personagem\/Citlali/);
  await page.waitForSelector('.pc-dmg');
  check('trocar de aba abre a calculadora da Citlali (reações Cryo)', /Citlali/.test(await page.textContent('.pc-id')) && /Derreter \(Cryo\)/.test(await page.textContent('.dz-panel:has(h2:text-is("Reações deste time"))')));
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
