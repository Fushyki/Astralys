/**
 * Teste de interação da equipe e do editor de build num navegador real.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/equipe.cjs   (ou npm run e2e, que roda os dois testes)
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
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.ast-slot');

  const settle = () => page.waitForTimeout(500);
  const dps = () => page.$eval('.ast-kpi .v', (e) => e.textContent);
  const rows = () => page.$$eval('.ast-actions tbody tr', (r) => r.length);
  const slotNames = () => page.$$eval('.ast-slot-main .n', (e) => e.map((x) => x.textContent));
  const undo = async () => { await page.click('button:has-text("Desfazer")'); await settle(); };
  const field = (label) => page.locator(`label.ast-field:has(span:text-is("${label}"))`);
  const dpsNum = async () => Number((await dps()).replace(/\./g, ''));

  check('equipe inicial e DPS da planilha', (await slotNames()).join() === 'Mavuika,Citlali,Iansan,Bennett' && (await dps()) === '216.600', (await slotNames()).join(', '));
  const res = await page.$$eval('.ast-res .on', (e) => e.map((x) => x.textContent));
  check('ressonância Pyro mostrada como aplicada', res.length === 1 && /Pyro/.test(res[0]) && /25%/.test(res[0]), res[0]);
  check('editor de build abre no primeiro membro', (await page.textContent('.ast-panel.ast-wide > h2')) === 'Build de Mavuika');
  await page.screenshot({ path: path.join(OUT, 'equipe-build.png'), fullPage: true });

  // Arma
  const before = await dpsNum();
  await field('Arma').locator('select').selectOption({ label: "5★ Wolf's Gravestone" }); await settle();
  const afterWeapon = await dpsNum();
  check('trocar a arma muda o DPS', afterWeapon !== before && afterWeapon < before, `${before} → ${afterWeapon}`);
  await undo();
  check('desfazer devolve a arma', (await dpsNum()) === before);

  // Talento
  await field('Habilidade').locator('input').fill('13'); await field('Habilidade').locator('input').blur(); await settle();
  const afterTalent = await dpsNum();
  check('subir o talento aumenta o DPS', afterTalent > before, `${before} → ${afterTalent}`);
  await undo();

  // Rolls manuais
  await page.click('label:has-text("Definir à mão") input'); await settle();
  check('modo manual com os mesmos rolls dá o mesmo DPS', (await dpsNum()) === before);
  const cd = page.locator('label.ast-field:has-text("Dano Crítico (máx")').locator('input');
  await cd.fill('2'); await cd.blur(); await settle();
  const lowCd = await dpsNum();
  check('menos rolls de CD derrubam o DPS', lowCd < before, `${before} → ${lowCd}`);
  await cd.fill('40'); await cd.blur(); await settle();
  const warn = await page.$$eval('.ast-error', (e) => e.map((x) => x.textContent));
  check('rolls acima do limite geram aviso', warn.some((t) => /comportam no máximo/.test(t)), warn[0]);
  await page.click('label:has-text("Otimizar automaticamente") input'); await settle();
  check('voltar ao automático restaura o DPS e limpa o aviso', (await dpsNum()) === before && (await page.$$('.ast-error')).length === 0);

  // Trocar personagem
  const rows0 = await rows();
  await page.locator('.ast-slot').nth(1).locator('.ast-link:has-text("Trocar")').click();
  await page.waitForSelector('.ast-dialog');
  await page.fill('.ast-dialog input[type="search"]', 'Ayaka');
  const found = await page.$$eval('.ast-pick span', (e) => e.map((x) => x.textContent));
  check('busca no diálogo filtra os personagens', found.length >= 1 && found.every((n) => /Ayaka/.test(n)), found.join(', '));
  await page.click('.ast-pick:has-text("Kamisato Ayaka")'); await settle();
  check('trocar a Citlali pela Ayaka remove as 4 ações dela', (await slotNames())[1] === 'Kamisato Ayaka' && (await rows()) === rows0 - 4, `${rows0} → ${await rows()} linhas`);
  check('o diálogo fecha ao escolher', (await page.$$('.ast-dialog')).length === 0);
  await undo();
  check('desfazer volta à Citlali e às ações', (await slotNames())[1] === 'Citlali' && (await rows()) === rows0);

  // Esc fecha o diálogo
  await page.locator('.ast-slot').nth(1).locator('.ast-link:has-text("Trocar")').click();
  await page.waitForSelector('.ast-dialog');
  await page.keyboard.press('Escape');
  check('Esc fecha o diálogo', (await page.$$('.ast-dialog')).length === 0);

  // Remover e adicionar
  await page.locator('.ast-slot').nth(3).locator('.ast-link:has-text("Remover")').click(); await settle();
  check('remover o Bennett deixa 3 membros e 23 ações', (await slotNames()).length === 3 && (await rows()) === 23, `${(await slotNames()).length} membros, ${await rows()} linhas`);
  check('aparece o botão de adicionar', (await page.$$('.ast-slot.add')).length === 1);
  await page.click('.ast-slot.add');
  await page.waitForSelector('.ast-dialog');
  const excluded = await page.$$eval('.ast-pick span', (e) => e.map((x) => x.textContent));
  check('o diálogo não oferece quem já está na equipe', !excluded.some((n) => ['Mavuika', 'Citlali', 'Iansan'].includes(n)));
  await page.fill('.ast-dialog input[type="search"]', 'Ayaka');
  await page.click('.ast-pick:has-text("Kamisato Ayaka")'); await settle();
  check('adicionar a Ayaka seleciona o build dela', (await slotNames()).length === 4 && (await page.textContent('.ast-panel.ast-wide > h2')) === 'Build de Kamisato Ayaka');
  check('com a arma por defeito (Absolution, com efeito) não há aviso', (await page.$$('.ast-notice-inline')).length === 0);
  await field('Arma').locator('select').selectOption({ label: '5★ Aquila Favonia (sem efeito)' }); await settle();
  const notice = await page.$$eval('.ast-notice-inline', (e) => e.map((x) => x.textContent));
  check('arma sem efeito cadastrado gera aviso claro', notice.length === 1 && /Sem efeito numérico cadastrado: arma Aquila Favonia/.test(notice[0]), notice[0]?.slice(0, 90));
  await page.screenshot({ path: path.join(OUT, 'equipe-nova.png'), fullPage: true });

  // Tabela de dano do personagem selecionado
  await page.click('.ast-slot-main:has-text("Mavuika")'); await settle();
  const dmgTitle = await page.textContent('.ast-panel:has(.ast-dmgtable) > h2');
  check('tabela de dano do personagem selecionado', dmgTitle === 'Tabela de dano de Mavuika', dmgTitle);
  const firstAvg = async () => page.$eval('.ast-dmgtable tbody:nth-of-type(1) tr:nth-child(2) td:nth-child(4)', (e) => e.textContent);
  const dmgBefore = await firstAvg();
  await page.selectOption('select[aria-label="Reação da tabela de dano"]', 'melt'); await settle();
  const dmgAfter = await firstAvg();
  const num = (t) => Number(t.replace(/\./g, '').replace(',', '.'));
  check('escolher Derreter aumenta o dano Pyro da tabela', num(dmgAfter) > num(dmgBefore), `${dmgBefore} → ${dmgAfter}`);
  check('a tabela marca os golpes com reação', (await page.$$('.ast-dmgtable .ast-flag')).length > 0);
  await page.selectOption('select[aria-label="Reação da tabela de dano"]', 'none'); await settle();

  // Otimizador interativo
  await page.waitForSelector('.ast-opt svg');
  const optTitle = await page.textContent('.ast-panel:has(.ast-opt) > h2');
  check('otimizador do personagem selecionado', optTitle === 'Otimizador de Mavuika', optTitle);
  const rollsNow = async () => page.$eval('.ast-slider b', (e) => Number(e.textContent));
  const startRolls = await rollsNow();
  await page.$eval('.ast-slider input', (el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '0'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle();
  const lowRolls = await rollsNow();
  const lowInfo = await page.$eval('.ast-opt-info', (e) => e.textContent);
  check('o controle muda a distribuição mostrada', lowRolls < startRolls && /Contra o build atual-/.test(lowInfo), `${startRolls} → ${lowRolls}`);
  await page.click('button:has-text("Usar 4 rolls em crítico")'); await page.waitForTimeout(900);
  const forcedField = await field('Rolls em critico fixos (0 = otimizar)').locator('input').inputValue().catch(() => null);
  const forcedField2 = forcedField ?? (await page.$eval('label.ast-field:has(span:text-matches("Rolls em cr.tico fixos"))  input', (e) => e.value));
  check('aplicar a distribuição fixa os rolls em crítico do build', forcedField2 === '4', `campo = ${forcedField2}`);
  await page.click('button:has-text("Deixar o otimizador escolher")'); await page.waitForTimeout(900);

  // Mapa de calor e comparação de armas
  const heatRows = await page.$$eval('.ast-heat tbody tr', (r) => r.length);
  check('mapa de calor de +1 roll com linhas por substat', heatRows >= 4, `${heatRows} linhas`);
  await page.waitForSelector('.ast-weapons tbody tr');
  const weaponRows = await page.$$eval('.ast-weapons tbody tr', (r) => r.map((x) => x.textContent));
  check('comparação de armas marca a arma atual na primeira linha (a melhor do exemplo)', /atual/.test(weaponRows[0]) && weaponRows.length >= 10, weaponRows[0]?.slice(0, 40));
  await page.click('.ast-weapons tbody tr:nth-child(2) button:has-text("Usar")'); await page.waitForTimeout(1200);
  const newWeapon = await field('Arma').locator('select').inputValue();
  check('"Usar" troca a arma do build', newWeapon !== 'A Thousand Blazing Suns', newWeapon);
  await field('Arma').locator('select').selectOption('A Thousand Blazing Suns'); await settle();

  // Persistência da equipe
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.ast-slot');
  check('recarregar mantém a equipe editada', (await slotNames()).join() === 'Mavuika,Citlali,Iansan,Kamisato Ayaka', (await slotNames()).join(', '));

  await page.setViewportSize({ width: 400, height: 800 });
  await page.waitForTimeout(300);
  check('móvel sem scroll horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
