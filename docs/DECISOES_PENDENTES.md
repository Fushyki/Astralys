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
| 12 | Passivas e constelações curadas por mim (25 personagens) | Mesma regra das armas: número de parâmetro do Lunaris, `note` com a suposição. Buffs de equipe/condicionais entram como **faixas na linha do tempo** que você liga nas janelas (nada vale sozinho). Passivas só do próprio personagem e sempre ativas ficam estáticas. Faltam os outros ~110 personagens e os efeitos que dependem de stats de outros (Kazuha, Sucrose, Furina, Nahida...) | `scripts/curation/characters.ts` |
| 13 | Constelação no build | `talents` passou a ser o nível BASE; o motor soma +3 na C3 e na C5 pelo talento que o texto do Lunaris indica. Projetos antigos (sem `constellation`) ficam em C0 e não mudam | `engine/project.ts` |
| 14 | Busca de build no inventário | Heurística (subida por trocas), não exaustiva: ótima não é garantida; os outros personagens ficam com os rolls atuais (não são reotimizados). Se tiver um inventário grande real, teste e diga se os resultados fazem sentido | `src/features/good/loadoutSearch.ts` |

(Novas entradas são acrescentadas abaixo conforme surgirem.)

## Redesign (branch `v2/redesign`)

| # | Decisão | O que fiz por enquanto | Onde mudar |
|---|---------|------------------------|-----------|
| 15 | Números dos mockups são ilustrativos | Nenhum número do mockup foi copiado: janelas de buff, curva acumulada, cascata do golpe e valor de cada buff vêm do motor (ex.: o Supremo da Mavuika tem base 79.724,66, não 79.403; a linha do tempo real tem 6 faixas de buff, não 7). O DPS 216.600 e o DPR 3.790.496 aparecem em todas as telas onde existem | — |
| 16 | "Exportar GOOD" (mockup da Equipe) | GOOD é o formato de **inventário** do Genshin Optimizer; o Astralys só o importa. O botão exporta o projeto do Astralys (.astralys.json) e se chama "Exportar". Se quiser exportar um GOOD de verdade, é preciso definir o que entra (artefatos otimizados viram peças com rolls fracionários) | `screens/Equipe.tsx` |
| 17 | "Reotimizar / Manter build" (mockup de Armas) | **Não implementei.** Não ficou claro o que "manter build" faz no motor (congelar os rolls calculados como manuais?). Hoje a comparação sempre reotimiza os substats para cada arma | `screens/Armas.tsx`, `useWeaponCompare.ts` |
| 18 | Filtro por patch no Vault | Os projetos não guardam o patch do jogo; filtro por nome, personagem, elemento e favoritos | `features/vault/vaultModel.ts` |
| 19 | "Salvar no Vault" | Todo projeto já vive no Vault; o botão marca como favorito (favoritos vêm primeiro) e leva ao Vault | `app/ProjectLayout.tsx` |
| 20 | Recarga avulsa (`/recarga`) | Time próprio, sem projeto nem rotação, guardado em `astralys.recarga-livre` (não aparece no Vault). Dentro do projeto, "Preencher com a rotação" copia usos de habilidade e Supremo; "Usar como ER mínimo" grava no build | `screens/RecargaLivre.tsx`, `screens/Recarga.tsx` |
| 21 | Desligar um buff na tela do personagem | Extensão do motor: `RotationProject.disabled` (ids de fontes) entra em `assembleTeam`. O gabarito da planilha não muda (lista vazia) | `engine/team.ts` |
| 22 | Janelas de buff do exemplo | O exemplo abre com janelas (uma por trecho contínuo de golpes com a etiqueta) e reproduz exatamente 216.600 / 3.790.496. O projeto `sampleProject()` com etiquetas manuais continua nos testes | `projectOps.windowsFromProfiles` |
| 23 | Card | 4:5 (1080×1350) é o padrão, 16:9 (1600×900) e 9:16 (1080×1920) mantidos. Cor de destaque limitada a 4 (dourado, Pyro, Cryo, Electro) e apelido guardado no projeto (`meta.card.nick`) | `screens/card/` |
| 24 | Ícone do Viajante | O Lunaris não tem imagem dele (404 em `UI_Gacha_AvatarIcon_PlayerBoy/Girl`); o avatar cai na inicial | `design/primitives.tsx` |
| 25 | Home | Não existe mockup da home; refiz com o mesmo visual (texto e 3 atalhos). Diga se quer outra coisa | `screens/Inicio.tsx` |
| 26 | Tailwind | Não usei: CSS próprio com variáveis (`src/design`), como combinado | — |
| 27 | Passivas e constelações em escala | 101 personagens com buffs curados (`scripts/curation/characters*.ts`; antes 25). Cada `expect` trava se o texto do Lunaris mudar. Onde o Lunaris traz o parâmetro zerado (personagens antigos) o número é um `lit` copiado da descrição. Buffs com stacks usam o máximo ("Assume N stacks" na nota) e condicionais viram faixas na linha do tempo. Confirme os "assume sempre ativa" (ex.: Jean C4, Chongyun A4) | `src/effects/characters.json` |
| 28 | Efeitos fora do motor | NÃO modelados por falta de suporte: Físico como elemento (Xinyan, Rosaria C6, Mika), redução de DEF por buff (Lisa A4, Razor C4, Durin C6, Nahida C2), Taxa/Dano Crítico por tipo de golpe (Kaeya C1, Yanfei C2, Itto C6, Arlecchino C6), conversões de stat (Kazuha A4, Sucrose A4, Zhongli A4, Mona A4, Nahida A1, Furina, Layla, Kokomi...), efeitos que dependem da composição do time (Lynette A1, Escoffier A4, Charlotte A4, Skirk A4, Chevreuse A1) e reações Lunares/Estelares por Moonsign. Pedem extensão do motor: diga se quero fazer | `scripts/curation/characters2.ts` |
