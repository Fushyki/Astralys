# Astralys

Ambiente de theorycrafting de Genshin Impact: monta rotações de time numa timeline, mostra de onde vem cada buff e quanto vale, guarda tudo num Vault e gera cards para partilhar. Meta: melhor que o Genshin Optimizer em times/rotações e mais legível que o GCSim.

Dono: Davi. UI em pt-BR. Commits em português. Trabalhar na branch `v2/core`, nunca direto no `main`.

## Stack
React 18 + Vite + TypeScript, CSS próprio (sem Tailwind). Testes: Vitest + e2e com playwright-core (`npm run e2e`). Backend separado: `Fushyki/Astralys-BackEnd` (FastAPI + SQLAlchemy + JWT), pasta `C:\Users\dabiv\Astralys-BackEnd`.

Comandos: `npm run dev`, `npm run build` (tsc + vite build), `npx tsc --noEmit`, `npm test`.

## Estrutura (alvo da v2)
- `src/engine/` motor de dano puro em TS, **sem React**, corre em Web Worker, 100% testado.
- `src/data/` JSON gerado por `scripts/sync-data.ts` (não editar à mão).
- `src/effects/` efeitos numéricos de personagem/arma/set, editáveis, com `fonte_info`.
- `reference/` gabarito: `Mavuika_Iansan_Combo2.xlsx` (só leitura).
- `docs/` notas de projeto.

## Motor (`src/engine/`, sem React, roda em Web Worker)
Módulos: `constants/` (reações, níveis 1–100) · `formulas.ts` (DEF, RES, crítico, bases de EM) · `damage.ts` (`computeHit`: dano direto + Derreter/Vaporizar/Espalhar/Intensificar) · `reactions.ts` (`computeTransformative`, `computeSpecial`/Lunar/Estelar, `crystallizeShield`) · `artifacts.ts` · `stats.ts` (bloco estático por fonte, buffs de time por etiqueta, `finalStats`) · `team.ts` (`assembleTeam`) · `rotation.ts` (`evaluateRotation`) · `optimizer.ts` (`optimizeTeam`) · `attribution.ts` (`attributeBuffs`) · `workerApi.ts`/`worker.ts` · `compat/planilha.ts` (importa o .xlsx).

Regras:
- Nunca inventar números de jogo. Todo número vem do Lunaris, de `src/effects/` (com `fonte_info`) ou do Genshin Optimizer (MIT, ver `THIRD_PARTY_NOTICES.md`). Se a regra for ambígua, perguntar.
- Fonte das fórmulas de reação: Genshin Optimizer, camada `libs/gi/wr` (a que o site em produção usa). A camada nova `libs/gi/formula` ainda está em migração e tem valores diferentes (ex.: `lunarcharged` 1,8 vs 3): NÃO usar.
- Dano direto: `((base + termo aditivo) × execuções + dano fixo) × (1+DMG%) × crítico × multDEF × multRES × amplificação`. multDEF = (Lc+100)/((Lc+100)+(Le+100)(1−redDEF)(1−DEFignorada)). RES: <0 → 1−RES/2; <0,75 → 1−RES; senão 1/(4RES+1). A RES vem de um mapa por elemento (`enemy.res`).
- Amplificadora: mult × (1 + 25/9·EM/(EM+1400) + bônus) [Derreter Pyro 2 / Cryo 1,5; Vaporizar Hydro 2 / Pyro 1,5]. Aditiva: nível × (1,25 Espalhar Dendro | 1,15 Intensificar Electro) × (1 + 5·EM/(EM+1200) + bônus), somada à base.
- Transformativas: coef × nível × (1 + 16·EM/(EM+2000) + bônus) [+ dano fixo], × crítico (só reações que podem), × DEF≈1, × RES do elemento da reação. Coeficientes: Sobrecarga 2,75, Estilhaçar 3, Eletrocarregado 2, Supercondutor 1,5, Redemoinho 0,6, Queimadura 0,25, Florescer 2, Brotar 3, Hiperflorescer 3.
- Lunar/Estelar usam 1 + **6**·EM/(EM+2000) (não 16). Da reação: nível × coef (Lunar-Charged 3, Lunar-Crystallize 1,6, Stellar-Swirl 0,75; vórtices 2x e 3x). Golpe de personagem: talento × stat × (Lunar-Charged 3 | Lunar-Bloom 1 | Lunar-Crystallize 1,6 | Estelar 1+`_mult_`).
- Os "perfis de buff" da planilha viram **etiquetas**: cada ação lista as etiquetas ativas (`gear:<membro>`, `char:<membro>`, `label:<nome>`); as janelas de tempo do editor (Fase 3) as preenchem.
- Modo compat da planilha (`compat/planilha.ts`): elemento de todo golpe = o do personagem; coeficiente de EM das amplificadoras 2,78 (`PLANILHA_AMP_COEFFICIENT`); buffs de time só ATK%/ATK/EM/DMG%; ressonância só Pyro (+25% ATK, 2+ Pyro).
- Pendências conhecidas do motor (confirmar antes de implementar): elemento Físico por padrão nos golpes de arma; ressonâncias além da Pyro; crítico de time variando por ação no otimizador; níveis de talento acima de 10 não verificados contra a planilha.
- Gabarito: `tests/golden/planilha.test.ts` lê os valores das células em cache do .xlsx (rolls, stats por perfil, 24 linhas da rotação, DPR/DPS). `tests/engine/` cobre o que o gabarito não exercita (dano fixo, aditivas, atribuição).

## Fonte de dados: Lunaris
API não oficial `https://api.lunaris.moe/data/` (descoberta lendo o bundle do site):
`version.json`; `{ver}/charlist.json`, `weaponlist.json`, `artifactlist.json`; `{ver}/{lang}/char|weapon|artifact/{id}.json` (`lang` em minúsculas: `en`, `pt`). Multiplicadores 1–15 em texto (`"36.48% x2"` = 2 hits). Cache local em `data/raw/` (fora do git), poucos pedidos, não commitar dumps. Reserva: Project Amber, `genshin-db`.

## Dados (Fase 1)
- `npm run sync:data [-- --refresh] [-- --version=7.1.53]` baixa (cache em `data/raw/`, fora do git), interpreta, valida com Zod e escreve `src/data/generated/{characters,moves,weapons,artifacts,meta}.json`. Esquemas em `src/data/schema.ts`; parser em `scripts/lib/parse.ts`.
- Golpe (`Move`): `scale.{atk,hp,def,em,flat}` = escala TOTAL nos níveis 1–15 (já somada sobre os hits, igual à planilha) e `hits` = nº de acertos (conta para stacks de dano fixo). `"a%/b%"` vira variantes (`variant`/`variants`; ex.: queda baixa/alta). `hitType` = normal | charged | plunge | skill | burst (arcos: `Aimed Shot` = charged).
- Personagens: stats base só no nível 90 (o Lunaris só dá o máximo). O Viajante vem como `Aether|Lumine (Elemento)`: o Carregado do Aether e o da Lumine diferem de verdade.
- 10 golpes de dano não são interpretados e aparecem no relatório do sync: os definidos como % do dano de outro ataque ("160% Normal Attack DMG": Venti, Yoimiya, Wriothesley, Razor, Wanderer), com dois elementos (Freminet) ou "% do ATK do personagem correspondente" (Nicole).
- Efeitos numéricos: `src/effects/{characters,weapons,sets,flatDamage}.json` (esquema em `src/effects/schema.ts`). Semeados UMA vez por `scripts/seed-effects.ts` a partir da planilha (só 4 personagens, 7 armas, 7 sets, 2 buffs de dano fixo); agora editados à mão, sempre com `fonte_info`. O script recusa sobrescrever sem `--force`.
- Testes: `tests/data/` confere os dados gerados contra as abas `L_Golpes`, `L_Personagens` e `L_Armas` da planilha (os 55 golpes batem nos 15 níveis) e valida as referências dos efeitos.
- Dados de jogo só vêm de `src/data/generated/` (Lunaris). O legado `characters.ts`/`weapons.ts` foi removido; partículas da habilidade em `src/effects/particles.json`.

## Segurança
`.env` nunca no git (só `.env.example` com `VITE_API_URL`). Auth só e-mail+senha via JWT do backend; Supabase e login Google foram removidos (reintroduzir Google só com verificação de token no backend).

## Estado das fases
- [x] Fase 0 — higiene e segurança (frontend + backend). Branches `v2/core` enviadas; PRs por abrir. Backend: ver `Astralys-BackEnd` (testes: `pytest tests`, deps em `requirements-dev.txt`). Pendente: colunas `schemaVersion/revision/patch/tags` + Alembic ficam para a Fase 3.
- [x] Fase 1 — pipeline de dados (Lunaris → JSON + Zod). `npm run sync:data` gera `src/data/generated/` (136 personagens, 1786 golpes, 257 armas, 66 sets). Efeitos em `src/effects/` semeados da planilha. Ver "Dados" abaixo.
- [x] Fase 2 — motor de dano + gabarito. `src/engine/` cobre dano direto, amplificadoras, catalisadoras, transformativas, Lunares e Estelares; reproduz a planilha (DPR 3 790 496,07 / DPS 216 599,78) com tolerância 1e-9. Ver "Motor" abaixo.
- [ ] Fase 3 — editor de rotação, em partes:
  - [x] 3a base: React Router (`/rotacao/:id`), Zustand (`features/rotation/store.ts`, com desfazer/refazer), TanStack Query (`data.ts`, dados do jogo em import dinâmico), formato de projeto salvo `RotationProject` (`engine/project.ts`, Zod, versão 1), persistência local (`persistence.ts`), Web Worker (`engineClient.ts`, `useAnalysis.ts`) e a página `/rotacao` com KPIs, painéis e lista de ações. Projeto de exemplo: `features/rotation/sample/mavuika-iansan.json` (gerado por `scripts/make-sample-project.ts`).
  - [x] 3b linha do tempo em SVG: `Timeline.tsx` (estrelas por golpe, arrastar para mudar o tempo, janelas de buff que se movem e redimensionam, régua com marcador, tooltip, teclado), `Inspector.tsx` (editar golpe/janela + cascata do golpe), `Palette.tsx` (inserir golpes no marcador). Janelas de buff: `buffWindows` no projeto; ação com `tagSource: 'windows'` recebe as etiquetas pelo tempo (`tagsAt`, início incluído, fim excluído); `'manual'` mantém os perfis da planilha (o exemplo). `windowsFromProfiles` converte um no outro (o resultado pode mudar). Teste de interação num navegador real: `npm run e2e` (precisa de `vite preview` ligado e de Edge/Chrome; 14 verificações).
  - [x] 3c-1 equipe e build ("Theorycraft" do GO): `TeamBar.tsx` (membros: selecionar/trocar/remover/adicionar, ressonância; máx. 4, sem repetir), `CharacterPicker.tsx` (diálogo com busca e filtro por elemento), `BuildEditor.tsx` (arma, sets 2+2, mains, raridade das peças, talentos, ER mínimo, rolls otimizados OU manuais, stats finais ao vivo, avisos de orçamento/limite e de passivas sem efeito cadastrado). Regras: remover um membro reindexa ações, janelas e etiquetas (`teamOps.remapTag`); trocar um personagem descarta as ações da vaga (desfazível). Motor: `MemberRef.manualRolls`, `analyzeProject` devolve `memberStats` e `rollWarnings`. A análise chega do worker depois da edição: partes que dependem dela ficam em espera enquanto a equipe não bate (`inSync`).
  - [x] Realinhar: botão na barra da linha do tempo (`projectOps.realignActions`): mantém a ORDEM em que os golpes foram colocados e tira os espaços (primeiro em 0 s, depois um a cada `intervalo`, 0,5 s por defeito); as janelas de buff acompanham por interpolação contínua para cobrirem os mesmos golpes. Painel de cenário (duração, nível/RES do inimigo, redução de DEF) com `updateConfig`. Teste: `tests/features/realign.test.ts` e `npm run e2e`.
  - [x] Layout de `/rotacao`: equipe com retratos no topo (imagem do Lunaris `assets/gachaicon/{icon}.webp`, campos `icon`/`splash` em `Character`, fallback com a inicial), depois Build, KPIs e gráficos, e por último linha do tempo, inspetor/paleta e tabela de ações.
  - [x] Tabela de dano por personagem (`engine/damageTable.ts` + `DamageTable.tsx`, aba "Talentos" do GO): todo o kit com o build e todos os buffs de time, sem crítico/crítico/médio, com seletor de reação (derreter, vaporizar, intensificar, propagar). Não consome stacks de dano fixo. Testes: `tests/engine/damageTable.test.ts` e e2e. Dano das reações (transformativas, Lunares, Estelares) em `engine/reactionTable.ts`, sem bônus de sets/armas e sem crítico nas Lunares/Estelares. Rótulos dos golpes em português (`labelPt`, do Lunaris `pt`, casados por posição) na paleta e na tabela de dano.
  - [x] Otimizador interativo (`engine/critSweep.ts`, `CritOptimizer.tsx`, pedido `critSweep` no worker): curva do dano médio da equipe × rolls em Taxa+Dano Crítico (um ponto por roll, o resto dos substats otimizado), ponto ótimo e build atual marcados, controle deslizante com detalhes e botões "Usar N rolls" (fixa `forcedCritRolls`) / "Deixar o otimizador escolher". Ponto com 20 rolls reproduz o DPR da planilha. Pendente: restrições extras (alvo por personagem, CR mínima) e heatmap +1 roll.
  - [x] Mapa de calor "Valor de +1 roll" (`GainHeatmap`, usa `bundle.gains`) e comparação de armas (`engine/weaponCompare.ts`, `WeaponCompare`, pedido `weaponCompare` no worker): reanalisa a rotação com cada arma do tipo, substats reotimizados; armas sem efeito cadastrado são sinalizadas. Pendente: custo-benefício de constelações/refinamentos (faltam efeitos numéricos).
  - [x] Cofre "Meus projetos" (`/rotacao`, `ProjectsPage.tsx`): lista os projetos do localStorage (+ exemplo), importa a planilha .xlsx (`xlsx` carregado sob demanda; `importFile.ts`) e JSON exportado, duplica, renomeia, exporta e apaga. O editor abre em `/rotacao/:id`. Teste: `scripts/e2e/cofre.cjs` (planilha de referência importada dá DPS 216.600). Interface antiga REMOVIDA (App, components, engines, services, context, types, utils, characters.ts/weapons.ts, testes tier1-4, Tailwind): a home agora é `features/home/HomePage.tsx`; rotas: `/`, `/rotacao`, `/rotacao/:id`, `/rotacao/:id/card`, `/rotacao/:id/recarga`.
  - [x] Card infográfico a partir do projeto (`src/features/card/`: `cardModel.ts` puro e testado, `RotationCard.tsx` 1280×720 ou 720×1280, `CardPage.tsx` em `/rotacao/:id/card`, exporta PNG 2x com fontes embutidas via `fontCss.ts`; título/selo/etiqueta em `meta.card`). Teste: `scripts/e2e/card.cjs`. Trabalho nesta fase na branch `v2/cards-vault-er`; decisões abertas em `docs/DECISOES_PENDENTES.md`.
  - [x] Cofre redesenhado: cada projeto é um cartão com retratos, barra de participação no dano, DPS/DPR (`useProjectStats`, calculado em fila na thread principal) e atalho para o card.
  - [x] Calculadora de recarga (`/rotacao/:id/recarga`): `engine/energy.ts` (puro; reproduz os 202,2/205,2/185,7% do app antigo), `features/energy/` (`energyModel.ts` liga ao projeto; config em `meta.energy`; compara com a ER real do build e "Usar como ER mínimo" grava `minER`). Dados: custo do Supremo do Lunaris + `src/effects/particles.json` (herdado do legado, não verificado). Teste: `scripts/e2e/recarga.cjs`.
  - [x] Inventário GOOD (`features/good/`: `goodImport.ts` puro, `goodStore.ts`, `GoodPanel.tsx` no editor): importa o export do Genshin Optimizer e aplica o build real (arma, sets, main stats, substats somados em rolls fracionários) ao membro selecionado; `MemberRef.fourPiece=false` para 2 peças soltas; rolls manuais aceitam 2 casas decimais. Teste: `scripts/e2e/good.cjs`. NÃO validado com um arquivo exportado real.
  - [x] Comparar projetos A/B (`/comparar?a=&b=`, `features/compare/`: `compareModel.ts` puro + `ComparePage.tsx`): veredito, DPS/DPR/duração e dano e build por personagem; atalho "Comparar" no cofre. Teste: `scripts/e2e/comparar.cjs`.
  - [ ] 3c-2 tabela de dano por personagem (como a aba Talentos do GO: cada golpe com dano sem crítico/crítico/médio, seletor de reação e modo de crítico)
  - [ ] 3c-3 otimizador interativo (alvo, restrições, curva de dano × rolls em crítico)
  - [ ] 3c-4 painéis de build restantes (ganho por +1 roll em heatmap, comparação de armas, custo-benefício: precisa de efeitos de constelações/refinamentos)
  - [x] 3d importar planilha .xlsx, cofre, card, recarga e remoção da interface antiga (branch `v2/cards-vault-er`, PR aberto pelo Davi)
- [ ] Fases 4–6 — vault/cards, comparadores, otimizador GOOD (plano próprio)

## Interface (Fase 3)
- Identidade visual aprovada: céu índigo com estrelas e filetes dourados (carta celeste) + cartões retangulares com títulos em CAIXA ALTA condensada (mesa de mixagem). Barlow Condensed (títulos, números) e Barlow (texto). Sem itálico. Tema em `src/ui/ast.css` escopado em `.ast-app`; componentes em `src/ui/components.tsx`. Maquete de referência publicada como artefato (conceitos do Astralys).
- Cada KPI tem nome, valor, unidade e uma frase explicando o cálculo. Buffs sem origem conhecida da planilha aparecem sempre, marcados "a confirmar".
- A lógica de tela é pura e testada: `projectOps.ts` (edição), `summary.ts` (números da tela). O estado só orquestra histórico (100 passos) e seleção.
- Para ver a página: `npm run build && npx vite preview`, abrir `/rotacao`. Teste de fumo com Edge headless: `playwright-core` com `channel: 'msedge'` (o MCP do Playwright não conecta nesta máquina).

Plano completo: `C:\Users\dabiv\.claude\plans\hashed-nibbling-island.md`. Strix (pentest) só no fim, em `localhost`, com um LLM que não seja o Claude.
