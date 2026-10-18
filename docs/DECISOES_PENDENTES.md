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

(Novas entradas são acrescentadas abaixo conforme surgirem.)
