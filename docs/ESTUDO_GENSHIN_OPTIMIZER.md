# Como o Genshin Optimizer (GO) otimiza artefatos, e como o Astralys vai fazer

Estudo feito lendo o código do GO (`frzyc/genshin-optimizer`, MIT): `libs/gi/solver` (o solver), `libs/gi/db/.../OptConfigDataManager.ts`
(as configurações) e `libs/gi/page-team/.../TabOptimize` (a tela). Nada foi copiado: aqui está o que ele faz e o que adotamos.

## 1. O que o usuário configura no GO ("OptConfig")

| Configuração | O que faz | No Astralys |
| --- | --- | --- |
| **Alvo de otimização** | Qualquer número do personagem: um golpe, uma reação, um stat, ou uma rotação "multi-alvo" | Dano do **time** na rotação (padrão) ou só do personagem |
| **Nível dos artefatos** (`levelLow`/`levelHigh`) | Só entram peças nessa faixa de nível | Igual (0 a 20) |
| **Main stats** (`mainStatKeys`) | Quais atributos principais Areia, Cálice e Tiara podem ter | Igual, por posição |
| **Sets** (`artSetExclusion`) | Por set: omitir 2 peças e/ou 4 peças; e `rainbow` (peças sem set) | Permitir 4 peças, 2+2 e "sem set"; escolher os sets |
| **Filtros de stat** (`statFilters`) | Mínimos (e máximos) de stats finais, ex.: Recarga ≥ 150% | Mínimos de Recarga, Maestria, Taxa e Dano Crítico, HP, ATK, DEF |
| **Peças equipadas em outros** (`excludedLocations`) | Quais personagens "emprestam" as peças que estão usando | Desligado por padrão; liga por personagem |
| **Peças excluídas** (`artExclusion`) | Peças específicas fora da busca | Igual |
| **Melhores a mostrar** (`maxBuildsToShow`) | 1 a 10, padrão 5 | Igual |
| **Nível assumido do main stat** (`mainStatAssumptionLevel`) | Calcula como se as peças fossem +20 | O motor já assume +20 |
| **Permitir parcial** (`allowPartial`) | Builds com menos de 5 peças | Fora da primeira versão |
| **Gráfico** (`plotBase`) | Dano × um stat | Fora da primeira versão |
| **Lista gerada** | Guarda os builds e a data | Guardamos o último resultado por personagem |

Na tela, o GO mostra: o alvo, os cartões de filtro, o botão **Gerar builds**, o progresso (testados, descartados e por segundo), a lista dos
melhores e a comparação com o build atual. Fica dentro do personagem do time, porque o dano depende dos buffs do time.

## 2. O algoritmo (por que ele é rápido e exato)

O número de combinações de 5 peças explode (cada posição tem 100+ artefatos num inventário real). O GO não testa todas:

1. **Filtra** o inventário (nível, main stat, locais, peças excluídas).
2. **Compacta** cada artefato em um vetor de números (valor do main stat + substats) e **reafina** a fórmula de dano: a parte que é soma
   simples dos stats das peças vira um vetor só.
3. **`pruneOrder` (dominância):** uma peça sai se existirem `topN` outras na mesma posição que são **melhores ou iguais em todos os stats**
   (e que podem trocar de lugar sem quebrar as regras de set). Ela nunca estará entre os melhores builds.
4. **`pruneArtRange` (intervalos):** para cada peça, calcula o **maior** valor possível de cada restrição somando o melhor das outras posições. Se nem
   assim a peça atinge o mínimo (ex.: Recarga mínima), ela sai.
5. **`pruneNodeRange`:** simplifica a própria fórmula quando um valor já está decidido (por exemplo, o bônus de 4 peças que nunca ativa).
6. **BNB (branch and bound):** divide o espaço em blocos (por set ou por valor de um stat). Para cada bloco calcula um **limite superior**
   (o melhor dano que qualquer build do bloco poderia ter) com uma aproximação linear/polinomial. Se o limite é menor que o N-ésimo melhor
   build já achado, o bloco inteiro é descartado sem testar. O limiar sobe conforme melhores builds aparecem.
7. Blocos pequenos (até 32 milhões de combinações) são testados **por força bruta**, em **vários Web Workers** em paralelo.
8. Junta os resultados dos workers (`mergeBuilds`), ordena e mostra os `topN`.

Garantia: o resultado é **exato** (o melhor de verdade), porque todo descarte é feito por limite superior ou por dominância.

## 3. O que o Astralys vai fazer (mesma ideia, adaptada ao nosso motor)

Nosso dano vem do motor (`evaluateRotation`), que é uma caixa preta e **monótona** (mais stat nunca piora o dano). Isso permite os mesmos descartes:

1. **Filtros** iguais aos do GO (acima).
2. **Dominância por posição e set** (igual ao `pruneOrder`): sobra uma lista curta por posição.
3. **Subproblemas fixos:** cada combinação de (configuração de set) × (main stat de Areia, Cálice e Tiara) vira um subproblema em que o bônus de set e
   o main stat são conhecidos. Dentro dele o dano só varia pelos substats, que somam.
4. **Limite superior exato:** para uma construção parcial, completa as posições que faltam com uma "peça virtual" que tem o **maior valor de cada
   substat** entre as candidatas. Esse build virtual tem dano maior ou igual a qualquer build real do bloco.
5. **BNB:** busca em profundidade ordenando as peças pelas melhores primeiro, com o limiar do N-ésimo melhor build (começando pelo build equipado).
6. **Mínimos de stat:** se o build virtual já não atinge o mínimo, o bloco sai.
7. **Prova de exatidão:** testes comparam o resultado com a força bruta em inventários pequenos (aleatórios e o seu arquivo).
8. **Web Worker** (a tela não trava), com progresso (testados, descartados, por segundo) e botão para parar.

Diferenças assumidas: o GO calcula a fórmula inteira de forma simbólica; nós usamos o motor como avaliador. O GO assume a fórmula dele; nós usamos o
nosso gabarito (a planilha). Efeitos que o motor ainda não modela também não entram na otimização (aparecem como "fora do cálculo").
