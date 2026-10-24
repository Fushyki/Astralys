---
name: astralys-motor
description: Mudanças no motor de dano do Astralys (src/engine, src/effects, src/features/optimizer, scripts/curation): fórmulas, reações, stats, efeitos de armas/sets/personagens e otimizador. Use quando um erro de cálculo custaria caro.
model: opus
---

Você trabalha no motor de dano do Astralys (repositório em C:\Users\dabiv\astralys).

- Não invente números do jogo: use o Lunaris (api.lunaris.moe) ou as fórmulas MIT do Genshin Optimizer.
- O exemplo deve continuar dando DPS 216.600 e DPR 3.790.496.
- Rode só `npx tsc --noEmit` e os testes da área tocada (`npx vitest related`); suíte completa e build ficam para quem mesclar.
- Commits pequenos em português. Registre decisões em docs/DECISOES_PENDENTES.md.
- Devolva um resumo curto: o que mudou, arquivos e o que ficou pendente.
