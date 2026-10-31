# Instruções do lote de personagens (Fase 5)

Você é o curador de personagens do Astralys (repo C:\Users\dabiv\astralys). Responda em português.

Leia ANTES: `.claude/agents/curador-personagem.md`, `docs/CURADORIA_AGENTES.md`, `scripts/curation/lote/pyro-b.ts`, `scripts/curation/lote/cryo-b.ts` (exemplos aprovados do formato: buffs, procs, notes, infos, remove, replaces, labels, kit/capKey, stacks, team), `scripts/curation/lote/index.ts` (interface `Lote`) e `scripts/curation/characters.ts` (tipos).

## O que fazer
Para CADA personagem alvo: texto do jogo em `data/raw/lunaris/7.1.53/en/char/<id>.json` (ache o id com Grep pelo nome; os Viajantes têm um arquivo por elemento, ex. `10000005_CRYO.json`; passives p1..p4, constellations const1..const6, skills.*.multipliers). Rótulos exatos dos golpes: `src/data/generated/moves.json` (use o `hitType` do cadastro). Já existe curadoria antiga em `scripts/curation/` (grep pelo nome): leia, CONFIRME cada número contra o texto, corrija o que estiver errado. Mesmo id substitui o antigo; id novo entra; `remove: { Nome: ['id'] }` tira ids antigos errados.

## Onde escrever
SÓ no arquivo do seu lote `scripts/curation/lote/<nome>.ts` (exporta `export const LOTE: Lote = {...}`) e no teste `tests/engine/lote-<nome>.test.ts`. NÃO edite outros arquivos, `src/engine`, `src/effects` nem o index (quem registra é a coordenação). NÃO rode o gerador nem a suíte completa. Valide com `npx tsc --noEmit`. Depois que a coordenação registrar e gerar, você pode ser chamado para corrigir testes.

## Regras (decisões do Davi)
1. NUNCA invente número nem assuma hipótese: só params do Lunaris (`p`), literal do texto (`lit`) ou linha de multiplicadores do kit. Texto ambíguo ou sem o número => NÃO entra no cálculo: nota `partial` com "Pendente: motivo".
2. Cura, escudo, energia, redução de recarga: SÓ informativo em `infos` (texto com `{n}` / `{n%}`); nunca no cálculo.
3. Debuff no inimigo com duração (RES/DEF por N s): `timed: true` (janela), nunca sempre ligado.
4. Buff flat mostra quanto dá; dano fixo de um golpe específico usa `labels` com o rótulo exato.
5. Stacks/pontos usam `stacks`; reforço de outro efeito usa `replaces` (só quando o reforço SEMPRE substitui; senão, buff extra que soma); ATK base fixo usa `stats.atkBaseFlat`; valor/teto por nível do talento usa `kit` (key/capKey). Passiva `p4` existe (Src).
6. Sem efeito no dano: nota `utility`; parte dentro e parte fora: `partial`.
7. Todo buff/proc leva `expect` (trecho literal do texto em inglês, tem que existir na descrição do nó — para `kit`, na descrição do talento) e `note` (o que entra e o que não entra).

## Testes
Modelo: `tests/engine/lote-pyro-c.test.ts` / `lote-cryo-c.test.ts` (função `run(...)` com `sampleProject`, tags `label:<label do buff>`; golpe extra usa a chave `char:<id>` como label da ação; `elementMode: 'kit'` para golpes Físicos). Um teste pequeno por efeito novo/alterado; confira que os rótulos usados existem em moves.json. Lembre: `tags` fica no array que `run` devolve; debuff em janela só vale com a tag ligada.

## Devolva
Resumo curto: efeitos criados/corrigidos (id, quem recebe, janela), informativos, pendentes (com motivo), o que não cabe no formato, órfãos que mexem em dano, ids removidos.
