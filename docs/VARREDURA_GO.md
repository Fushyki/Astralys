# Varredura contra o Genshin Optimizer (Issue #40)

GO no commit `39eccbe` (22/11/2026). Cada um dos 136 personagens nível 90, talentos 10, sem arma nem artefatos, C0 e C6, sem ligar condições no GO.
Ferramenta: `scripts/go-piloto/`. Nada no cálculo foi alterado.

## Situação (Issue #41)

Feito: item 1 (menos Gaming, Xianyun, Chasca, Varesa e Iansan), item 3 (Maestria base como buff `base-em`) e item 4 (os 24 buffs de elemento; tabela `ELEMENT_ONLY` em `scripts/curate-effects.ts`).
Depois das correções (C0): 1609 de 1786 golpes batem; 88 personagens sem diferença. Tighnari (Wreath e Clusterbloom) e Clorinde (Swift Hunt, Impale the Night) passaram a receber bônus ligados por padrão.
Falta: Furina A4 no Ousia Bubble e os itens de motor (2, 6 e Tartaglia); Gaming, Xianyun, Chasca e Varesa precisam de bônus limitado a golpe; Iansan "Swift Stormflight" depende de decidir entre a planilha (Normal) e o GO (Carregado).
Kazuha A4 e Sucrose C6 agora só chegam a personagens Pyro, Hydro, Electro ou Cryo; golpes Anemo do próprio Kazuha que na prática são do elemento absorvido deixam de receber.

## Números (C0, com HP/ATK/DEF base igualados aos do GO para isolar o resto)

1781 golpes: 1582 batem (±0,25%), 129 só batem com os nossos buffs removidos, 70 não batem. 85 personagens sem diferença.
C6: 1471 batem, 175 só sem buffs, 135 não batem (**as diferenças novas do C6 não foram analisadas**).
Nenhum erro real de multiplicador de talento apareceu (os 177 "fora do GO" do relatório são do Viajante e de um golpe da Columbina, com dano igual).

## 1. Categoria do golpe errada (bônus de Normal/Carregado/Habilidade/Supremo/Imersivo vai no golpe errado)

Causa: `hitTypeFor` em `scripts/lib/parse.ts:150` (todo golpe do talento Normal vira `normal`; todo "N-Hit" de habilidade/supremo vira `normal`).
Corrigir ali, rodar `npm run sync:data` e rever os buffs curados que miram `hitTypes` desses golpes.

| Personagem | Golpes | Hoje → GO |
|---|---|---|
| Raiden Shogun | golpes e quedas do Supremo | normal/plunge → burst |
| Diluc | 3 golpes da habilidade | normal → skill |
| Xiangling | 3 golpes do Supremo | normal → burst |
| Nilou | passos da habilidade | normal → skill |
| Zibai | Spirit Steed's Stride 1-Hit; Supremo 1-Hit | normal → skill / burst |
| Lauma | 1-Hit e 2-Hit Hold (por isso o A4 não entra); Spiritcall Prayer | normal → skill; normal → charged |
| Nefer | 1-Hit e 2-Hit do Supremo (conferido no código da ficha) | normal → burst |
| Ganyu | Frostflake Arrow e Bloom | normal → charged |
| Yoimiya | Kindling Arrow | normal → charged |
| Tighnari | Wreath e Clusterbloom Arrow | normal → charged |
| Yelan | Breakthrough Barb | normal → charged |
| Ningguang | DMG per Star Jade | normal → charged |
| Arataki Itto | Kesagiri (combo e final), Saichimonji | normal → charged |
| Sigewinne | Mini-Stration Bubble | normal → charged |
| Iansan | Swift Stormflight | normal → charged |
| Sandrone | dano em Power Overdrive | normal → charged |
| Mitya | Gradient Detonation | normal → charged |
| Valeriy | Direct-Fire Mortar | normal → charged |
| Candace | Charged Up | charged → skill |
| Chevreuse | Overcharged Ball | charged → skill |
| Chasca | Multitarget Fire Tap; Shadowhunt Shells | skill → normal; skill → charged |
| Clorinde | Swift Hunt, Impale the Night | skill → normal |
| Mualani | Sharky's Bite Base | skill → normal |
| Ifa | Tonicshot | skill → normal |
| Gaming | Charmed Cloudstrider | skill → plunging |
| Xianyun | Driftcloud Wave | skill → plunging |
| Varesa | Volcano Kablam | burst → plunging |
| Kinich | Mid-Air Normal Attack | normal → plunging |

Descartados como provável coincidência de valor: Kaeya e Viajante Lumine (Carregado), Flins 4-Hit, Kinich Plunge.

## 2. Elemento do golpe errado

Regra em `src/engine/kitElement.ts` (**motor: branch e aprovação**).

- Ganyu "Aimed Shot Charge Level 1": Físico → Cryo
- Sethos "Aimed Shot Charge Level 1": Físico → Electro
- Tighnari "Level 1 Aimed Shot": Físico → Dendro
- Valeriy "Direct-Fire Mortar": Físico → Electro
- Xinyan "Skill DMG" do Supremo: Pyro → Físico
- Eula "Lightfall Sword Base DMG": Cryo → Físico
- Freminet "Level 4 Shattering Pressure": Cryo → Físico
- Chasca (Shining Shadowhunt e Radiant Soulseeker Shell), Ifa (Sedation Mark), Prune (Clang Clang!): saem Anemo; no jogo saem no elemento absorvido (depende do time).

## 3. Bônus de um elemento aplicado a todo o dano

Falta `forElements` na curadoria (`scripts/curation/characters*.ts`, depois `npx tsx scripts/curate-effects.ts`). O motor já suporta.
Confirmados pelo cálculo: Xingqiu A4, Raiden A4, Arlecchino A4, Varka A1. Os outros vêm da leitura das notas.

- Afetam golpes Físicos ou de outro elemento do próprio dono (15): Raiden a4, Hu Tao a4, Ayaka a4, Xingqiu a4, Diluc a4, Chiori a4, Keqing c6, Alhaitham c4d, Yoimiya a1 e c2, Tighnari c2, Cyno c2, Arlecchino a4, Sethos c2, Varka a1.
- Afetam o time inteiro (3), hoje o usuário precisa ligar só nos golpes do elemento certo: Kazuha a4, Sucrose c6 e c6hex. Ver se `forReacted` serve.
- Sem efeito prático hoje (catalisador, só o próprio dano) (6): Klee c6s, Mona a4, Kokomi c6, Baizhu a1, Yanfei a1 e c6.

## 4. Atributos base

`scripts/sync-data.ts` / `scripts/lib/parse.ts` (o nível 90 vem do Lunaris; `src/data/levels.ts` ancora nele).

- Aloy: nosso ATK 227, HP 10568, DEF 656; GO 233,9 / 10899 / 676.
- Viajante (14 variantes): nosso ATK 271,6, HP 11231, DEF 705; GO 263,4 / 10875 / 683 (com ascensão).
- Nefer e Mitya: faltam os 100 de Maestria base (nosso 0, GO 100).
- Arredondamento do Lunaris (ATK inteiro) dá até 0,4% em Hu Tao, Columbina, Vodyanitsa, Linnea e outros.

## 5. Passivas

- Furina A4 entra no Ousia Bubble (`scripts/curation/characters10.ts`); o GO não aplica. Ver se o formato limita buff a golpes (como `moveMult.labels`).
- Tartaglia: o +1 de nível de Ataque Normal do time não existe (formato/motor; nota `partial` já registrada).

## 6. Motor: buffs com janela entram em dano fixo e conversões mesmo desligados

`src/engine/rotation.ts:386` (`statsFor(src, 'all')`) e `src/engine/team.ts` passo 5b (`activeTeamDelta(..., 'all')`). Confirmado em:
Gorou (A1 +25% DEF aumenta o dano fixo sem janela) e Tighnari (A1 +50 Maestria entra no A4 sem janela). Vale para qualquer personagem com conversão ou
dano fixo por stat e um buff temporário desse stat. É decisão antiga ("stats de referência"). **Precisa de aprovação.**

## 7. Padrões diferentes (escolha nossa, não erro)

Ligamos por padrão, o GO deixa desligado: Furina (4 membros do Salon), Neuvillette (HP cheio), Lyney (inimigo sob Pyro), Yun Jin, Ayato, Cyno, Faruzan,
Xianyun, Sethos, Clorinde, Kinich, Mualani, Varesa, Kokomi (dentro do Supremo), Viajante (efeitos de Carregado) e Linnea (RES).
A conferir: Viajante Cryo soma o dano fixo do A1 em golpes que continuam Físicos, e a nota diz que a conversão para Cryo é o padrão.

## Não analisado

- Kits Estelares/Lunares e estados que exigem condição ligada no GO: Qiqi, Nefer (habilidade), Jahoda, Zibai, Linnea (habilidade), Sandrone, Mitya (Supremo), Vesna, Odette.
- Diferenças novas do C6; C1 a C5; condições ligadas; armas e artefatos.
- Limites da comparação: casa golpes por valor, não por nome; golpe que depende de condição aparece como diferença (absorção Anemo, stacks, totais somados).
