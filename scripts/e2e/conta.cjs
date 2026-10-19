/**
 * Conta online: criar conta, entrar, sincronizar times com o servidor e sair. Precisa do backend local:
 *   1) backend: DATABASE_URL=sqlite:///dev.db SECRET_KEY=<32+ caracteres> ALLOWED_ORIGINS=http://localhost:4174 uvicorn main:app --port 8000
 *   2) npm run build:conta && npx vite preview --outDir dist-conta --port 4174
 *   3) node scripts/e2e/conta.cjs
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const BASE = process.env.E2E_URL || 'http://localhost:4174';
const API = process.env.E2E_API || 'http://localhost:8000';
const CHANNEL = process.env.E2E_BROWSER || 'msedge';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const problems = [];
  // Respostas 4xx esperadas (senha errada) aparecem no console do navegador como erro de rede.
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/status of 4[0-9][0-9]/.test(m.text())) problems.push(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`));
  const settle = () => page.waitForTimeout(600);
  const cards = () => page.locator('.vt-card');
  const stamp = Date.now();
  const email = `teste${stamp}@example.com`;
  const senha = `Sen-ha-${stamp}-ok`;

  // O backend limita 6 chamadas /auth por minuto por IP; entre duas execuções seguidas, use E2E_COOLDOWN_MS=62000.
  await new Promise((r) => setTimeout(r, Number(process.env.E2E_COOLDOWN_MS || 0)));
  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.vt-card');

  // Sem sessão: convite para entrar
  check('o header oferece "Entrar"', (await page.locator('.dz-header a:has-text("Entrar")').count()) === 1);
  check('o Vault convida a entrar para sincronizar', (await page.locator('a:has-text("Entrar para sincronizar")').count()) === 1);

  // Criar conta
  await page.click('.dz-header a:has-text("Entrar")');
  await page.waitForSelector('.en-form');
  await page.click('button[role="tab"]:has-text("Criar conta")');
  await page.fill('.en-form input[autocomplete="name"]', 'Tester');
  await page.fill('.en-form input[type="email"]', email);
  await page.fill('.en-form input[type="password"]', '12345678');
  await page.click('.en-form button[type="submit"]');
  await page.waitForSelector('.dz-error');
  check('senha comum é recusada com mensagem em português', /senha|comum|fraca/i.test(await page.textContent('.dz-error')), (await page.textContent('.dz-error')).trim());
  await page.fill('.en-form input[type="password"]', senha);
  await page.click('.en-form button[type="submit"]');
  await page.waitForURL('**/vault');
  await page.waitForSelector('.dz-account');
  check('criar conta já entra e mostra o nome', (await page.textContent('.dz-account-name')).trim() === 'Tester');
  check('aparece "Sincronizar com a conta"', (await page.locator('button:has-text("Sincronizar com a conta")').count()) === 1);

  // Novo time + sincronizar (sobe o time novo; o exemplo não é salvo)
  await page.click('button:has-text("Novo time")');
  await page.waitForURL('**/projeto/**');
  await page.waitForSelector('.dz-pagehead');
  await page.goto(`${BASE}/vault`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.vt-card');
  const total = await cards().count();
  await page.click('button:has-text("Sincronizar com a conta")');
  await page.waitForSelector('.vt-notes');
  check('o primeiro envio sobe o time novo', /1 time enviado para a conta/.test(await page.textContent('.vt-notes')), (await page.textContent('.vt-notes')).trim());

  // Outro "dispositivo": apaga o armazenamento local, entra de novo e baixa
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('astralys.sessao')).token);
  const remote = await (await fetch(`${API}/astralys/projetos`, { headers: { Authorization: `Bearer ${token}` } })).json();
  check('o servidor guarda 1 projeto', Array.isArray(remote) && remote.length === 1, `${remote.length}`);
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('astralys:projeto:')) localStorage.removeItem(k); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.vt-card');
  check('sem o armazenamento local sobra só o exemplo', (await cards().count()) === 1);
  await page.click('button:has-text("Sincronizar com a conta")');
  await page.waitForSelector('.vt-notes');
  check('o segundo dispositivo baixa o time', /1 time baixado da conta/.test(await page.textContent('.vt-notes')), (await page.textContent('.vt-notes')).trim());
  check('o time volta ao Vault', (await cards().count()) === total);
  await page.click('button:has-text("Sincronizar com a conta")');
  await settle();
  check('sincronizar de novo não muda nada', /Tudo já estava sincronizado/.test(await page.textContent('.vt-notes')));

  // Compartilhar por link público
  const novo = cards().filter({ hasText: 'Novo time' }).first();
  check('o exemplo não tem "Compartilhar"', (await cards().filter({ hasText: 'exemplo' }).locator('button:has-text("Compartilhar")').count()) === 0);
  await novo.locator('button:has-text("Compartilhar")').click();
  await page.waitForSelector('.vt-share');
  const shareText = (await page.textContent('.vt-share')).trim();
  const link = (shareText.match(/https?:\/\/\S+\/p\/\S+/) || [''])[0];
  check('compartilhar mostra o link', new RegExp('/p/[0-9a-f-]{36}$').test(link), shareText);
  check('o cartão mostra "compartilhado"', (await novo.locator('text=compartilhado').count()) === 1);
  const publicId = link.split('/p/')[1];
  const open = await fetch(`${API}/astralys/publicos/${publicId}`);
  check('o servidor abre o link sem login', open.status === 200);
  const viewer = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await viewer.goto(link.replace(new RegExp('^https?://[^/]+'), BASE), { waitUntil: 'networkidle' });
  await viewer.waitForSelector('[data-testid="pub-dps"]', { timeout: 30000 });
  check('quem abre o link vê o time e os números', /Novo time/.test(await viewer.textContent('h1')) && /[0-9]/.test(await viewer.textContent('[data-testid="pub-dps"]')), (await viewer.textContent('.pb-kp')).trim());
  await viewer.screenshot({ path: path.join(OUT, 'conta-publico.png'), fullPage: true });
  await viewer.click('button:has-text("Abrir no meu Vault")');
  await viewer.waitForURL('**/projeto/**');
  check('"Abrir no meu Vault" cria uma cópia editável', !viewer.url().endsWith(publicId));
  await novo.locator('button:has-text("Parar de compartilhar")').click();
  await page.waitForFunction(() => /desligado/.test(document.querySelector('.vt-share')?.textContent ?? ''));
  const closed = await fetch(`${API}/astralys/publicos/${publicId}`);
  check('parar de compartilhar fecha o link', closed.status === 404);
  await viewer.goto(link.replace(new RegExp('^https?://[^/]+'), BASE), { waitUntil: 'networkidle' });
  await viewer.waitForSelector('.pb-empty');
  check('o link fechado mostra "Time não encontrado"', /Time não encontrado/.test(await viewer.textContent('.pb-empty')));
  await viewer.context().close();

  // Apagar remove também da conta
  await novo.locator('button:has-text("Apagar")').click();
  await novo.locator('button:has-text("Sim")').click();
  await settle();
  const after = await (await fetch(`${API}/astralys/projetos`, { headers: { Authorization: `Bearer ${token}` } })).json();
  check('apagar no Vault apaga também na conta', after.length === 0, `${after.length}`);

  // Sair e entrar
  await page.click('.dz-account button:has-text("Sair")');
  await page.waitForSelector('.dz-header a:has-text("Entrar")');
  check('sair volta ao botão "Entrar"', (await page.locator('.dz-account').count()) === 0);
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle' });
  await page.fill('.en-form input[type="email"]', email);
  await page.fill('.en-form input[type="password"]', 'senha-errada-123');
  await page.click('.en-form button[type="submit"]');
  await page.waitForSelector('.dz-error');
  check('senha errada mostra erro', (await page.locator('.dz-error').count()) === 1, (await page.textContent('.dz-error')).trim());
  await page.fill('.en-form input[type="password"]', senha);
  await page.click('.en-form button[type="submit"]');
  await page.waitForURL('**/vault');
  await page.waitForSelector('.dz-account');
  check('entrar com a senha certa funciona', (await page.textContent('.dz-account-name')).trim() === 'Tester');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.dz-account');
  check('a sessão sobrevive ao recarregar', (await page.locator('.dz-account').count()) === 1);

  await page.screenshot({ path: path.join(OUT, 'conta-vault.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(400);
  check('celular sem rolagem horizontal da página', !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle' }).catch(() => undefined);
  await page.screenshot({ path: path.join(OUT, 'conta-mobile.png'), fullPage: true });

  await browser.close();
  console.log('\nProblemas de consola:', problems.length ? '\n' + problems.join('\n') : 'nenhum');
  console.log(`\n${results.filter(Boolean).length}/${results.length} verificações OK`);
  process.exit(results.every(Boolean) && problems.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FALHOU', e); process.exit(2); });
