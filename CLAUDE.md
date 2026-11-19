# Astralys

Ambiente de theorycrafting de Genshin Impact: monta rotações de time numa timeline, mostra de onde vem cada buff e quanto vale, guarda tudo num Vault e gera cards para partilhar. Meta: melhor que o Genshin Optimizer em times/rotações e mais legível que o GCSim.

Dono: Davi. UI em pt-BR. Commits em português. Siga a seção "Fluxo de trabalho" abaixo: toda tarefa vira uma Issue, o trabalho vai direto para a `main` depois dos testes, e mudança em `src/engine/` abre um branch e espera a aprovação do Davi.

## Fluxo de trabalho
Toda tarefa (correção, melhoria ou função nova) vira uma Issue no GitHub antes de começar. Ao começar, comente na Issue "em andamento" e diga qual sessão está trabalhando, para outra sessão não repetir o trabalho. O commit, em português, cita a Issue (ex.: "Corrige o padrão do Espírito Lutador (#12)"). O trabalho vai direto para a main depois dos testes, sem Pull Request, como já combinado. A exceção: mudança no motor de dano (src/engine/) abre um branch e espera a minha aprovação antes de ir para a main. Ao terminar, feche a Issue com um comentário curto: o que mudou e quais testes rodaram.

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
- Imagens: ícone do rosto `assets/avataricon/UI_AvatarIcon_*`, arma `assets/weaponicon/<weapon.icon>`, peça de set `assets/artifacts/UI_RelicIcon_<setId>_<n>` (`design/images.ts`). O sync traz também o texto em português das passivas de arma e dos bônus de set (`descriptionPt`, `namePt`) e o ícone da arma.
- `npm run sync:data [-- --refresh] [-- --version=7.1.53]` baixa (cache em `data/raw/`, fora do git), interpreta, valida com Zod e escreve `src/data/generated/{characters,moves,weapons,artifacts,meta}.json`. Esquemas em `src/data/schema.ts`; parser em `scripts/lib/parse.ts`.
- Golpe (`Move`): `scale.{atk,hp,def,em,flat}` = escala TOTAL nos níveis 1–15 (já somada sobre os hits, igual à planilha) e `hits` = nº de acertos (conta para stacks de dano fixo). `"a%/b%"` vira variantes (`variant`/`variants`; ex.: queda baixa/alta). `hitType` = normal | charged | plunge | skill | burst (arcos: `Aimed Shot` = charged).
- Personagens: stats base só no nível 90 (o Lunaris só dá o máximo). O Viajante vem como `Aether|Lumine (Elemento)`: o Carregado do Aether e o da Lumine diferem de verdade.
- 10 golpes de dano não são interpretados e aparecem no relatório do sync: os definidos como % do dano de outro ataque ("160% Normal Attack DMG": Venti, Yoimiya, Wriothesley, Razor, Wanderer), com dois elementos (Freminet) ou "% do ATK do personagem correspondente" (Nicole).
- Efeitos numéricos: `src/effects/{characters,weapons,sets,flatDamage}.json` (esquema em `src/effects/schema.ts`). Semeados UMA vez por `scripts/seed-effects.ts` a partir da planilha (só 4 personagens, 7 armas, 7 sets, 2 buffs de dano fixo); agora editados à mão, sempre com `fonte_info`. O script recusa sobrescrever sem `--force`.
- Testes: `tests/data/` confere os dados gerados contra as abas `L_Golpes`, `L_Personagens` e `L_Armas` da planilha (os 55 golpes batem nos 15 níveis) e valida as referências dos efeitos.
- Dados de jogo só vêm de `src/data/generated/` (Lunaris). O legado `characters.ts`/`weapons.ts` foi removido; partículas da habilidade em `src/effects/particles.json`.

## Comunidade (galeria sem conta)
- Não há mais contas nem login no site (removidos: `/entrar`, sessão, sincronização). `src/online/config.ts` (`VITE_API_URL`; sem ela a galeria avisa que falta o servidor) e `api.ts` (cliente do FastAPI, erros em pt-BR).
- Aba **Comunidade** (`/comunidade`, `screens/Comunidade.tsx`): lista times publicados com busca (nome, autor, personagem), filtro de personagem e de versão, e no card o time, DPS/DPR e a sequência da rotação (`features/community/teamSummary.ts`, calculada no navegador de quem publica).
- Publicar: "Compartilhar" no cartão do Vault (`features/community/publish.ts`) calcula o time, envia `POST /times` (anônimo, 10 por hora por IP) e copia `https://site/p/<id>`. O servidor devolve um token de edição; este navegador o guarda em `localStorage['astralys.publicados']` (`published.ts`) e "Parar de compartilhar" chama `DELETE /times/{id}` com `X-Edit-Token`. Perdeu o navegador, perdeu o token. Moderação: o dono do site digita o código no campo "Código" das Configurações (engrenagem; guardado em `localStorage['astralys.admin']`) e passa a ver "Remover (admin)" em todo card; o servidor confere com `ADMIN_TOKEN` (variável do ambiente do backend, mínimo 12 caracteres, nunca no repositório). O nome do autor é opcional (`astralys.autor`).
- `screens/Publico.tsx` (`/p/:id`) lê `GET /times/{id}`: mostra o time com DPS/DPR e "Abrir nos meus Times" (cópia local).
- Backend (`Astralys-BackEnd`, branch `v2/times-publicos`): tabela `astralys_times_publicos` (criada pelo `create_all`), rotas `/times`, testes em `tests/test_times_publicos.py`. Os números do card vêm do navegador de quem publica (não são verificados); a tela do link recalcula a partir do projeto.

## Importar pelo UID (Enka.Network)
- O akasha.cv bloqueia acesso automatizado (Cloudflare), mas a fonte dele é o Enka.Network, que tem API pública. O navegador não chama o Enka (sem CORS): o backend tem `GET /enka/{uid}` (`enka.py`, User-Agent próprio, cache de 60 s, erros em pt-BR). `src/online/enka.ts` busca e `src/features/enka/enkaImport.ts` converte a vitrine (até 8 personagens) em inventário GOOD (ids do Enka = ids dos dados: personagem, arma, set; ordem dos talentos em `skillOrder.json`, gerado da tabela pública do Enka). `mergeGood` junta à vitrine o inventário que o usuário já tinha. UI: Personagem > Ferramentas > Inventário GOOD > "Buscar pelo UID" (só com `VITE_API_URL`). Teste: `tests/features/enkaImport.test.ts` (fixture sanitizada em `tests/fixtures/enka-vitrine.json`) e `scripts/e2e/uid.cjs` (mock do backend). Não importa o Viajante. Prints (OCR) não foram feitos.

## Segurança
`.env` nunca no git (só `.env.example` com `VITE_API_URL`). O site não tem login; o backend ainda tem as rotas de auth, sem uso pelo site.

## Cobertura de efeitos (arma, set, passiva, constelação)
- Regra do Davi: "tudo precisa funcionar". Nada fica sem classificação: toda arma de 4 e 5 estrelas (220), todo set (66) e toda passiva de ascensão e constelação dos 136 personagens (1.088 itens) está em um de 4 estados: **no cálculo** (número aplicado), **parcial** (uma parte que mexe em dano fica de fora e a nota diz qual), **sem efeito no dano** (só energia, cura, estamina, recarga de habilidade) ou **nível de talento** (+3 da C3/C5). `tests/data/gearEffects.test.ts` trava isso.
- Números atuais (parte B, decisões 61 a 68): armas 3 parciais; sets 6 parciais; personagens 476 buffs, 93 golpes extras, 38 golpes Lunar/Estelar do kit, 293 itens só utilidade, 80 parciais (resta cura, chance, bônus de um golpe só e mecânicas de estado). Lunar/Estelar: `ResolvedMove.special` (kit via `CharacterEffect.specialMoves`, golpe extra via `Proc.special`), bônus em `reactionBonus` (`<r>`, `<r>Base`, `<r>Special`, `<r>CritRate`, `<r>CritDmg`, `<r>Flat`, `<r>Mult`), facções possíveis em `CharacterEffect.factions` e ligadas pelo usuário por membro em `MemberRef.factions` (padrão desligado; interruptor na página do personagem), com regras `team.moonsign/moonsignMax/hexerei`, `forFactions`; reações como ação (`talent: 'reaction'`, `REACTION_ACTIONS`) entram no DPS; golpe fração de outro (`Proc.of`); dano fixo para a equipe (`flat.targets`). Curadoria em `scripts/curation/lunar.ts` e `extras.ts` (`NOTE_UPDATES` tira as notas cobertas).
- Onde ficam: `scripts/curation/{weapons,weapons2,gear}.ts` (armas; `gear.ts` define a linguagem: `p` = parâmetro do Lunaris por refinamento, `lit`, `re` = regex no texto de cada refinamento), `sets.ts`+`sets2.ts` (4 peças), `characters*.ts` (buffs) e `charnotes*.ts` (notas "utility"/"partial"). `npx tsx scripts/curate-effects.ts` regenera `src/effects/*.json`; cada `expect` trava se o texto do Lunaris mudar.
- O que o motor ganhou para isso: `WeaponStats.buffs/flat`, `SetEffect.fourPiece.buffs/flat` e `twoPieceBuffs` (mesmo formato dos buffs de personagem, mesclados por `gearBuffs` em `resolveMember`); `CharacterBuff.defShred` (redução de DEF), `flat` (dano fixo por ATK/HP/DEF/EM do dono, escalado pelo nível do talento), stats `defIgnore`, `atkFlat/hpFlat/defFlat`; conversões `from: 'partyEnergy'` e `to: 'er'`; regras de time `same`/`different` (elemento do dono), `{ names, orDifferent }`, `minDistinct`, `maxBurstEnergy`, `onlyWeapons`; `TeamAssembly.enemyDefRed`.
- Fora do cálculo, por família (marcadas "parcial"): mecânicas Lunar, Estelar, Moonsign e Hexerei; golpe extra que é % do dano de outro golpe; dano fixo que vem de outro personagem (Faruzan A4, Citlali C1, Xilonen C4, Xianyun A4); bônus que dependem de cura, chance ou contagem de stacks. Golpes extras de proc, Físico e bônus por reação já entram (decisões 56 a 60): golpe extra = ação com `move.talent: 'proc'` (`memberProcs` em `engine/project.ts`, curadoria em `scripts/curation/procs.ts` e `procs` das armas/sets); Físico = `ActionRef.element`, `StatBlock.physDmg/physCritDmg/eleDmg` e `hitDmgBonus`; reação = `StatBlock.reactionBonus` (Propagar/Intensificar no golpe; transformativas, Lunares e Estelares como ação de reação na rotação, decisão 62).
- Modo `compat: 'planilha'`: os 4 personagens da planilha (Mavuika, Citlali, Iansan, Bennett) ficam só com os efeitos dela, sem as passivas curadas (`planilhaEffect`), para o gabarito não mudar.
- `scripts/sync-data.ts`: o +3 de talento da C3/C5 agora é lido pelo nome OU pelo tipo do talento no texto (corrige Vodyanitsa, Varka, Vesna, Alyosha, Mitya, Linnea, Valeriy e Aether/Lumine Cryo).

## Interface (redesign, branch `v2/redesign`)
- Fluxo em telas separadas, cada uma em `src/screens/` (CSS ao lado): **Equipe** `/projeto/:id` → **Personagem** `/projeto/:id/personagem/:nome` (2 abas por `?aba=`: "Resumo e build" (padrão) e Avançado; o build é o bloco Equipamento: arma e 5 artefatos como cards com imagem, passiva da arma com refino R1–R5 e bônus do set em português, e seletores em grade `personagem/WeaponPicker.tsx` e `SetPicker.tsx`) → **Rotação e buffs** `/projeto/:id/rotacao` → **Dano do time** `/projeto/:id/time` → **Armas e constelações** `/projeto/:id/armas/:nome?` → **Recarga** `/projeto/:id/recarga` (e avulsa em `/recarga`) → **Vault** `/vault` (todos os times, cada um como o card do mockup em miniatura: o mesmo `PosterCard`, com as ações embaixo; `useProjectCards`) e **Card** `/card/:id` (4:5 padrão, 16:9, 9:16). Também `/novo` (montar um time em 3 passos: personagens, builds [padrão ou UID] e rotação [básica ou em branco]; `features/rotation/newTeam.ts`; "Novo time" do Vault e a home levam para lá), `/comparar?a=&b=` e a home `/` (3 caminhos: montar um time, importar o meu build, abrir um time salvo). As rotas antigas `/rotacao*` redirecionam.
- Navegação (decisão do Davi, estilo Genshin Optimizer): menu geral em TODAS as telas `Times · Personagens · Inventário · Ferramentas ▾` (`app/AppHeader.tsx`; o antigo Vault agora é "Times", rota `/vault`). Dentro de um time há uma faixa com 2 telas numeradas: 1 Equipe (o personagem fica dentro dela: tocar no retrato troca o personagem, "Ajustar build" abre a página do personagem, que tem as abas Resumo e build · Otimizar · Avançado), 2 Rotação e buffs (o dano acumulado e a divisão do dano ficam nela; `/time` redireciona). Barra de passos no rodapé "Passo N de 2", terminando em "Gerar card" (`app/ProjectSteps.tsx`). Ferramentas: Recarga, Comparar, Armas e constelações, Card (as do time só aparecem dentro dele).
- Design system em `src/design/`: `tokens.css` (cores: fundo #0A0E1C, superfície #111733, ouro #E9C46A, cores dos elementos e variação escura para o 2º do mesmo elemento), `design.css` (classes `dz-*`), `primitives.tsx`, `fields.tsx`, `charts.tsx`, `elements.ts`. Fontes Saira Condensed (títulos/números) e IBM Plex Sans (texto). Controles com 44 px, raio 16. CSS com variáveis, sem Tailwind. O cartão da Equipe (`eq-card`) é a base do cartão do Vault.
- `src/app/`: `ProjectLayout` abre o projeto por id, salva sozinho (400 ms), roda o motor UMA vez no worker e entrega tudo às telas por `useProjectView()` (`ProjectContext`); `AppHeader` tem as abas e "Salvar no Vault" (favorita e leva ao Vault).
- Lógica de tela pura e testada em `src/features/*Model.ts` (`team/teamModel`, `character/characterModel`, `rotation/rotationModel`, `time/timeModel`, `vault/vaultModel`, `card/cardModel`). Nenhum número de mockup é copiado: tudo vem do motor. Buffs sem origem conhecida da planilha aparecem sempre, marcados "a confirmar".
- Motor intacto no gabarito; extensão: `RotationProject.disabled` (ids de fontes desligadas, `TeamInput.disabled`). DPS 216.600 e DPR 3.790.496 do exemplo devem aparecer em toda tela onde existem.
- Verificação: `npx tsc --noEmit`, `npm test`, `npm run build`, e `npm run e2e` (9 roteiros em `scripts/e2e/`, com screenshots em `scripts/e2e/out/`; precisa de `npx vite preview --port 4173` ligado e de Edge). O MCP do Playwright não conecta nesta máquina.
- Decisões em aberto do redesign: `docs/DECISOES_PENDENTES.md` (itens 15 a 26).

Plano completo: `C:\Users\dabiv\.claude\plans\hashed-nibbling-island.md`. Strix (pentest) só no fim, em `localhost`, com um LLM que não seja o Claude.


## Guia visual v2 (telas Otimizar e Talentos)
- Mockups de referência em `reference/design/` (`Estilo`, `Otimizar`, `Talentos` `.dc.html`): são especificação, não código.
- Medidas únicas: `src/ui/tokens.ts` espelha as variáveis de `src/design/tokens.css` (`--sp-*`, `--ctl-*`, `--r-*`, `--fs-*`, `--ico-*`, `--panel-*`, `--row-h`, `--side-col`); `tests/design/tokens.test.ts` falha se os dois se afastarem. CSS novo usa só essas variáveis.
- Ação nunca é texto sublinhado: use `Button`/`ButtonLink` (`src/design/Button.tsx`). Painel novo: `<Panel bar title badge foot>`; blocos da mesma linha ficam com a mesma altura (`align-items: stretch`) e o rodapé do painel desce com `margin-top: auto`.
- Imagens de artefato: `pieceIconUrl(setId, slot)` em `src/design/images.ts` (Lunaris `assets/artifacts/UI_RelicIcon_<set>_<n>.webp`, sem cache local, lazy-load, glifo da posição se faltar). Ícones de talento, passiva e constelação: `assets/skills/<icon>.webp`.
- Textos de talentos: `src/data/generated/talents.json`, gerado do cache do Lunaris por `npx tsx scripts/sync-talents.ts` (texto, ícone e as linhas que não são dano: duração, recarga, Stamina).
- Verificação: `npx vite preview --port 4173` (não abre mais o navegador: `preview.open: false`) e os roteiros de `scripts/e2e/` (Otimizar e Personagem conferem alturas iguais, grade de builds, imagens e ausência de sublinhado).


## Tela Rotação (mockup `reference/design/RotacaoEstelar.dc.html`)
- `screens/Rotacao.tsx` junta `rotacao/{Moves,Timeline,HitPanel,BuffPanel,Sequence,Charts}.tsx` (CSS em `rotacao.css`, peças em `rotacao/ui.tsx`). Modelo puro: `features/rotation/screenModel.ts` (rótulo do golpe, "em campo", buffs por quem dá, linhas da Sequência, curva de dano) e `projectOps.ts`.
- Golpe contínuo = grupo de ações com o mesmo `ActionRef.chainId` (cada execução é uma ação normal com instante e reação próprios; `RotationProject.chains` guarda "a cada" e "até"). O motor não muda.
- Janela de buff: `BuffWindow.whole` (rotação inteira) e `BuffWindow.anchor` ("por golpe": acompanha o golpe-gatilho, `followAnchors`). Buff sem janela não entra no cálculo. Redução de RES/DEF é um buff comum (sem seção de debuffs, decisão do Davi).
- Duração: `effectiveDuration(project)` = último golpe, salvo `config.durationManual` (Configurações) ou modo planilha (gabarito).
- Inserção: "Em ordem (no fim)" ou "No instante marcado" com espaço entre golpes (0,4 s); estado no store (`insertMode`, `gap`), fora do desfazer.


## Aba Otimizar (mockup `reference/design/Otimizar.dc.html`)
- `screens/Otimizador.tsx` (`OtimizadorPanel`) orquestra; peças em `screens/otimizar/`: `AsideCard` (coluna do personagem, um painel só), `CurrentBuild` (painel "Build atual" + botão "Status em campo"), `ResultCard` (card de build, grade de 2; CV por peça `pieceCv`), `minimos.ts` (mínimos como chips: `activeMins`, `firstUnmet`, `formatMin`; a adição é inline no painel de otimização 66|33), `shared.tsx` (`PieceArt`, `setColor`, `critValue`). Formatação de main stats: `formatMain` em `features/good/labels.ts` (fração ×100).
- Build atual e diferenças dos cards vêm do MESMO avaliador (`evaluateEquipped` em `features/optimizer/run.ts`); "Status em campo" usa `BuildReport.fieldStats` (todos os buffs de time ligados juntos). Equipado que não cumpre um mínimo nunca é base de comparação (decisão 82).
- Teste: `scripts/e2e/otimizar.cjs` (34 verificações, screenshots em 1600/1366/390 px).

## Mais detalhes
- Histórico das fases e atualizações: `docs/ESTADO_DAS_FASES.md`, `docs/ATUALIZACOES.md`. Otimizador: `src/features/optimizer/CLAUDE.md`. Bases GOOD: `src/features/good/CLAUDE.md` (carregam ao trabalhar nessas pastas).
