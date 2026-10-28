# Astralys: resumo para outra IA / agentes (28/10/2026)

## O que é
Ambiente de theorycrafting de Genshin Impact: o usuário monta um time, uma rotação numa linha do tempo, vê de onde vem cada buff e quanto vale, otimiza artefatos, compara builds e gera cards para compartilhar. Meta: melhor que o Genshin Optimizer (GO) em times e rotações, e mais legível que o GCSim. Dono: Davi. **Interface em pt-BR, commits em português.**

## Stack e como rodar
- React 18 + Vite + TypeScript, CSS próprio (sem Tailwind), Zustand, TanStack Query, React Router, Zod, Web Workers.
- Testes: Vitest (`npm test`, ~760 testes) e e2e com playwright-core + Edge (`scripts/e2e/*.cjs`, precisam de `npx vite preview --port 4173`).
- Comandos: `npm run dev`, `npm run build`, `npx tsc --noEmit`, `npm run sync:data`, `npx tsx scripts/curate-effects.ts` (regenera `src/effects/*.json`).
- Backend opcional separado: `Fushyki/Astralys-BackEnd` (FastAPI + SQLAlchemy + JWT), em `C:\Users\dabiv\Astralys-BackEnd`. Sem `VITE_API_URL` o site é 100% local (localStorage).

## Regras de ouro (o dono exige)
- **Nunca inventar número de jogo.** Todo número vem do Lunaris (api.lunaris.moe), de `src/effects/` (com `fonte_info`) ou do GO (MIT). Se a regra for ambígua, perguntar.
- Fórmulas de reação: camada `libs/gi/wr` do GO (não a `libs/gi/formula`, que está em migração).
- Trabalho vai para a `main` após testes (o dono autorizou merge/push direto; sem PRs). Rodar só os testes relacionados; suíte completa antes de mesclar.
- Há sessões paralelas de IA no mesmo repositório: usar worktree ou conferir `git status` antes de mexer; ao mesclar, conferir trabalho repetido e ficar com o melhor.
- Cuidado com escapes em scripts gerados via shell (`\d` e `\n` viraram bugs três vezes): preferir o editor de arquivos.

## Arquitetura (pastas)
- `src/engine/`: motor de dano **puro, sem React**, roda em Web Worker. `damage.ts`, `reactions.ts`, `stats.ts` (blocos de stats por fonte, buffs de time por etiqueta), `team.ts` (`assembleTeam`), `rotation.ts` (`evaluateRotation`), `project.ts` (formato salvo + `resolveProject`), `hitLimits.ts`, `damageTable.ts`, `attribution.ts`, `pieces.ts`, `compat/planilha.ts` (modo planilha = gabarito DPS 216.600).
- `src/data/generated/`: JSON do Lunaris (136 personagens, 1786 golpes, 257 armas, 66 sets). Não editar à mão.
- `src/effects/`: efeitos numéricos curados (armas, sets, passivas, constelações). Gerados por `scripts/curation/*.ts` + `curate-effects.ts`; cada `expect` trava se o texto do Lunaris mudar.
- `src/features/`: lógica de tela pura e testada (`rotation`, `character`, `optimizer`, `card`, `vault`, `good`, `enka`, `team`, `compare`, `energy`).
- `src/screens/`: telas. `src/design/`: tokens (`tokens.css`) e componentes base (`Panel`, `Button`...). `src/online/`: conta/sync opcional.
- Plano e decisões: `CLAUDE.md` (detalhado), `docs/DECISOES_PENDENTES.md`, `docs/ESTUDO_GENSHIN_OPTIMIZER.md`.

## Telas e navegação
Menu geral: **Times · Personagens · Inventário · Ferramentas**. Dentro de um time, 3 passos: **1 Equipe → 2 Personagens → 3 Rotação e buffs** (barra de passos no rodapé, "Gerar card").
- **Times (`/vault`)**: cada time é um card; seletor global "Card dos times" (4:5, 16:9, 9:16: 4:5 em 4 por linha, 16:9 em 2, 9:16 limitado à altura da tela); filtros (busca, personagem, elemento, favoritos); menu ⋯ com Abrir, **Copiar card** (imagem para a área de transferência), Editar card, Comparar, Compartilhar (link público), Duplicar, Renomear, Exportar (arquivo do time), Apagar.
- **Equipe (`/projeto/:id`)**: 4 cartões com arma, 5 artefatos (imagem), stats, dano e participação; "Buffs recebidos" com interruptor por buff, stacks escolhidos pelo usuário e **elementos da reação** (Scroll of the Hero of Cinder City e Sombra Esverdeada).
- **Personagem (`/projeto/:id/personagem/:nome`)**: abas Resumo e build · Talentos · Otimizar · Avançado. Avançado: tabela de dano, comparar build atual × melhor/segunda melhor, e **clicar num golpe abre o cálculo do dano** (fórmula com a fonte de cada fator; copiar como texto).
- **Otimizar**: otimizador de artefatos EXATO (alvo: dano do time, do personagem, de um golpe, buff ou stat; mínimos; filtros; até 6 workers). Mesmo cálculo do motor.
- **Rotação e buffs (`/projeto/:id/rotacao`)**: golpes, linha do tempo SVG (arrastar, janelas de buff, linha amarela), buffs no time por faixa, golpe selecionado (números: dano base, ATK, Proficiência, crítico, bônus, DEF, RES; dano de cada execução dos contínuos; **desligar um buff só para um golpe**), "Criar buff manual", **limite "só os N primeiros golpes"** em qualquer janela, sequência com coluna Dano.
- Outras: Personagens (`/personagens`), Inventário (importar GOOD ou UID do Enka), Armas e constelações, Recarga (com e sem time), Comparar A/B, Card (`/card/:id`), Entrar, Público (`/p/:id`).

## Funções principais (resumo)
- Motor: dano direto, amplificadoras (Derreter/Vaporizar), aditivas (Propagar/Intensificar), transformativas, Lunar/Estelar parcial, dano fixo com stacks por golpe, crítico por tipo de golpe, `baseMultByType` (multiplica o dano base: Skirk A4), ressonâncias, conversões de stat, regras de composição de time, buffs com decaimento (Mavuika A4).
- Cobertura de efeitos: todas as armas 4/5★, 66 sets e passivas/constelações dos 136 personagens classificados (no cálculo / parcial / sem efeito no dano / nível de talento).
- Importar: planilha .xlsx, JSON de projeto, **compartilhar rotação** (.astralys-rotacao.json), inventário GOOD (GO), UID (Enka via backend).
- Cards (3 formatos): rotação em faixas por personagem com o instante real de cada golpe, set de artefatos (imagem, nome, 2p/4p), identidade "Constelação" no 9:16. Só copiar (sem baixar).
- Conta opcional (JWT) com sincronização e link público; sem API configurada tudo é local.
- Desempenho: otimizador 3 a 10× mais rápido (time montado uma vez por set, cache de stats).

## Pendências e ideias conhecidas
- **Mavuika/Supremo**: otimizador usa Espírito Lutador no máximo (200) e a rotação usa os pontos digitados (0 por padrão em ação nova): decidir padrão 200 e/ou campo no otimizador. Decaimento do A4 com seletor abaixo de 10 pode estar lento (conferir regra no jogo).
- **Skirk**: o Rift (+20% de DMG Normal nos 10 primeiros golpes) não está nos dados; hoje se cria como buff manual com limite. Candidato a curadoria.
- Scroll no modo planilha é buff fixo de 40%; fora dele há duplicata se o usuário mantém os extras manuais.
- Lunar/Estelar, Moonsign e Hexerei parciais; faltam efeitos de golpes extras que dependem de outros personagens.
- Fase 4 visual: tokens enxutos feitos (171 hex trocados), faltam o componente único de Card, 68 hex e 16 gradientes; mockups em `Downloads/Astralys — ideias de tela.html` (7 telas "estelar").
- Otimizador: alvo "time/personagem" ainda avalia a rotação inteira por candidato (próximo ganho exige avaliação incremental).
- Strix (pentest) só no fim, em localhost, com LLM que não seja o Claude.

## Como pedir trabalho a um agente (boas práticas neste repo)
Dar o arquivo/tela alvo, o resultado esperado, os números de referência (ex.: fórmula do GO colada) e exigir: testes (Vitest) para lógica nova, e2e da tela mexida, `npx tsc --noEmit` limpo e commit em português. Para comparações com o GO, pedir fator por fator (ATK, bônus, crítico, DEF, RES, reação) antes de mexer no motor.
