# Comparação completa com o Genshin Optimizer (Issue #49)

GO no commit `39eccbe`. 122 personagens com ficha (os Viajantes não têm). Nível 90, talentos 10, melhor arma **sem passiva**, sem conjunto,
com as condições do próprio personagem ligadas no máximo e sem buffs dos colegas. Cada número é "golpes que batem (±0,3%) / golpes comparados".

**Diferença nem sempre é erro.** Causas conhecidas do comparador: ele marca todas as janelas em todos os golpes (buffs de um estado entram em golpes
fora dele); liga buffs nossos para os quais o GO não tem condição (ex.: Ayaka A4, Yoimiya A1, Wanderer A1); e golpes com nomes diferentes nas duas fontes
ficam "sem par". Cada linha precisa ser conferida no texto do jogo antes de mudar.

## Corrigidos neste lote
Neuvillette (A1 só no Julgamento Equitativo), Lyney (Prop Surplus), Shikanoin Heizou (Declension e Conviction), Raiden Shogun (Resolve), Chevreuse (A4
também nela), Gorou (DEF do Estandarte), Wanderer e Yoimiya (multiplicador de Normal no estado), Sangonomiya Kokomi (Água-viva por HP).
Lote 2: Xianyun (Starwicker só na onda de choque e na Driftcloud Wave), Linnea (RES extra do Ascendant Gleam), Xilonen (A1 depende do time), Freminet (A4 só no
Shattering Pressure; gelo no modo do Supremo), Chasca (A1 só no projétil brilhante).
Corrigidos antes (#46, #47): Zibai, Illuga, Skirk, Mavuika.

## Pendências conhecidas (precisam de mecanismo novo ou de decisão)
- Bônus que depende de recurso e não é % do ATK: Nefer (Veils no Supremo e Phantasm), Lauma (Verdant Dew), Lohen (Will to Win).
- Albedo (Blossom com inimigo abaixo de 50% de HP), Nahida (Supremo com Pyro, Electro ou Hydro no time), Jahoda (elemento mais numeroso).
- Raiden (bônus da habilidade no Supremo depende do custo de cada receptor), Sangonomiya Kokomi (A4 por bônus de cura).
- Iansan: o bônus de ATK do Supremo está só para os outros; o GO o dá também a ela quando é a ativa.

## Com diferença em C0 (31), da maior para a menor
| Personagem | C0 | Diferença em C0 (nosso − GO) | C6 |
|---|---|---|---|
| Kinich | 7/12 (5 diferem) | -50% a 246% | 6/14 (6 diferem) (2 sem par) |
| Varka | 5/20 (3 diferem) (12 sem par) | -17% a 186% | 3/21 (5 diferem) (13 sem par) |
| Lauma | 10/11 (1 diferem) | -54% a -54% | 12/13 (1 diferem) |
| Nefer | 9/16 (7 diferem) | -45% a -19% | 9/18 (7 diferem) (2 sem par) |
| Vesna | 14/22 (4 diferem) (4 sem par) | -37% a -37% | 15/25 (4 diferem) (6 sem par) |
| Lohen | 8/20 (10 diferem) (2 sem par) | -32% a -7% | 9/21 (10 diferem) (2 sem par) |
| Mika | 3/12 (9 diferem) | 40% a 40% | 3/12 (9 diferem) |
| Iansan | 0/10 (9 diferem) (1 sem par) | -28% a 23% | 0/10 (9 diferem) (1 sem par) |
| Arlecchino | 9/14 (5 diferem) | -28% a -6% | 8/15 (7 diferem) |
| Wriothesley | 10/11 (1 diferem) | 34% a 34% | 5/12 (6 diferem) (1 sem par) |
| Navia | 11/13 (1 diferem) (1 sem par) | -23% a -23% | 11/14 (1 diferem) (2 sem par) |
| Jahoda | 13/14 (1 diferem) | -23% a -23% | 13/14 (1 diferem) |
| Aloy | 4/12 (7 diferem) (1 sem par) | 16% a 20% | 4/12 (7 diferem) (1 sem par) |
| Sangonomiya Kokomi | 5/9 (4 diferem) | -16% a -9% | 0/10 (9 diferem) (1 sem par) |
| Nahida | 10/11 (1 diferem) | -15% a -15% | 8/12 (3 diferem) (1 sem par) |
| Vodyanitsa | 10/11 (1 diferem) | -15% a -15% | 10/11 (1 diferem) |
| Mitya | 11/14 (2 diferem) (1 sem par) | 2% a 17% | 13/16 (3 sem par) |
| Durin | 8/14 (3 diferem) (3 sem par) | 3% a 17% | 0/14 (11 diferem) (3 sem par) |
| Cyno | 15/21 (4 diferem) (2 sem par) | 6% a 16% | 15/21 (4 diferem) (2 sem par) |
| Raiden Shogun | 11/21 (7 diferem) (3 sem par) | -14% a -14% | 11/21 (7 diferem) (3 sem par) |
| Shenhe | 0/13 (13 diferem) | 9% a 15% | 0/13 (13 diferem) |
| Wanderer | 0/10 (9 diferem) (1 sem par) | 15% a 15% | 0/11 (9 diferem) (2 sem par) |
| Albedo | 11/13 (1 diferem) (1 sem par) | -12% a -12% | 0/14 (12 diferem) (2 sem par) |
| Yoimiya | 4/13 (9 diferem) | 14% a 14% | 4/13 (9 diferem) |
| Xiao | 0/11 (11 diferem) | 10% a 13% | 0/11 (11 diferem) |
| Kamisato Ayaka | 9/12 (3 diferem) | 12% a 12% | 9/14 (3 diferem) (2 sem par) |
| Faruzan | 8/12 (4 diferem) | 2% a 7% | 8/12 (4 diferem) |
| Furina | 13/14 (1 diferem) | 7% a 7% | 13/14 (1 diferem) |
| Sigewinne | 10/12 (2 diferem) | -6% a -6% | 10/12 (2 diferem) |
| Nilou | 15/16 (1 diferem) | 4% a 4% | 6/16 (4 diferem) (6 sem par) |
| Alhaitham | 11/14 (1 diferem) (2 sem par) | 2% a 2% | 11/14 (1 diferem) (2 sem par) |

## Só com golpes sem par em C0 (34)
| Personagem | C0 | Diferença em C0 (nosso − GO) | C6 |
|---|---|---|---|
| Kaeya | 10/11 (1 sem par) |  | 10/11 (1 sem par) |
| Razor | 12/13 (1 sem par) |  | 13/14 (1 sem par) |
| Xingqiu | 9/11 (2 sem par) |  | 9/11 (2 sem par) |
| Bennett | 13/14 (1 sem par) |  | 14/15 (1 sem par) |
| Tartaglia | 23/25 (2 sem par) |  | 23/25 (2 sem par) |
| Qiqi | 12/14 (2 sem par) |  | 0/14 (12 diferem) (2 sem par) |
| Diona | 13/14 (1 sem par) |  | 13/14 (1 sem par) |
| Keqing | 13/15 (2 sem par) |  | 14/16 (2 sem par) |
| Rosaria | 9/12 (3 sem par) |  | 9/12 (3 sem par) |
| Hu Tao | 12/13 (1 sem par) |  | 12/13 (1 sem par) |
| Kaedehara Kazuha | 12/15 (3 sem par) |  | 12/15 (3 sem par) |
| Yanfei | 13/14 (1 sem par) |  | 14/14 |
| Eula | 15/17 (2 sem par) |  | 14/18 (4 sem par) |
| Yae Miko | 12/15 (3 sem par) |  | 0/15 (12 diferem) (3 sem par) |
| Shikanoin Heizou | 11/12 (1 sem par) |  | 11/12 (1 sem par) |
| Kirara | 11/13 (2 sem par) |  | 6/14 (6 diferem) (2 sem par) |
| Yun Jin | 11/13 (2 sem par) |  | 11/13 (2 sem par) |
| Kuki Shinobu | 10/13 (3 sem par) |  | 10/14 (4 sem par) |
| Dori | 10/11 (1 sem par) |  | 11/12 (1 sem par) |
| Candace | 11/12 (1 sem par) |  | 12/13 (1 sem par) |
| Layla | 9/10 (1 sem par) |  | 8/10 (1 diferem) (1 sem par) |
| Yaoyao | 10/11 (1 sem par) |  | 11/12 (1 sem par) |
| Lynette | 11/13 (2 sem par) |  | 11/13 (2 sem par) |
| Chevreuse | 13/14 (1 sem par) |  | 14/15 (1 sem par) |
| Sethos | 9/10 (1 sem par) |  | 9/10 (1 sem par) |
| Kachina | 10/11 (1 sem par) |  | 7/12 (3 diferem) (2 sem par) |
| Lan Yan | 9/11 (2 sem par) |  | 9/11 (2 sem par) |
| Yumemizuki Mizuki | 11/13 (2 sem par) |  | 0/15 (11 diferem) (4 sem par) |
| Escoffier | 10/11 (1 sem par) |  | 11/12 (1 sem par) |
| Dahlia | 8/10 (2 sem par) |  | 8/10 (2 sem par) |
| Prune | 11/12 (1 sem par) |  | 0/13 (11 diferem) (2 sem par) |
| Sandrone | 15/18 (3 sem par) |  | 18/23 (5 sem par) |
| Alyosha | 11/12 (1 sem par) |  | 0/12 (11 diferem) (1 sem par) |
| Odette | 14/21 (7 sem par) |  | 8/25 (6 diferem) (11 sem par) |

## Todos os golpes batem em C0 (57)
| Personagem | C0 | Diferença em C0 (nosso − GO) | C6 |
|---|---|---|---|
| Jean | 12/12 |  | 12/12 |
| Lisa | 14/14 |  | 14/14 |
| Barbara | 9/9 |  | 9/9 |
| Diluc | 15/15 |  | 12/15 (3 diferem) |
| Amber | 13/13 |  | 14/14 |
| Venti | 15/15 |  | 15/16 (1 diferem) |
| Xiangling | 14/14 |  | 12/15 (3 diferem) |
| Beidou | 13/13 |  | 13/13 |
| Ningguang | 8/8 |  | 8/8 |
| Klee | 10/10 |  | 0/12 (10 diferem) (2 sem par) |
| Zhongli | 14/14 |  | 14/14 |
| Fischl | 15/15 |  | 17/19 (1 diferem) (1 sem par) |
| Noelle | 12/12 |  | 13/13 |
| Chongyun | 12/12 |  | 13/13 |
| Ganyu | 15/15 |  | 15/15 |
| Mona | 12/12 |  | 12/12 |
| Sucrose | 11/11 |  | 10/11 (1 diferem) |
| Xinyan | 13/13 |  | 0/13 (13 diferem) |
| Thoma | 11/11 |  | 11/11 |
| Sayu | 16/16 |  | 12/16 (4 diferem) |
| Gorou | 12/12 |  | 12/12 |
| Kujou Sara | 13/13 |  | 14/14 |
| Arataki Itto | 11/11 |  | 11/11 |
| Yelan | 13/13 |  | 15/15 |
| Kamisato Ayato | 14/14 |  | 10/15 (5 diferem) |
| Collei | 13/13 |  | 14/14 |
| Tighnari | 14/14 |  | 14/15 (1 sem par) |
| Dehya | 14/14 |  | 13/15 (1 diferem) (1 sem par) |
| Kaveh | 11/11 |  | 12/12 |
| Baizhu | 10/10 |  | 11/11 |
| Lyney | 15/15 |  | 16/16 |
| Freminet | 15/15 |  | 15/15 |
| Neuvillette | 12/12 |  | 12/13 (1 sem par) |
| Charlotte | 14/14 |  | 15/15 |
| Gaming | 11/11 |  | 11/11 |
| Xianyun | 14/14 |  | 14/14 |
| Chiori | 12/12 |  | 13/14 (1 sem par) |
| Clorinde | 16/16 |  | 18/18 |
| Emilie | 14/14 |  | 13/15 (2 sem par) |
| Mualani | 9/9 |  | 8/9 (1 diferem) |
| Xilonen | 14/14 |  | 7/14 (7 diferem) |
| Chasca | 16/16 |  | 16/16 |
| Ororon | 12/12 |  | 7/14 (4 diferem) (3 sem par) |
| Mavuika | 20/20 |  | 22/22 |
| Citlali | 11/11 |  | 12/12 |
| Varesa | 19/19 |  | 16/19 (1 diferem) (2 sem par) |
| Ifa | 10/10 |  | 11/11 |
| Skirk | 20/20 |  | 10/24 (11 diferem) (3 sem par) |
| Ineffa | 12/12 |  | 14/14 |
| Flins | 21/21 |  | 17/22 (4 diferem) (1 sem par) |
| Aino | 11/11 |  | 12/12 |
| Columbina | 14/14 |  | 3/14 (11 diferem) |
| Zibai | 18/18 |  | 17/19 (1 diferem) (1 sem par) |
| Illuga | 11/11 |  | 12/12 |
| Linnea | 11/11 |  | 8/11 (3 diferem) |
| Nicole | 9/9 |  | 0/9 (9 diferem) |
| Valeriy | 11/11 |  | 10/13 (1 diferem) (2 sem par) |
