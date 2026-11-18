## Atualizações de 26/10/2026
- Detalhes na decisão 84 de `docs/DECISOES_PENDENTES.md`: Lunar/Estelar de golpes extras e reações (specialOfMoveRef), dano fixo por golpe (`flatStacks`/`flatOff`, consumo em ordem de tempo), buffs de teste no Editar build (`customBuffs.ts`), textos do Lunaris limpos (`src/data/clean.ts`), otimizador mais rápido (`scripts/bench-optimizer.ts`), Avançado sem Ferramentas e hero em `/`.


## Atualizações de 27/10/2026
- **Linha amarela do tempo** (`Timeline.tsx`): clicar na régua põe a linha (`playhead`); arrastá-la empurra tudo à direita (`projectOps.pushFrom`/`minPush`, `store.pushFrom`). A régua tem o tamanho da duração definida e só cresce se um golpe passar dela.
- **Stacks escolhidos pelo usuário em tudo**: `CharacterBuff.stacks` agora tem `table` (efeitos que sobem aos saltos, ex. 10/20/30/48%), `of` (usa a escolha de outro buff) e `default` (ex.: contagem de inimigos começa em 1). Arma e set com `x` viram o buff `stacks`/`stacks-N` (`splitStacks` em `scripts/curate-effects.ts`); os ids de gear (`arma:...`, `set4-...`) respondem a `MemberRef.stacks`. Seletor: Equipe ("Buffs recebidos") e Talentos (`ReceivedSection`).
- **Compartilhar rotação** (`features/rotation/share.ts`, `ShareDialog.tsx`): arquivo `.astralys-rotacao.json` com as partes escolhidas (rotação, cenário, buffs de teste, equipe); a rotação entra por NOME de personagem (`remapMemberId`). Arquivo com equipe vira time novo no Vault.
- **Nível do personagem** (`MemberRef.level`, `data/levels.ts`, `scripts/sync-levels.ts` → `levels.json` do Genshin Optimizer): stats base em qualquer nível, ancorados no Lunaris no 90; ascensão = nº de limites 20/40/50/60/70/80 ≤ nível. Sem dados (Mitya, Valeriy) fica no 90. Nível da ARMA ainda fixo.
- **Reação e crítico** compartilhados entre Resumo, Talentos, Avançado e Otimizar (`features/character/damageView.ts`); Avançado compara build atual × melhor/segunda melhor (`BuildCompare.tsx`, `optimizer/resultCache.ts`). Moonsign já vem ligado nos personagens Moonsign (`factionsOf`).


## Atualizações de 28/10/2026
- **Cards**: `features/card/cardModel.ts` monta `CardModel.lanes` (uma faixa por personagem; golpe contínuo = UMA entrada com início, fim e execuções; reações lançadas à mão não entram) e `sequence` na ordem real do tempo. `screens/card/RotationLanes.tsx` desenha a rotação (estrela = golpe, dourada = Supremo, barra = contínuo) e é usada nos 3 formatos: 4:5 (`PortraitCard`, constelação entre os retratos), 16:9 (`WideCard`) e 9:16 (`TallCard`, "Constelação": quadros 2×2, DPS num arco por participação, rotação com letras). O fundo do `.pc` é sólido (`--bg` não pode apontar para si mesmo: o PNG saía transparente).
- **Rotação**: desligar um buff só para um golpe (`ActionRef.tagsOff`, lista em "Golpe selecionado"); dano de cada execução dos golpes contínuos; números do golpe (dano base, ATK, Proficiência, crítico, bônus, DEF e RES).
- **Avançado**: clicar num golpe abre o cálculo do dano com a fonte de cada fator (`features/character/damageFormula.ts`).
- **Otimizador**: `assembleTeam` uma vez por set e `StatsShare` em `evaluateRotation` (3 a 10× mais rápido).

