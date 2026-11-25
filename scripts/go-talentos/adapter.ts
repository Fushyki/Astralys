// Ponte entre o Astralys e as fichas do Genshin Optimizer (MIT). Empacotado por build.mjs em src/vendor/go/talentos.js:
// os imports `@genshin-optimizer/*` só existem dentro do clone do GO, por isso este arquivo fica fora do tsc do projeto.
// Lista de fichas gerada pelo build.mjs a partir dos personagens pedidos.
import SHEETS_IN from 'go-sheets';
import { resonanceData } from '@genshin-optimizer/gi/sheets/../Resonance';
import { common, constant, dataObjForCharacterNew, infoManager, input, percent } from '@genshin-optimizer/gi/wr';
import { uiDataForTeam } from '@genshin-optimizer/gi/uidata';
import locale from 'go-locale';

const SHEETS: Record<string, any> = SHEETS_IN;
export const supported = Object.keys(SHEETS);

const CARDS = ['auto', 'skill', 'burst', 'passive1', 'passive2', 'passive3', 'constellation1', 'constellation2', 'constellation3', 'constellation4', 'constellation5', 'constellation6'];
const ELEMENTS: Record<string, string> = { anemo: 'Anemo', geo: 'Geo', electro: 'Electro', hydro: 'Hydro', pyro: 'Pyro', cryo: 'Cryo', dendro: 'Dendro', physical: 'Físico' };
const REACTIONS: Record<string, string> = { lunarcrystallize: 'Lunar-Cristalizar', lunarcharged: 'Lunar-Carregado', lunarbloom: 'Lunar-Florescer', crystallize: 'Cristalizar' };

const lookup = (ns: string, key: string): string | undefined => {
  let node: any = locale[ns];
  for (const part of key.split('.')) node = node?.[part];
  return typeof node === 'string' ? node : typeof node?.['0'] === 'string' ? node['0'] : undefined;
};

/** Texto de um nó React capturado pelo atalho de JSX (`{ props }`). */
function text(node: any, data?: any): string {
  if (node === undefined || node === null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n, data)).join('');
  if (typeof node === 'function') return data ? text(node(data), data) : '';
  const p = node.props;
  if (!p) return '';
  if (p.key18) {
    let s = lookup(p.ns, p.key18) ?? p.key18;
    for (const [k, v] of Object.entries(p.values ?? {})) s = s.replaceAll(`{{${k}}}`, String(v));
    return s.replace(/<[^>]*>/g, '');
  }
  return text(p.children, data);
}

/** Nome de um stat pela chave do GO (ex.: geo_critRate_, lunarcrystallize_directDmgInc). */
function statName(key: string): string {
  const own = lookup('statKey_gen', key);
  if (own) return own.replace(/<[^>]*>/g, '');
  const m = /^([a-z]+)_(.+)$/.exec(key);
  const who = m && (ELEMENTS[m[1]] ?? REACTIONS[m[1]]);
  const rest: Record<string, string> = { dmg_: 'Bônus de Dano', dmgInc: 'Dano adicional', directDmgInc: 'Dano adicional', critRate_: 'Taxa CRIT', critDMG_: 'Dano CRIT', mult_: 'Multiplicador', baseDmg_: 'Dano base' };
  if (m && who && rest[m[2]]) return `${rest[m[2]]} ${who}`;
  return locale.extra?.stats?.[key] ?? key;
}

function row(ui: any, node: any, extra: { team?: boolean } = {}) {
  const r = ui.get(node);
  if (r.isEmpty) return null;
  const info = r.info ?? {};
  const path: string = info.path ?? '';
  // O GO guarda o nome de cada número num registro à parte, pela chave `path`.
  const meta: any = infoManager[path] ?? {};
  const label = text(meta.name ?? info.name, ui) || statName(path);
  const unit: string = info.unit ?? (path.endsWith('_') ? '%' : '');
  return {
    label: meta.textSuffix ? `${label} ${text(meta.textSuffix, ui)}` : label,
    value: unit === '%' ? r.value * 100 : r.value,
    unit,
    element: typeof info.variant === 'string' ? info.variant : '',
    team: !!(extra.team ?? info.isTeamBuff),
  };
}

// `canShow` é um nó da ficha ou, em algumas, uma função.
const shown = (ui: any, doc: any) => !doc.canShow || (typeof doc.canShow === 'function' ? !!doc.canShow(ui) : ui.get(doc.canShow).value === 1);

function fields(ui: any, list: any[], team?: boolean) {
  const out: any[] = [];
  for (const f of list ?? []) {
    if (!shown(ui, f)) continue;
    if (f.node) { const r = row(ui, f.node, { team }); if (r) out.push(r); continue; }
    const value = typeof f.value === 'function' ? f.value(ui) : f.value;
    out.push({ label: text(f.text, ui), value: value === undefined ? '' : typeof value === 'number' ? value : text(value, ui), unit: typeof f.unit === 'string' ? f.unit : '', element: '', team: !!team });
  }
  return out;
}

function blocks(ui: any, owner: string, card: string, docs: any[], onlyTeam: boolean) {
  const out: any[] = [];
  for (const doc of docs ?? []) {
    if (!shown(ui, doc)) continue;
    if (doc.conditional) { out.push(...blocks(ui, owner, card, [doc.conditional], onlyTeam)); continue; }
    if (doc.states && doc.path) {
      if (onlyTeam && !doc.teamBuff) continue;
      const states = typeof doc.states === 'function' ? doc.states(ui) : doc.states;
      const current = ui.get(doc.value).value ?? '';
      out.push({
        kind: 'cond', owner, card, id: doc.path[1], title: text(doc.name, ui), team: !!doc.teamBuff, value: states[current] ? current : '',
        options: Object.entries<any>(states).map(([value, s]) => ({ value, label: text(s.name, ui) || 'Ligado' })),
        rows: fields(ui, states[current]?.fields, doc.teamBuff || undefined),
      });
      continue;
    }
    if (doc.fields) {
      if (onlyTeam && !(doc.teamBuff || doc.header?.teamBuff)) continue;
      const rows = fields(ui, doc.fields, doc.teamBuff || undefined);
      if (rows.length) out.push({ kind: 'rows', rows });
      continue;
    }
    // Títulos curtos ("Ataque Normal"); as descrições longas o Astralys já mostra.
    const t = onlyTeam || /description$/i.test(doc.text?.props?.key18 ?? '') ? '' : text(doc.text, ui);
    if (t && t.length < 60) out.push({ kind: 'text', text: t });
  }
  return out;
}

export function computeTalents(req: any) {
  const team: any[] = req.team;
  const data: Record<string, any[]> = {};
  for (const m of team) {
    const sheet = SHEETS[m.key];
    if (!sheet) {
      // Sem ficha empacotada: o personagem só conta para elemento e Presságio Lunar do time.
      data[m.key] = [{ charKey: constant(m.key), charEle: constant(m.element), teamBuff: { tally: { [m.element]: constant(1), ...(m.moonsign ? { moonsign: constant(1) } : {}) } } }];
      continue;
    }
    const gear = Object.fromEntries(Object.entries<number>(m.stats).filter(([k, v]) => k !== 'weaponAtk' && v).map(([k, v]) => [k, k.endsWith('_') ? percent(v) : constant(v)]));
    data[m.key] = [
      { art: gear, base: { atk: constant(m.stats.weaponAtk ?? 0) } },
      dataObjForCharacterNew({
        key: m.key, level: m.level, constellation: m.constellation, ascension: m.ascension, talent: { auto: m.talents.normal, skill: m.talents.skill, burst: m.talents.burst },
        infusionAura: '', customMultiTargets: [], conditional: { [m.key]: m.conditionals ?? {} }, bonusStats: {},
        enemyOverride: { enemyLevel: req.enemy.level, ...Object.fromEntries(Object.entries<number>(req.enemy.res).map(([e, v]) => [`${e}_enemyRes_`, v * 100])) },
        hitMode: req.hitMode, reaction: '',
      } as any),
      sheet.data, common, resonanceData,
    ];
  }
  const ui = uiDataForTeam(data as any, 'F', req.active as any) as any;
  const mine = ui[req.active].target;
  const cards = CARDS.map((key) => ({ key, blocks: blocks(mine, req.active, key, SHEETS[req.active].sheet[key]?.sections, false) }));
  // Buffs de time dos colegas, calculados com os atributos deles; ligar aqui vale na página deles também.
  const fromTeam = team.filter((m) => m.key !== req.active && SHEETS[m.key]).map((m) => ({
    key: m.key,
    blocks: CARDS.flatMap((card) => blocks(ui[m.key].target, m.key, card, SHEETS[m.key].sheet[card]?.sections, true)),
  })).filter((m) => m.blocks.length);
  const total = (k: keyof typeof input.total) => mine.get((input.total as any)[k]).value as number;
  return { cards, fromTeam, stats: { atk: total('atk'), hp: total('hp'), def: total('def'), em: total('eleMas') } };
}
