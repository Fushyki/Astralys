import json

with open(r'C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\survey_er_calc.md', 'r', encoding='utf-8') as f:
    content = f.read()

sec2 = content.split('## 2. Character Database Specification (All 128 Characters)')[1].split('## 3. Energy Particle Mechanics')[0]
sec2_lines = [l for l in sec2.split('\n') if l.strip().startswith('|') and not l.strip().startswith('| #') and not l.strip().startswith('|---')]

four_stars = {
    'Amber', 'Barbara', 'Beidou', 'Bennett', 'Candace', 'Charlotte', 'Chevreuse', 'Chongyun',
    'Collei', 'Diona', 'Dori', 'Faruzan', 'Fischl', 'Freminet', 'Gaming', 'Gorou', 'Heizou',
    'Kachina', 'Kaeya', 'Kaveh', 'Kirara', 'Kuki Shinobu', 'Layla', 'Lisa', 'Lynette', 'Mika',
    'Ningguang', 'Noelle', 'Ororon', 'Razor', 'Rosaria', 'Sara', 'Sayu', 'Sethos', 'Sucrose',
    'Thoma', 'Xiangling', 'Xingqiu', 'Xinyan', 'Yanfei', 'Yaoyao', 'Yun Jin',
    'Aino', 'Dahlia', 'Ifa', 'Illuga', 'Ineffa', 'Jahoda', 'Lan Yan', 'Linnea', 'Odette', 'Prune', 'Vesna', 'Vodyanitsa'
}

released = {
    'Albedo', 'Alhaitham', 'Amber', 'Arlecchino', 'Ayaka', 'Ayato', 'Baizhu', 'Barbara',
    'Beidou', 'Bennett', 'Candace', 'Charlotte', 'Chasca', 'Chevreuse', 'Childe', 'Chiori',
    'Chongyun', 'Clorinde', 'Collei', 'Cyno', 'Dehya', 'Diluc', 'Diona', 'Dori', 'Emilie',
    'Eula', 'Faruzan', 'Fischl', 'Freminet', 'Furina', 'Gaming', 'Ganyu', 'Gorou', 'Heizou',
    'Hu Tao', 'Itto', 'Jean', 'Kachina', 'Kaeya', 'Kaveh', 'Kazuha', 'Keqing', 'Kinich',
    'Kirara', 'Klee', 'Kokomi', 'Kuki Shinobu', 'Layla', 'Lisa', 'Lynette', 'Lyney',
    'Mika', 'Mona', 'Mualani', 'Nahida', 'Navia', 'Neuvillette', 'Nilou', 'Ningguang',
    'Noelle', 'Ororon', 'Qiqi', 'Raiden', 'Razor', 'Rosaria', 'Sara', 'Sayu', 'Sethos',
    'Shenhe', 'Sigewinne', 'Sucrose', 'Tartaglia', 'Thoma', 'Tighnari', 'Traveler (Anemo)',
    'Traveler (Dendro)', 'Traveler (Electro)', 'Traveler (Geo)', 'Traveler (Hydro)',
    'Traveler (Pyro)', 'Wanderer', 'Wriothesley', 'Xiangling', 'Xianyun', 'Xiao', 'Xilonen',
    'Xingqiu', 'Xinyan', 'Yae Miko', 'Yanfei', 'Yaoyao', 'Yelan', 'Yoimiya', 'Yun Jin', 'Zhongli'
}

aliases_dict = {
    'Alhaitham': ['Haitham'],
    'Arlecchino': ['Arle', 'Father'],
    'Ayaka': ['Kamisato Ayaka'],
    'Ayato': ['Kamisato Ayato'],
    'Bennett': ['Benny'],
    'Chevreuse': ['Chev'],
    'Childe': ['Tartaglia', 'Ajax'],
    'Chongyun': ['Chong'],
    'Columbina': ['Damselette'],
    'Faruzan': ['Madam Faruzan'],
    'Fischl': ['Amy', 'Oz'],
    'Furina': ['Focalors'],
    'Gaming': ['Ga-ming'],
    'Heizou': ['Shikanoin Heizou'],
    'Hu Tao': ['Hutao', 'Tao'],
    'Itto': ['Arataki Itto'],
    'Jean': ['Jean Gunnhildr'],
    'Kaeya': ['Kaeya Alberich'],
    'Kazuha': ['Kaedehara Kazuha', 'Kaz'],
    'Keqing': ['Keq'],
    'Kokomi': ['Sangonomiya Kokomi', 'Koko'],
    'Kuki Shinobu': ['Shinobu', 'Kuki'],
    'Mavuika': ['Pyro Archon'],
    'Mona': ['Mona Megistus'],
    'Mualani': ['Shark Girl'],
    'Nahida': ['Kusanali', 'Lesser Lord'],
    'Navia': ['Spina President'],
    'Neuvillette': ['Neuvi', 'Iudex'],
    'Nicole': ['Nicole Reihn', 'Hexenzirkel N'],
    'Ningguang': ['Ning'],
    'Nobody': ['Empty', 'None'],
    'Raiden': ['Raiden Shogun', 'Ei'],
    'Rosaria': ['Rosa'],
    'Sandrone': ['Marionette'],
    'Sara': ['Kujou Sara'],
    'Sigewinne': ['Sige'],
    'Skirk': ['Master Skirk'],
    'Tartaglia': ['Childe', 'Ajax'],
    'Tighnari': ['Nari'],
    'Traveler (Anemo)': ['Anemo MC', 'Anemo Traveler'],
    'Traveler (Cryo)': ['Cryo MC', 'Cryo Traveler'],
    'Traveler (Dendro)': ['Dendro MC', 'Dendro Traveler'],
    'Traveler (Electro)': ['Electro MC', 'Electro Traveler'],
    'Traveler (Geo)': ['Geo MC', 'Geo Traveler'],
    'Traveler (Hydro)': ['Hydro MC', 'Hydro Traveler'],
    'Traveler (Pyro)': ['Pyro MC', 'Pyro Traveler'],
    'Varka': ['Grand Master Varka'],
    'Venti': ['Barbatos'],
    'Wanderer': ['Scaramouche', 'Hat Guy'],
    'Wriothesley': ['Wrio', 'Duke'],
    'Xiangling': ['XL', 'Guoba'],
    'Xianyun': ['Cloud Retainer'],
    'Xiao': ['Vigilant Yaksha'],
    'Xilonen': ['Leopard DJ'],
    'Xingqiu': ['XQ'],
    'Yae Miko': ['Yae', 'Guuji Yae'],
    'Yoimiya': ['Yoi'],
    'Yumemizuki Mizuki': ['Mizuki'],
    'Yun Jin': ['Yunjin'],
    'Zhongli': ['Morax', 'Geo Daddy']
}

lines = []
for l in sec2_lines:
    cols = [c.strip() for c in l.split('|')[1:-1]]
    if len(cols) >= 9:
        num, name, elem, weapon, cost, cd, part, label, rng = cols[:9]
        rarity = 4 if name in four_stars else 5
        status = 'released' if name in released else 'upcoming'
        aliases = aliases_dict.get(name, [])
        alias_str = f', aliases: {json.dumps(aliases)}' if aliases else ''
        cost_val = float(cost) if '.' in cost else int(cost)
        cd_val = float(cd) if '.' in cd else int(cd)
        part_val = float(part) if '.' in part else int(part)
        line = f'  {{ name: {json.dumps(name)}, element: "{elem}", weapon: "{weapon}", burst_cost: {cost_val}, burst_cd: {cd_val}, particles: {part_val}, label: {json.dumps(label)}, rng: {json.dumps(rng)}, rarity: {rarity}, releaseStatus: "{status}"{alias_str} }},'
        lines.append(line)

print(f'Generated {len(lines)} entries')
with open(r'C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\explorer_m1_3\generated_entries.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(lines))
print('Written to generated_entries.txt ok!')
