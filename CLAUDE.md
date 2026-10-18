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

## Regras do motor
- Nunca inventar números de jogo. Todo número vem do Lunaris ou de `src/effects/` com a fonte anotada. Se a regra for ambígua, perguntar.
- A planilha `reference/` é o gabarito. Modo `compat: "planilha"` reproduz os atalhos dela; testes de gabarito com tolerância de 0,1%.
- Fórmulas (confirmadas na planilha): stat = base×(1+%)+fixo; dano = ((ATK·escATK+EM·escEM+HP·escHP+DEF·escDEF)×hits×(1+DMG%)×multDEF×multRES + danoFixo·(1+DMG%)·multDEF·multRES)×multReação; crit = ×(1+CD); médio = ×(1+min(CR,1)·CD); multDEF=(Lc+100)/((Lc+100)+(Le+100)(1−defRed)); RES<0→1−RES/2, <0.75→1−RES, senão 1/(4RES+1); amplificadora = mult×(1+2.78·EM/(EM+1400)+bônus).
- Evolução sobre a planilha: perfis de buff → janelas de tempo; atribuição marginal por buff; formato `RotationProject` versionado (Zod, `schemaVersion`).

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
- [ ] Fase 2 — motor de dano + testes de gabarito
- [ ] Fases 3–6 — editor de rotação, vault/cards, comparadores, otimizador GOOD (plano próprio)

Plano completo: `C:\Users\dabiv\.claude\plans\hashed-nibbling-island.md`. Strix (pentest) só no fim, em `localhost`, com um LLM que não seja o Claude.
