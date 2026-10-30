# Regras comuns dos agentes de curadoria

Os agentes `curador-personagem`, `curador-arma` e `curador-artefato` leem o texto do jogo e escrevem efeitos para o Davi revisar. O site nunca chama IA: isto é ferramenta de desenvolvimento.

## Regras que não mudam
1. **Nunca invente número.** Todo valor vem de um parâmetro do Lunaris (`p` + `x`), de um literal que está na descrição (`lit`/`re`) ou do Genshin Optimizer (MIT, como segunda fonte). Texto ambíguo vira **pendente**, com o motivo em uma linha.
2. Não altere `src/engine/`, `src/effects/schema.ts`, `src/data/generated/` nem a curadoria de outro alvo.
3. Escreva só em `scripts/curation/` (e rode `npx tsx scripts/curate-effects.ts`). Depois do gerador: `git checkout src/effects/characters.json` se ele apagar edições à mão que não são suas (já aconteceu com `cadinho`). Entradas antigas de `src/effects/*.json` sem "scripts/curation/" na `fonte_info` só são substituídas se você as remover do JSON antes.
4. Todo efeito leva `expect` (trecho do texto do Lunaris que trava o efeito se o texto mudar) e `note` (o que foi assumido e o que não entra).
5. Nada vira "no cálculo" sem um teste de motor pequeno e determinístico (build fixa, golpe fixo) em `tests/`.
6. Antes de mexer: `git status`, e não toque em arquivo com mudança de outra sessão.

## Para onde vai cada tipo de número
| Tipo | Destino |
|---|---|
| Dano direto, bônus de dano, buffs fixos e em %, crítico, redução de DEF/RES permanente, dano fixo, reação | Efeito no cálculo (formato atual) |
| Buff ou **debuff com duração** (ex.: -20% RES por 12 s) | Efeito `timed: true` com `duration`: vira liga/desliga na rotação e o usuário decide o tempo. Debuff no inimigo hoje só existe permanente: registrar como **pendente de formato** (precisa de branch) |
| Cura, escudo, energia, redução de recarga | **Só informativo**: o número aparece na aba de talentos e não entra no cálculo de dano. Hoje só cabe como `notes` (texto); o campo próprio é **pendente de formato** |
| Passiva sem efeito em dano (cozinha, estamina, exploração) | `notes` com `kind: 'utility'` |
| Efeito com parte no cálculo e parte fora | `notes` com `kind: 'partial'` explicando o que ficou fora |

## Resumo que cada agente devolve
1. Efeitos criados (id, categoria, quem recebe, condição, duração, stacks).
2. Informativos (cura, escudo, energia, CD) com o valor e o nível/refino.
3. Pendentes (com o motivo).
4. O que **não cabe** no formato atual.
5. Passivas "sem efeito no dano" que o agente marcou, e as que **mexem em dano** e ficaram órfãs (para o Davi decidir).
