/**
 * Marcas do texto do Lunaris que não são texto: `{LINK#id}nome{/LINK}` (referência a outro termo do jogo) e as variantes de
 * gênero do Viajante (`{M#o}{F#a}`). Vira texto corrido: o termo sem a marca e "o/a" para as variantes. Usado ao gerar os
 * dados (scripts de sync) e na tela, como rede de segurança.
 */
export function cleanLunarisMarkup(text: string): string {
  return text
    .replace(/\{LINK#[^}]*\}/g, '')
    .replace(/\{\/LINK\}/g, '')
    .replace(/\{M#([^}]*)\}\{F#([^}]*)\}/g, '$1/$2')
    .replace(/\{F#([^}]*)\}\{M#([^}]*)\}/g, '$2/$1')
    .replace(/\{[MF]#([^}]*)\}/g, '$1');
}

/** O mesmo, sobre o TEXTO de um arquivo JSON gerado (sem reformatar nada): também desfaz o "\n" duplo escapado (barra, barra, n). */
export function cleanGeneratedJsonText(raw: string): string {
  const doubleEscapedNewline = new RegExp(String.fromCharCode(92, 92, 92, 92) + 'n', 'g');
  return cleanLunarisMarkup(raw).replace(doubleEscapedNewline, String.fromCharCode(92) + 'n');
}
