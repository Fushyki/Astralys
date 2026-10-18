# Decisões pendentes (anotadas durante o trabalho autônomo)

Trabalho feito na branch `v2/cards-vault-er` (saiu de `v2/core`). Quando algo dependia de uma decisão sua, escolhi o
caminho mais seguro e anotei aqui para você revisar. Nada foi mesclado no `main`.

| # | Decisão | O que fiz por enquanto | Onde mudar |
|---|---------|------------------------|-----------|
| 1 | Login (Supabase/JWT) na interface nova | Fica fora por enquanto; o backend continua intacto | — |
| 2 | Hospedar as imagens dos personagens | Uso direto do CDN do Lunaris (API não oficial, CORS liberado) | `Portrait` em `TeamBar.tsx`, `RotationCard.tsx` |
| 3 | Partículas por uso da habilidade (calculadora de recarga) | O Lunaris só traz fontes de partículas soltas (nomes internos, chances, recargas), difíceis de somar com segurança. Usei a tabela do app antigo (escrita com o Gemini, **não verificada**) em `src/effects/particles.json`, com `fonte_info` avisando. 134 personagens; os que faltam usam 3 e a tela avisa "(sem dado)" | `src/effects/particles.json` |
| 4 | Energia da Raiden para o time (+24 fixo no app antigo) | Removi esse atalho: o valor depende do jogo e eu não o confirmei. Dá para digitar "Energia fixa" em cada personagem | `energyModel.ts` |
| 5 | Custo do Supremo do Flins | O app antigo tinha 60, o Lunaris tem 80; o app novo usa o do Lunaris | — |
| 6 | Folga de 15% (`SAFETY_MARGIN`) sobre a recarga exata | Herdada do app antigo (chefe de alvo único); a tela usa a folga Baixa/Média/Alta (-10/0/+10%) como antes | `energy.ts` |
| 7 | Crítico nas reações Lunares/Estelares | Saem **sem crítico** na tabela de reações: não confirmei de onde vêm a taxa e o dano crítico delas. Bônus de dano de reação de sets/armas também ainda não entram | `engine/reactionTable.ts` |
| 8 | Formato GOOD | Implementei pelo que conheço do formato do Genshin Optimizer (chaves como `critRate_`, `atk_`, `eleMas`, `enerRech_`; nomes em PascalCase). **Não testei com um arquivo exportado de verdade**: se o seu export falhar, mande o arquivo (sem dados pessoais) para eu ajustar | `src/features/good/goodImport.ts` |
| 9 | Rolls fracionários no import | O build real vira rolls = soma dos substats ÷ valor médio do roll (ex.: 7,18 rolls de Taxa Crítica). Reproduz exatamente os stats, mas o motor assume peças e arma no nível máximo e não aplica constelações/refinamento | `goodImport.ts` |
| 10 | Armas e sets curados por mim a partir do texto do Lunaris | Cada número vem de um parâmetro do Lunaris e cada efeito tem `note` com a suposição (stacks máximos, condição sempre ativa) e o que ficou de fora. **Revise** as suposições de melhor caso (ex.: Royal com 5 stacks de crítico, Fang of the Mountain King com 6 stacks) e diga se prefere um padrão mais conservador | `scripts/curation/*.ts` |
| 11 | Conversões de stat (ATK por HP/EM, dano por DEF, dano por ER) | O motor não tem esse tipo de efeito; armas como Staff of Homa, Redhorn e sets como Emblem of Severed Fate entram só com o que é stat simples | `engine/stats.ts` |

(Novas entradas são acrescentadas abaixo conforme surgirem.)
