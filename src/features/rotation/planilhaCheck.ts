/**
 * Roda no carregamento inicial do site: lê só o localStorage. NÃO importe `persistence`, o motor nem o zod aqui.
 * Sem validar o esquema, um projeto corrompido com `compat: 'planilha'` responde true: os dados são baixados à toa e a
 * migração o ignora.
 */
const PREFIX = 'astralys:projeto:'; // o mesmo prefixo de `persistence.ts` (o teste compara as duas leituras)

/** Há time salvo neste navegador ainda no modo planilha? */
export function hasPlanilhaProjects(): boolean {
  try {
    return Object.keys(localStorage).some((key) => {
      if (!key.startsWith(PREFIX)) return false;
      try {
        return JSON.parse(localStorage.getItem(key) ?? 'null')?.compat === 'planilha';
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
