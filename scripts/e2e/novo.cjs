/**
 * Montar um time (/novo): 3 passos, rotação básica e em branco, e o início com os caminhos.
 *   1) npm run build && npx vite preview --port 4173
 *   2) node scripts/e2e/novo.cjs
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
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/404/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(500);

  const pickCharacter = async (slotLabel, name) => {
    await page.click(`button[aria-label="${slotLabel}"]`);
    await page.waitForSelector('.dz-dialog');
    await page.fill('.dz-dialog input[type="search"]', name);
    await page.click(`.dz-dialog .pick:has(.n:text-is("${name}"))`);
    await page.waitForSelector('.dz-dialog', { state: 'detached' });
  };

  // Início: os caminhos
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const paths = await page.$$eval('.in-path b', (e) => e.map((x) => x.textContent));
  check('o início tem os caminhos "Montar um time" e "Abrir um time salvo"', paths.includes('Montar um time') && paths.includes('Abrir um time salvo'), paths.join(' | '));
  check('sem servidor, "Importar o meu build" não aparece', !paths.includes('Importar o meu build'));
  await page.click('.in-path:has-text("Montar um time")');
  await page.waitForURL('**/novo');

  // Passo 1
  check('o passo 1 está marcado', (await page.getAttribute('.nt-steps li:nth-child(1)', 'aria-current')) === 'step');
  check('Continuar começa desligado', await page.isDisabled('button:has-text("Continuar")'));
  await page.waitForSelector('.nt-add:not([disabled])');
  check('só a primeira vaga está liberada', (await page.locator('.nt-add:not([disabled])').count()) === 1);
  await pickCharacter('Escolher o personagem 1', 'Hu Tao');
  await pickCharacter('Escolher o personagem 2', 'Xingqiu');
  await pickCharacter('Escolher o personagem 3', 'Yelan');
  await pickCharacter('Escolher o personagem 4', 'Zhongli');
  check('4 personagens nas vagas', (await page.locator('.nt-slot[data-filled="true"]').count()) === 4);
  await page.click('.nt-slot:has(b:text-is("Yelan")) button:has-text("Remover")');
  check('remover libera a vaga', (await page.locator('.nt-slot[data-filled="true"]').count()) === 3);
  await pickCharacter('Escolher o personagem 4', 'Citlali');
  check('o nome padrão sugere os personagens', /Hu Tao · Xingqiu · Zhongli · Citlali/.test(await page.getAttribute('.nt-name input', 'placeholder')), await page.getAttribute('.nt-name input', 'placeholder'));
  await page.click('button:has-text("Continuar")');

  // Passo 2
  const step2 = await page.textContent('.nt-panel');
  check('o passo 2 explica o que é build', /arma, os artefatos e os substats/.test(step2));
  check('o build padrão vem marcado', await page.isChecked('input[name="source"] >> nth=0'));
  check('sem servidor, importar pelo UID fica desligado', await page.isDisabled('input[name="source"] >> nth=1'));
  await page.click('button:has-text("Continuar")');

  // Passo 3
  check('a rotação básica vem marcada', await page.isChecked('input[name="rotation"] >> nth=0'));
  await page.click('button:has-text("Criar o time")');
  await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/);
  await page.waitForSelector('.eq-card');
  const cardNames = await page.$$eval('.eq-card .name', (e) => e.map((x) => x.textContent));
  check('o time abre na Equipe com os 4 personagens', cardNames.join() === 'Hu Tao,Xingqiu,Zhongli,Citlali', cardNames.join());
  const dpsBox = page.locator('.eq-hero .big');
  await page.waitForFunction(() => /[1-9]/.test(document.querySelector('.eq-hero .big')?.textContent ?? ''), null, { timeout: 30000 });
  const dps = Number((await dpsBox.textContent()).replace(/\D/g, ''));
  check('a rotação básica já dá um DPS maior que zero', dps > 0, String(dps));
  await page.screenshot({ path: path.join(OUT, 'r-novo-equipe.png'), fullPage: true });

  // Em branco: o site aguenta o projeto sem golpes em todas as telas
  await page.goto(`${BASE}/novo`, { waitUntil: 'networkidle' });
  await pickCharacter('Escolher o personagem 1', 'Citlali');
  await page.click('button:has-text("Continuar")');
  await page.click('button:has-text("Continuar")');
  await page.click('input[name="rotation"] >> nth=1');
  await page.click('button:has-text("Criar o time")');
  await page.waitForURL(/\/projeto\/(?!exemplo)[^/]+$/);
  await page.waitForSelector('.eq-card');
  const id = page.url().split('/projeto/')[1];
  const telas = [['Equipe', ''], ['Personagem', '/personagem/Citlali'], ['Rotação', '/rotacao'], ['Armas', '/armas'], ['Recarga', '/recarga']];
  for (const [label, p] of telas) {
    await page.goto(`${BASE}/projeto/${id}${p}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const text = await page.textContent('body');
    check(`projeto em branco abre a tela ${label} sem quebrar`, text.length > 200 && !/Cannot read|Something went wrong/.test(text), `${text.length} caracteres`);
  }

  // Vault: "Novo time" leva ao passo a passo
  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Novo time")');
  await page.waitForURL('**/novo');
  check('"Novo time" do Vault abre o passo a passo', (await page.locator('.nt-steps').count()) === 1);

  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.screenshot({ path: path.join(OUT, 'r-novo-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
