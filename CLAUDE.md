# Astralys

Ambiente de theorycrafting de Genshin Impact: monta rotações de time numa timeline, mostra de onde vem cada buff e quanto vale, guarda tudo num Vault e gera cards para partilhar. Meta: melhor que o Genshin Optimizer em times/rotações e mais legível que o GCSim.

Dono: Davi. UI em pt-BR. Commits em português. Trabalhar na branch `v2/core`, nunca direto no `main`.

## Stack
React 18 + Vite + TypeScript + Tailwind 3. Testes: Vitest (a migrar do runner caseiro em `tests/`). Backend separado: `Fushyki/Astralys-BackEnd` (FastAPI + SQLAlchemy + JWT), pasta `C:\Users\dabiv\Astralys-BackEnd`.

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
- LEGADO: `src/data/characters.ts` e `weapons.ts` (escritos à mão) continuam porque a UI antiga (ER, Dano, Comparador) ainda depende deles. Saem na Fase 3, quando a UI for reescrita sobre `generated/`. O ER (`burst_cost`, partículas) ainda vem do legado; o Lunaris tem `burst.energyCost`/`particles` para o substituir.

## Segurança
`.env` nunca no git (só `.env.example` com `VITE_API_URL`). Auth só e-mail+senha via JWT do backend; Supabase e login Google foram removidos (reintroduzir Google só com verificação de token no backend).

## Estado das fases
- [x] Fase 0 — higiene e segurança (frontend + backend). Branches `v2/core` enviadas; PRs por abrir. Backend: ver `Astralys-BackEnd` (testes: `pytest tests`, deps em `requirements-dev.txt`). Pendente: colunas `schemaVersion/revision/patch/tags` + Alembic ficam para a Fase 3.
- [x] Fase 1 — pipeline de dados (Lunaris → JSON + Zod). `npm run sync:data` gera `src/data/generated/` (136 personagens, 1786 golpes, 257 armas, 66 sets). Efeitos em `src/effects/` semeados da planilha. Ver "Dados" abaixo.
- [x] Fase 2 — motor de dano + gabarito. `src/engine/` cobre dano direto, amplificadoras, catalisadoras, transformativas, Lunares e Estelares; reproduz a planilha (DPR 3 790 496,07 / DPS 216 599,78) com tolerância 1e-9. Ver "Motor" abaixo.
- [ ] Fases 3–6 — editor de rotação, vault/cards, comparadores, otimizador GOOD (plano próprio)

Plano completo: `C:\Users\dabiv\.claude\plans\hashed-nibbling-island.md`. Strix (pentest) só no fim, em `localhost`, com um LLM que não seja o Claude.
