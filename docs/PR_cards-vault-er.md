# PR: cofre de projetos, card infográfico, calculadora de recarga e remoção da interface antiga

Branch: `v2/cards-vault-er` (sai de `v2/core`). Abrir em: https://github.com/Fushyki/Astralys/pull/new/v2/cards-vault-er

## O que muda
- **Cofre "Meus projetos"** (`/rotacao`): cartões com retratos, participação no dano, DPS e DPR; importa a planilha `.xlsx` (a de referência dá DPS 216.600) e JSON; duplica, renomeia, exporta e apaga.
- **Card infográfico** (`/rotacao/:id/card`): gerado do projeto, 16:9 ou 9:16, título/selo/etiqueta editáveis, PNG 2x com as fontes embutidas.
- **Calculadora de recarga** (`/rotacao/:id/recarga`): ER necessária por personagem contra a ER real do build; "Usar como ER mínimo" grava no build. O motor (`engine/energy.ts`) reproduz os 202,2% / 205,2% / 185,7% do app antigo.
- **Build e rotação**: build em três colunas, tabela de dano por personagem, otimizador interativo (curva de dano × rolls em crítico), mapa de calor de +1 roll e comparação de armas.
- **Dano das reações** (transformativas, Lunares e Estelares) na tabela de dano e **comparar dois projetos** (`/comparar`).
- **Página inicial nova** e **remoção da interface antiga** (App, components, engines, services, context, types, Tailwind e os testes dela).

## Como testar
```
npm ci
npx tsc --noEmit
npm test            # 431 testes
npm run build
npx vite preview --port 4173   # em outro terminal
npm run e2e         # 6 roteiros em navegador real (rotação, equipe, cofre, card, recarga, comparar)
```

## Decisões que precisam de você
Ver `docs/DECISOES_PENDENTES.md` (partículas da tabela antiga não verificadas, atalho da Raiden removido, imagens vindas do CDN do Lunaris, login fora por enquanto).

## Ainda não feito
Constelações/refinamentos no custo-benefício (faltam efeitos numéricos), rótulos dos golpes em português (o Lunaris tem textos em pt; falta sincronizar e casar com os golpes), importador GOOD e otimizador de artefatos reais, Strix (por último, sem Claude), deploy do backend (SECRET_KEY etc.).
