# Cobertura do kit (levantamento inicial)

Gerado por leitura de `src/data/generated/talents.json`, `weapons.json`, `artifacts.json` e dos efeitos em `src/effects/`. Nada foi alterado no cálculo.

**Como contei.** "Número" = cada valor numérico que aparece no texto de uma passiva, constelação, passiva de arma (R1) ou bônus de set (2 e 4 peças).
- **No cálculo**: o nó tem buff ou proc com o mesmo id/`src` em `src/effects/`. *Ainda não se sabe se o valor está certo nem se há teste de motor*: é a presença do efeito, não a prova (isso é a Fase 3).
- **Só exibido**: o efeito está registrado como `partial` (parte do dano fora do cálculo) ou nota "partial" no personagem.
- **Sem efeito no dano**: registrado como `utility`/`noDamage`.
- **Órfão**: tem número no texto e nenhum registro (nem buff, nem proc, nem nota).
Um nó com vários números conta todos no mesmo balde (granularidade por nó, não por número). Isso sobrestima "no cálculo" nos nós parciais.

## Resumo

| Fonte | No cálculo | Só exibido | Sem efeito no dano | Órfão |
|---|---|---|---|---|
| Personagens (passivas + constelações, 136) | 1777 (55%) | 229 (7%) | 583 (18%) | 615 (19%) |
| Armas (passiva R1, 240 com número) | 931 (90%) | 21 (2%) | 38 (4%) | 40 (4%) |
| Conjuntos (66) | 219 (83%) | 27 (10%) | 19 (7%) | 0 (0%) |

Parâmetros de talentos de combate (normal/habilidade/supremo), por rótulo do Lunaris: dano (motor): 13; energia/recarga/duração (energia e rotação): 672; cura/escudo/outros (só exibido): 339. Os de dano entram pelo motor (`moves.json`); os de cura, escudo, duração e afins não têm destino próprio hoje.

## Personagens
| Personagem | No cálculo | Só exibido | Sem efeito no dano | Órfão | Nós órfãos |
|---|---|---|---|---|---|
| Kamisato Ayaka | 13 | 0 | 3 | 4 | p2 p3 |
| Jean | 7 | 0 | 8 | 1 | p3 |
| Lisa | 4 | 2 | 5 | 3 | p2 p3 |
| Barbara | 6 | 0 | 9 | 1 | p3 |
| Kaeya | 5 | 2 | 9 | 1 | p3 |
| Diluc | 17 | 0 | 2 | 3 | p2 p3 |
| Razor | 17 | 0 | 3 | 5 | p3 p4 |
| Amber | 11 | 1 | 2 | 3 | p2 p3 |
| Venti | 17 | 0 | 3 | 5 | p3 p4 |
| Xiangling | 9 | 0 | 2 | 3 | p2 p3 |
| Beidou | 12 | 3 | 3 | 4 | p2 p3 |
| Xingqiu | 8 | 0 | 4 | 2 | p2 p3 |
| Xiao | 8 | 0 | 7 | 5 | p2 p3 |
| Ningguang | 4 | 0 | 3 | 2 | p2 |
| Klee | 19 | 6 | 1 | 10 | p4 |
| Zhongli | 4 | 0 | 7 | 4 | p2 p3 |
| Fischl | 15 | 0 | 0 | 6 | p3 p4 |
| Bennett | 6 | 2 | 5 | 1 | p3 |
| Tartaglia | 4 | 1 | 3 | 1 | p3 |
| Noelle | 10 | 0 | 9 | 1 | p3 |
| Qiqi | 6 | 0 | 19 | 4 | p4 |
| Chongyun | 7 | 0 | 4 | 4 | p2 p3 |
| Ganyu | 16 | 0 | 2 | 2 | p2 p3 |
| Albedo | 34 | 3 | 0 | 3 | p2 p3 |
| Diona | 15 | 0 | 6 | 5 | p3 p4 |
| Mona | 36 | 0 | 0 | 2 | p2 p3 |
| Keqing | 9 | 1 | 2 | 4 | p2 p3 |
| Sucrose | 16 | 0 | 8 | 5 | p2 p3 |
| Xinyan | 6 | 4 | 7 | 2 | p2 p3 |
| Rosaria | 11 | 0 | 2 | 8 | p2 p3 |
| Hu Tao | 15 | 0 | 0 | 3 | p2 p3 |
| Kaedehara Kazuha | 9 | 0 | 5 | 3 | p2 p3 |
| Yanfei | 10 | 0 | 4 | 0 |  |
| Yoimiya | 12 | 2 | 1 | 4 | p2 p3 |
| Thoma | 6 | 0 | 9 | 2 | p2 p3 |
| Eula | 10 | 4 | 1 | 1 | p3 |
| Raiden Shogun | 7 | 0 | 7 | 5 | p2 p3 |
| Sayu | 8 | 4 | 6 | 0 |  |
| Sangonomiya Kokomi | 8 | 1 | 6 | 3 | p3 p4 |
| Gorou | 10 | 0 | 7 | 2 | p2 |
| Kujou Sara | 6 | 1 | 6 | 1 | p3 |
| Arataki Itto | 8 | 4 | 6 | 2 | p2 p3 |
| Yae Miko | 28 | 0 | 0 | 2 | p2 p3 |
| Shikanoin Heizou | 6 | 0 | 8 | 3 | p2 p3 |
| Yelan | 20 | 0 | 0 | 6 | p2 p3 |
| Kirara | 8 | 0 | 11 | 3 | p2 |
| Aloy | 3 | 0 | 0 | 3 | p2 |
| Shenhe | 7 | 3 | 0 | 6 | p2 p3 |
| Yun Jin | 8 | 0 | 3 | 9 | p2 p3 |
| Kuki Shinobu | 12 | 0 | 4 | 4 | p2 p3 |
| Kamisato Ayato | 10 | 0 | 5 | 1 | p3 |
| Collei | 9 | 0 | 6 | 1 | p3 |
| Dori | 5 | 0 | 14 | 1 | p3 |
| Tighnari | 15 | 0 | 0 | 2 | p2 |
| Nilou | 19 | 6 | 0 | 1 | p3 |
| Cyno | 16 | 6 | 7 | 6 | p2 p3 p4 |
| Candace | 8 | 0 | 1 | 3 | p2 p3 |
| Nahida | 25 | 0 | 1 | 6 | p2 |
| Layla | 7 | 3 | 8 | 2 | p2 p3 |
| Wanderer | 13 | 13 | 0 | 1 | p3 |
| Faruzan | 8 | 0 | 7 | 4 | p2 p3 |
| Yaoyao | 16 | 2 | 4 | 0 |  |
| Alhaitham | 13 | 4 | 3 | 3 | p2 p3 |
| Dehya | 13 | 2 | 15 | 5 | p3 |
| Mika | 10 | 0 | 3 | 3 | p2 |
| Kaveh | 7 | 0 | 6 | 4 | p2 p3 |
| Baizhu | 15 | 0 | 1 | 7 | p2 p3 |
| Lynette | 15 | 0 | 1 | 2 | p2 p3 |
| Lyney | 10 | 2 | 3 | 3 | p2 |
| Freminet | 13 | 0 | 5 | 3 | p2 p3 |
| Wriothesley | 21 | 17 | 8 | 3 | p2 p3 |
| Neuvillette | 16 | 0 | 2 | 5 | p2 p3 |
| Charlotte | 18 | 12 | 6 | 0 |  |
| Furina | 17 | 2 | 5 | 6 | p2 p3 |
| Chevreuse | 13 | 0 | 3 | 5 | p2 p3 |
| Navia | 14 | 0 | 5 | 3 | p2 p3 |
| Gaming | 8 | 0 | 6 | 9 | p2 p3 |
| Xianyun | 24 | 0 | 8 | 4 | p2 p3 |
| Chiori | 21 | 1 | 0 | 3 | p2 p3 |
| Sigewinne | 22 | 7 | 4 | 6 | p3 |
| Arlecchino | 13 | 1 | 6 | 5 | p2 p3 |
| Sethos | 10 | 0 | 6 | 4 | p2 |
| Clorinde | 28 | 0 | 0 | 5 | p2 |
| Emilie | 15 | 0 | 2 | 4 | p2 p3 |
| Kachina | 17 | 0 | 3 | 4 | p2 p3 |
| Kinich | 16 | 0 | 2 | 6 | p2 p3 |
| Mualani | 9 | 0 | 7 | 10 | p2 p3 |
| Xilonen | 25 | 0 | 5 | 4 | p3 |
| Chasca | 4 | 21 | 0 | 4 | p3 p4 |
| Ororon | 12 | 2 | 19 | 4 | p3 p4 |
| Mavuika | 12 | 12 | 0 | 6 | p2 p3 |
| Citlali | 27 | 0 | 0 | 7 | p2 p3 |
| Lan Yan | 6 | 0 | 5 | 2 | p2 |
| Yumemizuki Mizuki | 28 | 0 | 6 | 3 | p2 p3 |
| Iansan | 14 | 0 | 11 | 6 | p3 p4 |
| Varesa | 16 | 0 | 4 | 5 | p2 p3 |
| Escoffier | 14 | 0 | 7 | 11 | p2 p3 |
| Ifa | 18 | 0 | 2 | 4 | p2 p3 |
| Skirk | 12 | 14 | 0 | 12 | p2 p3 |
| Dahlia | 4 | 0 | 13 | 5 | p3 |
| Ineffa | 13 | 0 | 2 | 6 | p2 p3 |
| Lauma | 18 | 0 | 7 | 6 | p2 p3 |
| Flins | 14 | 0 | 3 | 6 | p2 p3 |
| Aino | 13 | 0 | 2 | 2 | p2 p3 |
| Nefer | 25 | 1 | 5 | 4 | p3 p4 |
| Durin | 27 | 0 | 0 | 9 | p2 p3 |
| Jahoda | 8 | 5 | 1 | 4 | p2 p3 |
| Columbina | 32 | 4 | 0 | 5 | p3 p4 |
| Zibai | 20 | 7 | 0 | 6 | p2 p3 |
| Illuga | 20 | 0 | 2 | 10 | p2 p3 |
| Varka | 19 | 2 | 0 | 6 | p2 p3 |
| Lohen | 13 | 11 | 0 | 7 | p2 p3 |
| Linnea | 21 | 0 | 0 | 5 | p2 p3 |
| Nicole | 14 | 2 | 1 | 3 | p3 p4 |
| Prune | 17 | 0 | 2 | 5 | p2 p3 |
| Sandrone | 15 | 11 | 0 | 7 | p2 p3 |
| Mitya | 16 | 4 | 0 | 8 | p2 p3 |
| Valeriy | 13 | 2 | 12 | 2 | p4 |
| Vodyanitsa | 23 | 0 | 3 | 1 | p3 |
| Vesna | 12 | 5 | 3 | 6 | p2 p3 |
| Alyosha | 7 | 0 | 5 | 4 | p2 p3 |
| Odette | 17 | 0 | 0 | 8 | p2 p3 |
| Aether (Anemo) | 8 | 0 | 5 | 5 | p3 |
| Aether (Cryo) | 19 | 0 | 3 | 6 | p2 p3 |
| Aether (Dendro) | 8 | 0 | 3 | 13 | p2 p3 |
| Aether (Electro) | 9 | 0 | 5 | 7 | p3 |
| Aether (Geo) | 6 | 0 | 6 | 8 | p3 |
| Aether (Hydro) | 4 | 2 | 10 | 14 | p3 |
| Aether (Pyro) | 9 | 0 | 7 | 5 | p3 |
| Lumine (Anemo) | 8 | 0 | 5 | 5 | p3 |
| Lumine (Cryo) | 19 | 0 | 3 | 6 | p2 p3 |
| Lumine (Dendro) | 8 | 0 | 3 | 13 | p2 p3 |
| Lumine (Electro) | 9 | 0 | 5 | 7 | p3 |
| Lumine (Geo) | 6 | 0 | 6 | 8 | p3 |
| Lumine (Hydro) | 4 | 2 | 10 | 14 | p3 |
| Lumine (Pyro) | 9 | 0 | 7 | 5 | p3 |

## Armas
| Arma | No cálculo | Só exibido | Sem efeito no dano | Órfão |
|---|---|---|---|---|
| Cool Steel | 0 | 0 | 0 | 1 |
| Harbinger of Dawn | 0 | 0 | 0 | 2 |
| Traveler's Handy Sword | 0 | 0 | 0 | 1 |
| Dark Iron Sword | 0 | 0 | 0 | 2 |
| Fillet Blade | 0 | 0 | 0 | 3 |
| Skyrider Sword | 0 | 0 | 0 | 2 |
| Favonius Sword | 0 | 0 | 3 | 0 |
| The Flute | 5 | 0 | 0 | 0 |
| Sacrificial Sword | 0 | 0 | 2 | 0 |
| Royal Longsword | 2 | 0 | 0 | 0 |
| Lion's Roar | 1 | 0 | 0 | 0 |
| Prototype Rancour | 4 | 0 | 0 | 0 |
| Iron Sting | 4 | 0 | 0 | 0 |
| Blackcliff Longsword | 3 | 0 | 0 | 0 |
| The Black Sword | 3 | 0 | 0 | 0 |
| The Alley Flash | 2 | 0 | 0 | 0 |
| Festering Desire | 2 | 0 | 0 | 0 |
| Amenoma Kageuchi | 0 | 0 | 6 | 0 |
| Cinnabar Spindle | 3 | 0 | 0 | 0 |
| Sapwood Blade | 5 | 0 | 0 | 0 |
| Xiphos' Moonlight | 4 | 0 | 0 | 0 |
| Toukabou Shigure | 3 | 0 | 0 | 0 |
| Wolf-Fang | 6 | 0 | 0 | 0 |
| Finale of the Deep | 0 | 7 | 0 | 0 |
| Fleuve Cendre Ferryman | 3 | 0 | 0 | 0 |
| The Dockhand's Assistant | 7 | 0 | 0 | 0 |
| Sword of Narzissenkreuz | 2 | 0 | 0 | 0 |
| Sturdy Bone | 4 | 0 | 0 | 0 |
| Flute of Ezpitzal | 2 | 0 | 0 | 0 |
| Calamity of Eshu | 2 | 0 | 0 | 0 |
| Serenity's Call | 3 | 0 | 0 | 0 |
| Moonweaver's Dawn | 5 | 0 | 0 | 0 |
| Heretic's Molten Blade | 4 | 0 | 0 | 0 |
| Emberwell | 4 | 0 | 0 | 0 |
| New Bough | 0 | 7 | 0 | 0 |
| Silver Light | 3 | 0 | 0 | 0 |
| Aquila Favonia | 4 | 0 | 0 | 0 |
| Skyward Blade | 5 | 0 | 0 | 0 |
| Freedom-Sworn | 7 | 0 | 0 | 0 |
| Summit Shaper | 6 | 0 | 0 | 0 |
| Primordial Jade Cutter | 2 | 0 | 0 | 0 |
| Mistsplitter Reforged | 12 | 0 | 0 | 0 |
| Haran Geppaku Futsu | 5 | 0 | 0 | 0 |
| Key of Khaj-Nisut | 9 | 0 | 0 | 0 |
| Light of Foliar Incision | 5 | 0 | 0 | 0 |
| Splendor of Tranquil Waters | 8 | 0 | 0 | 0 |
| Uraku Misugiri | 5 | 0 | 0 | 0 |
| Absolution | 4 | 0 | 0 | 0 |
| Peak Patrol Song | 10 | 0 | 0 | 0 |
| Azurelight | 5 | 0 | 0 | 0 |
| Athame Artis | 5 | 0 | 0 | 0 |
| Lightbearing Moonshard | 3 | 0 | 0 | 0 |
| Whitelake Frostfeather | 8 | 0 | 0 | 0 |
| Exaiphanes Blade | 4 | 0 | 0 | 0 |
| Beyond the Chrysalis | 7 | 0 | 0 | 0 |
| Ferrous Shadow | 0 | 0 | 0 | 2 |
| Bloodtainted Greatsword | 0 | 0 | 0 | 1 |
| White Iron Greatsword | 0 | 0 | 0 | 1 |
| Debate Club | 0 | 0 | 0 | 3 |
| Skyrider Greatsword | 0 | 0 | 0 | 4 |
| Favonius Greatsword | 0 | 0 | 3 | 0 |
| The Bell | 4 | 0 | 0 | 0 |
| Sacrificial Greatsword | 0 | 0 | 2 | 0 |
| Royal Greatsword | 2 | 0 | 0 | 0 |
| Rainslasher | 1 | 0 | 0 | 0 |
| Prototype Archaic | 3 | 0 | 0 | 0 |
| Whiteblind | 4 | 0 | 0 | 0 |
| Blackcliff Slasher | 3 | 0 | 0 | 0 |
| Serpent Spine | 5 | 0 | 0 | 0 |
| Lithic Blade | 3 | 0 | 0 | 0 |
| Snow-Tombed Starsilver | 4 | 0 | 0 | 0 |
| Luxurious Sea-Lord | 4 | 0 | 0 | 0 |
| Katsuragikiri Nagamasa | 6 | 0 | 0 | 0 |
| Makhaira Aquamarine | 4 | 0 | 0 | 0 |
| Akuoumaru | 3 | 0 | 0 | 0 |
| Forest Regalia | 5 | 0 | 0 | 0 |
| Mailed Flower | 3 | 0 | 0 | 0 |
| Talking Stick | 6 | 0 | 0 | 0 |
| Tidal Shadow | 2 | 0 | 0 | 0 |
| "Ultimate Overlord's Mega Magic Sword" | 2 | 0 | 0 | 0 |
| Portable Power Saw | 7 | 0 | 0 | 0 |
| Fruitful Hook | 3 | 0 | 0 | 0 |
| Earth Shaker | 2 | 0 | 0 | 0 |
| Flame-Forged Insight | 4 | 0 | 0 | 0 |
| Master Key | 3 | 0 | 0 | 0 |
| Forged by the Golden Melody | 0 | 7 | 0 | 0 |
| Blade of Atonement | 4 | 0 | 0 | 0 |
| Skyward Pride | 4 | 0 | 0 | 0 |
| Wolf's Gravestone | 5 | 0 | 0 | 0 |
| Song of Broken Pines | 7 | 0 | 0 | 0 |
| The Unforged | 6 | 0 | 0 | 0 |
| Redhorn Stonethresher | 2 | 0 | 0 | 0 |
| Beacon of the Reed Sea | 5 | 0 | 0 | 0 |
| Verdict | 6 | 0 | 0 | 0 |
| Fang of the Mountain King | 7 | 0 | 0 | 0 |
| A Thousand Blazing Suns | 7 | 0 | 0 | 0 |
| Gest of the Mighty Wolf | 9 | 0 | 0 | 0 |
| A Teaspoon of Transcendence | 5 | 0 | 0 | 0 |
| White Tassel | 0 | 0 | 0 | 1 |
| Halberd | 0 | 0 | 0 | 2 |
| Black Tassel | 0 | 0 | 0 | 1 |
| Dragon's Bane | 1 | 0 | 0 | 0 |
| Prototype Starglitter | 3 | 0 | 0 | 0 |
| Crescent Pike | 2 | 0 | 0 | 0 |
| Blackcliff Pole | 3 | 0 | 0 | 0 |
| Deathmatch | 5 | 0 | 0 | 0 |
| Lithic Spear | 3 | 0 | 0 | 0 |
| Favonius Lance | 0 | 0 | 3 | 0 |
| Royal Spear | 2 | 0 | 0 | 0 |
| Dragonspine Spear | 4 | 0 | 0 | 0 |
| Kitain Cross Spear | 6 | 0 | 0 | 0 |
| "The Catch" | 2 | 0 | 0 | 0 |
| Wavebreaker's Fin | 3 | 0 | 0 | 0 |
| Moonpiercer | 5 | 0 | 0 | 0 |
| Missive Windspear | 3 | 0 | 0 | 0 |
| Ballad of the Fjords | 2 | 0 | 0 | 0 |
| Rightful Reward | 0 | 0 | 2 | 0 |
| Dialogues of the Desert Sages | 0 | 0 | 2 | 0 |
| Prospector's Drill | 6 | 0 | 0 | 0 |
| Mountain-Bracing Bolt | 4 | 0 | 0 | 0 |
| Footprint of the Rainbow | 2 | 0 | 0 | 0 |
| Tamayuratei no Ohanashi | 3 | 0 | 0 | 0 |
| Prospector's Shovel | 3 | 0 | 0 | 0 |
| Sacrificer's Staff | 4 | 0 | 0 | 0 |
| Frostbreath | 4 | 0 | 0 | 0 |
| Song of the Vigil | 4 | 0 | 0 | 0 |
| Staff of Homa | 4 | 0 | 0 | 0 |
| Skyward Spine | 5 | 0 | 0 | 0 |
| Vortex Vanquisher | 6 | 0 | 0 | 0 |
| Primordial Jade Winged-Spear | 5 | 0 | 0 | 0 |
| Calamity Queller | 4 | 0 | 0 | 0 |
| Engulfing Lightning | 5 | 0 | 0 | 0 |
| Staff of the Scarlet Sands | 4 | 0 | 0 | 0 |
| Crimson Moon's Semblance | 5 | 0 | 0 | 0 |
| Lumidouce Elegy | 8 | 0 | 0 | 0 |
| Symphonist of Scents | 4 | 0 | 0 | 0 |
| Fractured Halo | 4 | 0 | 0 | 0 |
| Bloodsoaked Ruins | 6 | 0 | 0 | 0 |
| Disaster and Remorse | 9 | 0 | 0 | 0 |
| Magic Guide | 0 | 0 | 0 | 1 |
| Thrilling Tales of Dragon Slayers | 3 | 0 | 0 | 0 |
| Otherworldly Story | 0 | 0 | 0 | 1 |
| Emerald Orb | 0 | 0 | 0 | 2 |
| Twin Nephrite | 0 | 0 | 0 | 2 |
| Favonius Codex | 0 | 0 | 3 | 0 |
| The Widsith | 5 | 0 | 0 | 0 |
| Sacrificial Fragments | 0 | 0 | 2 | 0 |
| Royal Grimoire | 2 | 0 | 0 | 0 |
| Solar Pearl | 4 | 0 | 0 | 0 |
| Prototype Amber | 0 | 0 | 5 | 0 |
| Mappa Mare | 3 | 0 | 0 | 0 |
| Blackcliff Agate | 3 | 0 | 0 | 0 |
| Eye of Perception | 4 | 0 | 0 | 0 |
| Wine and Song | 4 | 0 | 0 | 0 |
| Frostbearer | 4 | 0 | 0 | 0 |
| Dodoco Tales | 4 | 0 | 0 | 0 |
| Hakushin Ring | 2 | 0 | 0 | 0 |
| Oathsworn Eye | 2 | 0 | 0 | 0 |
| Wandering Evenstar | 4 | 0 | 0 | 0 |
| Fruit of Fulfillment | 7 | 0 | 0 | 0 |
| Sacrificial Jade | 4 | 0 | 0 | 0 |
| Flowing Purity | 8 | 0 | 0 | 0 |
| Ballad of the Boundless Blue | 5 | 0 | 0 | 0 |
| Ash-Graven Drinking Horn | 2 | 0 | 0 | 0 |
| Waveriding Whirl | 6 | 0 | 0 | 0 |
| Ring of Yaxche | 4 | 0 | 0 | 0 |
| Etherlight Spindlelute | 2 | 0 | 0 | 0 |
| Blackmarrow Lantern | 3 | 0 | 0 | 0 |
| Dawning Frost | 4 | 0 | 0 | 0 |
| Clash of Kings | 6 | 0 | 0 | 0 |
| Echoes of the Heart | 4 | 0 | 0 | 0 |
| Winter's Heavy Heart | 5 | 0 | 0 | 0 |
| Skyward Atlas | 5 | 0 | 0 | 0 |
| Lost Prayer to the Sacred Winds | 4 | 0 | 0 | 0 |
| Memory of Dust | 6 | 0 | 0 | 0 |
| Jadefall's Splendor | 6 | 0 | 0 | 0 |
| Everlasting Moonglow | 5 | 0 | 0 | 0 |
| Kagura's Verity | 6 | 0 | 0 | 0 |
| A Thousand Floating Dreams | 4 | 0 | 0 | 0 |
| Tulaytullah's Remembrance | 7 | 0 | 0 | 0 |
| Cashflow Supervision | 9 | 0 | 0 | 0 |
| Tome of the Eternal Flow | 9 | 0 | 0 | 0 |
| Crane's Echoing Call | 4 | 0 | 0 | 0 |
| Surf's Up | 10 | 0 | 0 | 0 |
| Starcaller's Watch | 4 | 0 | 0 | 0 |
| Sunny Morning Sleep-In | 6 | 0 | 0 | 0 |
| Vivid Notions | 5 | 0 | 0 | 0 |
| Nightweaver's Looking Glass | 7 | 0 | 0 | 0 |
| Reliquary of Truth | 6 | 0 | 0 | 0 |
| Nocturne's Curtain Call | 6 | 0 | 0 | 0 |
| Angelos' Heptades | 8 | 0 | 0 | 0 |
| Hymn of the Maelstrom | 10 | 0 | 0 | 0 |
| Starsealed Edict | 7 | 0 | 0 | 0 |
| Raven Bow | 0 | 0 | 0 | 1 |
| Sharpshooter's Oath | 0 | 0 | 0 | 1 |
| Recurve Bow | 0 | 0 | 0 | 1 |
| Slingshot | 0 | 0 | 0 | 3 |
| Messenger | 0 | 0 | 0 | 2 |
| Favonius Warbow | 0 | 0 | 3 | 0 |
| The Stringless | 1 | 0 | 0 | 0 |
| Sacrificial Bow | 0 | 0 | 2 | 0 |
| Royal Bow | 2 | 0 | 0 | 0 |
| Rust | 2 | 0 | 0 | 0 |
| Prototype Crescent | 3 | 0 | 0 | 0 |
| Compound Bow | 5 | 0 | 0 | 0 |
| Blackcliff Warbow | 3 | 0 | 0 | 0 |
| The Viridescent Hunt | 5 | 0 | 0 | 0 |
| Alley Hunter | 7 | 0 | 0 | 0 |
| Fading Twilight | 4 | 0 | 0 | 0 |
| Mitternachts Waltz | 4 | 0 | 0 | 0 |
| Windblume Ode | 2 | 0 | 0 | 0 |
| Hamayumi | 4 | 0 | 0 | 0 |
| Mouun's Moon | 3 | 0 | 0 | 0 |
| King's Squire | 5 | 0 | 0 | 0 |
| End of the Line | 6 | 0 | 0 | 0 |
| Ibis Piercer | 4 | 0 | 0 | 0 |
| Scion of the Blazing Sun | 4 | 0 | 0 | 0 |
| Song of Stillness | 2 | 0 | 0 | 0 |
| Cloudforged | 3 | 0 | 0 | 0 |
| Range Gauge | 6 | 0 | 0 | 0 |
| Flower-Wreathed Feathers | 5 | 0 | 0 | 0 |
| Chain Breaker | 3 | 0 | 0 | 0 |
| Sequence of Solitude | 2 | 0 | 0 | 0 |
| Snare Hook | 3 | 0 | 0 | 0 |
| Rainbow Serpent's Rain Bow | 2 | 0 | 0 | 0 |
| Jade Vista | 3 | 0 | 0 | 0 |
| Covenant of Frost and Snow | 2 | 0 | 0 | 0 |
| Breezeborne Refrain | 7 | 0 | 0 | 0 |
| Skyward Harp | 4 | 0 | 0 | 0 |
| Amos' Bow | 4 | 0 | 0 | 0 |
| Elegy for the End | 7 | 0 | 0 | 0 |
| Polar Star | 11 | 0 | 0 | 0 |
| Aqua Simulacra | 2 | 0 | 0 | 0 |
| Thundering Pulse | 10 | 0 | 0 | 0 |
| Hunter's Path | 6 | 0 | 0 | 0 |
| The First Great Magic | 15 | 0 | 0 | 0 |
| Silvershower Heartstrings | 17 | 0 | 0 | 0 |
| Astral Vulture's Crimson Plumage | 8 | 0 | 0 | 0 |
| The Daybreak Chronicles | 8 | 0 | 0 | 0 |
| Golden Frostbound Oath | 6 | 0 | 0 | 0 |

## Conjuntos
| Conjunto | No cálculo | Só exibido | Sem efeito no dano | Órfão |
|---|---|---|---|---|
| Resolution of Sojourner | 2 | 0 | 0 | 0 |
| Brave Heart | 3 | 0 | 0 | 0 |
| Defender's Will | 0 | 0 | 2 | 0 |
| Tiny Miracle | 0 | 0 | 4 | 0 |
| Berserker | 3 | 0 | 0 | 0 |
| Martial Artist | 3 | 0 | 0 | 0 |
| Instructor | 3 | 0 | 0 | 0 |
| Gambler | 0 | 0 | 3 | 0 |
| The Exile | 0 | 0 | 4 | 0 |
| Adventurer | 3 | 0 | 0 | 0 |
| Lucky Dog | 2 | 0 | 0 | 0 |
| Scholar | 0 | 0 | 3 | 0 |
| Traveling Doctor | 2 | 0 | 0 | 0 |
| Blizzard Strayer | 3 | 0 | 0 | 0 |
| Thundersoother | 2 | 0 | 0 | 0 |
| Lavawalker | 2 | 0 | 0 | 0 |
| Maiden Beloved | 0 | 0 | 3 | 0 |
| ??? | 0 | 0 | 0 | 0 |
| Gladiator's Finale | 2 | 0 | 0 | 0 |
| Viridescent Venerer | 1 | 5 | 0 | 0 |
| Wanderer's Troupe | 2 | 0 | 0 | 0 |
| Glacier and Snowfield | 5 | 0 | 0 | 0 |
| Thundering Fury | 6 | 0 | 0 | 0 |
| Crimson Witch of Flames | 7 | 0 | 0 | 0 |
| Noblesse Oblige | 3 | 0 | 0 | 0 |
| Bloodstained Chivalry | 4 | 0 | 0 | 0 |
| Prayers for Illumination | 0 | 0 | 0 | 0 |
| Prayers for Destiny | 0 | 0 | 0 | 0 |
| Prayers for Wisdom | 0 | 0 | 0 | 0 |
| Prayers to the Firmament | 0 | 0 | 0 | 0 |
| Prayers to Springtime | 0 | 0 | 0 | 0 |
| Archaic Petra | 1 | 2 | 0 | 0 |
| Retracing Bolide | 2 | 0 | 0 | 0 |
| Heart of Depth | 3 | 0 | 0 | 0 |
| Tenacity of the Millelith | 5 | 0 | 0 | 0 |
| Pale Flame | 8 | 0 | 0 | 0 |
| Shimenawa's Reminiscence | 5 | 0 | 0 | 0 |
| Emblem of Severed Fate | 3 | 0 | 0 | 0 |
| Husk of Opulent Dreams | 10 | 0 | 0 | 0 |
| Ocean-Hued Clam | 1 | 6 | 0 | 0 |
| Vermillion Hereafter | 7 | 0 | 0 | 0 |
| Echoes of an Offering | 1 | 6 | 0 | 0 |
| Deepwood Memories | 3 | 0 | 0 | 0 |
| Gilded Dreams | 6 | 0 | 0 | 0 |
| Desert Pavilion Chronicle | 4 | 0 | 0 | 0 |
| Flower of Paradise Lost | 7 | 0 | 0 | 0 |
| Nymph's Dream | 11 | 0 | 0 | 0 |
| Vourukasha's Glow | 5 | 0 | 0 | 0 |
| Marechaussee Hunter | 4 | 0 | 0 | 0 |
| Golden Troupe | 4 | 0 | 0 | 0 |
| Song of Days Past | 1 | 5 | 0 | 0 |
| Nighttime Whispers in the Echoing Woods | 5 | 0 | 0 | 0 |
| Fragment of Harmonic Whimsy | 4 | 0 | 0 | 0 |
| Unfinished Reverie | 8 | 0 | 0 | 0 |
| Scroll of the Hero of Cinder City | 5 | 0 | 0 | 0 |
| Obsidian Codex | 4 | 0 | 0 | 0 |
| Long Night's Oath | 7 | 0 | 0 | 0 |
| Finale of the Deep Galleries | 6 | 0 | 0 | 0 |
| Night of the Sky's Unveiling | 5 | 0 | 0 | 0 |
| Silken Moon's Serenade | 5 | 0 | 0 | 0 |
| Aubade of Morningstar and Moon | 4 | 0 | 0 | 0 |
| A Day Carved From Rising Winds | 4 | 0 | 0 | 0 |
| Celestial Gift | 1 | 3 | 0 | 0 |
| Disenchantment in Deep Shadow | 4 | 0 | 0 | 0 |
| Scarlet Proof | 4 | 0 | 0 | 0 |
| Heart of the Furnace | 4 | 0 | 0 | 0 |
