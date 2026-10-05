/**
 * Raw calculation table fixtures matching nj2k8acllnah1.png and Brazilian comma decimals.
 * Documented in survey_card_and_sheet.md.
 */

export const RAW_TABLE_STELLAR_FORTRESS = `
Stellar Fortress\tTotal Damage\tDMG contrib%\tArtifacts\tWeapon\tWrio combo:
Wrio C0\t1308604,60\t45,83%\t4p Shadow\tWidsith R5\t1st rot: N1E 3N5C
Yae C1\t1048791,93\t36,73%\t4p Shadow\t7.0 Craftable R5\tAll rots onwards: 3N5C N2
Odette C0\t487931,25\t17,09%\t4p 7.0 Supp\tHoD R5\t
Nicole C0\t10239,79\t0,36%\t2p2p Atk\tFlowing Purity R5\t
Rotation(17s)
DPR\t2855567,58\tNicole E > Yae EEE > Odette Q/E E > > Wrio Combo
DPS\t167974,56
Assumes 5 field stacks avg
`;

export const RAW_TABLE_PIPE_DELIMITED = `
| Character | Damage | DMG% | Artifacts | Weapon | Combo |
| Wrio C0 | 1308604.60 | 45.83% | 4p Shadow | Widsith R5 | N1E 3N5C |
| Yae C1 | 1048791.93 | 36.73% | 4p Shadow | 7.0 Craftable R5 | EEE |
| Odette C0 | 487931.25 | 17.09% | 4p 7.0 Supp | HoD R5 | Q/E E |
| Nicole C0 | 10239.79 | 0.36% | 2p2p Atk | Flowing Purity R5 | E |
| Rotation(17s) | 2855567.58 | 167974.56 | Nicole E > Yae EEE > Odette Q/E E > Wrio Combo |
`;

export const RAW_TABLE_MINIMAL_COMMA = `
Sandrone C0,1670225.64,70.22%,Disenchant,Mailed Flower R5
Yae C1,701876.41,29.51%,Disenchant,The Widsith R5
Qiqi C0,6298.87,0.26%,Milelith,Favonius R5
Nicole C0,0,0.00%,F. Purity,Oathsworn Eye R5
Rotation: 20.5s
DPS: 108109.13
DPR: 2378400.91
Rotation string: (20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E CA EQ CA E
`;
