/**
 * Medidas padronizadas da interface (espelho de `src/design/tokens.css`; `tests/design/tokens.test.ts` confere que os dois
 * não se afastam). Os componentes usam as variáveis CSS (`var(--sp-4)`, `var(--ctl-md)`…); estas constantes servem para o
 * que precisa de número em TypeScript (tamanho de SVG, imagens).
 */
export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 } as const;
/** Entre painéis e dentro de um painel. */
export const PANEL = { gap: 16, pad: 16, head: 44 } as const;
/** Altura dos controles (botão, campo, segmento). */
export const CONTROL = { sm: 32, md: 40, lg: 48 } as const;
/** Raios: chip, controle, bloco interno, painel. */
export const RADIUS = { chip: 6, ctl: 8, inner: 10, panel: 14 } as const;
export const FONT = { 1: 12, 2: 13, 3: 14, 4: 16, 5: 20, 6: 28, kpi: 40 } as const;
export const ICON = { 1: 16, 2: 24, 3: 40, 4: 64 } as const;
/** Linha de tabela. */
export const ROW = 32;
/** Margem lateral da página (celular: 16) e largura máxima. */
export const PAGE = { gutter: 24, gutterMobile: 16, max: 2200 } as const;
/** Coluna do personagem. */
export const SIDE_COLUMN = 280;
