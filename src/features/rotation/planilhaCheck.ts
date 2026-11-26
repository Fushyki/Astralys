/**
 * Roda no carregamento inicial do site: lê só o localStorage. NÃO importe `persistence`, o motor nem o zod aqui.
 * Sem validar o esquema, um projeto corrompido com `compat: 'planilha'` responde true: os dados são baixados à toa e a
 * migração o ignora.
 */
const PREFIX = 'astralys:projeto:'; // o mesmo prefixo de `persistence.ts` (o teste compara as duas leituras)

type RawProject = { compat?: unknown; members?: unknown };

function planilhaProjects(): RawProject[] {
  try {
    return Object.keys(localStorage).flatMap((key) => {
      if (!key.startsWith(PREFIX)) return [];
      try {
        const p: RawProject | null = JSON.parse(localStorage.getItem(key) ?? 'null');
        return p?.compat === 'planilha' ? [p] : [];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

/** Há time salvo neste navegador ainda no modo planilha? */
export const hasPlanilhaProjects = (): boolean => planilhaProjects().length > 0;

/** Os personagens desses times: a migração precisa dos golpes e efeitos deles. */
export const planilhaCharacters = (): string[] => [
  ...new Set(planilhaProjects().flatMap((p) => (Array.isArray(p.members) ? p.members.flatMap((m) => (typeof m?.character === 'string' ? [m.character as string] : [])) : []))),
];
