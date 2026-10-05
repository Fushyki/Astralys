import json

with open(r'C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\characters_dump.json', 'r', encoding='utf-8') as f:
    chars = json.load(f)

weapon_map = {
    'Aino': 'Catalyst',
    'Albedo': 'Sword',
    'Alhaitham': 'Sword',
    'Alyosha': 'Sword',
    'Amber': 'Bow',
    'Arlecchino': 'Polearm',
    'Ayaka': 'Sword',
    'Ayato': 'Sword',
    'Baizhu': 'Catalyst',
    'Barbara': 'Catalyst',
    'Beidou': 'Claymore',
    'Bennett': 'Sword',
    'Candace': 'Polearm',
    'Charlotte': 'Catalyst',
    'Chasca': 'Bow',
    'Chevreuse': 'Polearm',
    'Childe': 'Bow',
    'Chiori': 'Sword',
    'Chongyun': 'Claymore',
    'Citlali': 'Catalyst',
    'Clorinde': 'Sword',
    'Collei': 'Bow',
    'Columbina': 'Catalyst',
    'Cyno': 'Polearm',
    'Dahlia': 'Sword',
    'Dehya': 'Claymore',
    'Diluc': 'Claymore',
    'Diona': 'Bow',
    'Dori': 'Claymore',
    'Durin': 'Sword',
    'Emilie': 'Polearm',
    'Escoffier': 'Polearm',
    'Eula': 'Claymore',
    'Faruzan': 'Bow',
    'Fischl': 'Bow',
    'Flins': 'Polearm',
    'Freminet': 'Claymore',
    'Furina': 'Sword',
    'Gaming': 'Claymore',
    'Ganyu': 'Bow',
    'Gorou': 'Bow',
    'Heizou': 'Catalyst',
    'Hu Tao': 'Polearm',
    'Iansan': 'Polearm',
    'Ifa': 'Bow',
    'Illuga': 'Polearm',
    'Ineffa': 'Polearm',
    'Itto': 'Claymore',
    'Jahoda': 'Bow',
    'Jean': 'Sword',
    'Kachina': 'Polearm',
    'Kaeya': 'Sword',
    'Kaveh': 'Claymore',
    'Kazuha': 'Sword',
    'Keqing': 'Sword',
    'Kinich': 'Claymore',
    'Kirara': 'Sword',
    'Klee': 'Catalyst',
    'Kokomi': 'Catalyst',
    'Kuki Shinobu': 'Sword',
    'Lan Yan': 'Catalyst',
    'Lauma': 'Bow',
    'Layla': 'Sword',
    'Linnea': 'Polearm',
    'Lisa': 'Catalyst',
    'Lohen': 'Sword',
    'Lynette': 'Sword',
    'Lyney': 'Bow',
    'Mavuika': 'Claymore',
    'Mika': 'Polearm',
    'Mona': 'Catalyst',
    'Mualani': 'Catalyst',
    'Nahida': 'Catalyst',
    'Navia': 'Claymore',
    'Nefer': 'Catalyst',
    'Neuvillette': 'Catalyst',
    'Nicole': 'Catalyst',
    'Nilou': 'Sword',
    'Ningguang': 'Catalyst',
    'Nobody': 'None',
    'Noelle': 'Claymore',
    'Odette': 'Bow',
    'Ororon': 'Bow',
    'Prune': 'Catalyst',
    'Qiqi': 'Sword',
    'Raiden': 'Polearm',
    'Razor': 'Claymore',
    'Rosaria': 'Polearm',
    'Sandrone': 'Claymore',
    'Sara': 'Bow',
    'Sayu': 'Claymore',
    'Sethos': 'Bow',
    'Shenhe': 'Polearm',
    'Sigewinne': 'Bow',
    'Skirk': 'Sword',
    'Sucrose': 'Catalyst',
    'Tartaglia': 'Bow',
    'Thoma': 'Polearm',
    'Tighnari': 'Bow',
    'Traveler (Anemo)': 'Sword',
    'Traveler (Cryo)': 'Sword',
    'Traveler (Dendro)': 'Sword',
    'Traveler (Electro)': 'Sword',
    'Traveler (Geo)': 'Sword',
    'Traveler (Hydro)': 'Sword',
    'Traveler (Pyro)': 'Sword',
    'Varesa': 'Catalyst',
    'Varka': 'Claymore',
    'Venti': 'Bow',
    'Vesna': 'Sword',
    'Vodyanitsa': 'Sword',
    'Wanderer': 'Catalyst',
    'Wriothesley': 'Catalyst',
    'Xiangling': 'Polearm',
    'Xianyun': 'Catalyst',
    'Xiao': 'Polearm',
    'Xilonen': 'Sword',
    'Xingqiu': 'Sword',
    'Xinyan': 'Claymore',
    'Yae Miko': 'Catalyst',
    'Yanfei': 'Catalyst',
    'Yaoyao': 'Polearm',
    'Yelan': 'Bow',
    'Yoimiya': 'Bow',
    'Yumemizuki Mizuki': 'Catalyst',
    'Yun Jin': 'Polearm',
    'Zhongli': 'Polearm',
    'Zibai': 'Sword'
}

with open(r'C:\Users\dabiv\ametist-impact-suite\.agents\teamwork\spec_miner_survey_er\char_table.md', 'w', encoding='utf-8') as out:
    out.write('| # | Character | Element | Weapon | Burst Cost | Burst CD (s) | Skill Particles | Label / Mode | Generation Mechanics / RNG Details |\n')
    out.write('|---|---|---|---|---|---|---|---|---|\n')
    for i, c in enumerate(chars, 1):
        name = c['name']
        elem = c['element']
        cost = c['burst_cost']
        cd = c['burst_cd']
        parts = c['particles']
        label = c['label']
        w = weapon_map.get(name, 'Catalyst')
        
        mech = 'Standard fixed particle drop'
        if parts == 0:
            mech = 'Generates 0 particles on tap/press'
        elif cost == 0:
            mech = 'Alternate energy mechanic (Nightsoul / Stance), cost 0'
        elif name == 'Bennett':
            mech = 'Press: 75% chance 2 particles, 25% chance 3 particles (avg 2.25)'
        elif name == 'Jean':
            mech = 'Press: 33% chance 2 particles, 67% chance 3 particles (avg 2.67)'
        elif name == 'Kaeya':
            mech = 'Press: 2 or 3 Cryo particles (avg 2.67 without freeze passive)'
        elif name == 'Diluc':
            mech = '3-Skill Searing Onset combo (avg 1.25 particles per cast = 3.75 total)'
        elif name == 'Diona':
            mech = 'Press fires 2 paws (0.8/paw = 1.6 avg); Hold fires 5 paws (4.0)'
        elif name == 'Eula':
            mech = 'Tap: 1-2 particles (avg 1.5); Hold generates 2-3 (avg 2.5)'
        elif name == 'Mona':
            mech = 'Phantom explosion: 3 or 4 particles (avg 3.33)'
        elif name == 'Traveler (Geo)':
            mech = 'Starfell Sword: 3 or 4 Geo particles (avg 3.33)'
        elif name == 'Traveler (Hydro)':
            mech = 'Aquacrest Saber: 3 or 4 Hydro particles (avg 3.33)'
        elif name == 'Traveler (Dendro)':
            mech = 'Razorgrass Blade: 2 or 3 Dendro particles (avg 2.5)'
        elif name == 'Ningguang':
            mech = 'Jade Screen: 3 or 4 Geo particles (avg 3.4, 6s internal CD)'
        elif name == 'Thoma':
            mech = 'Blazing Blessing: 3 or 4 Pyro particles (avg 3.4)'
        elif name in ['Navia', 'Baizhu', 'Tighnari', 'Itto']:
            mech = 'Skill generates 3 or 4 particles (avg 3.5)'
        elif name in ['Ayaka', 'Ayato', 'Mualani', 'Nilou', 'Illuga']:
            mech = 'Skill / stance generates 4 or 5 particles (avg 4.5)'
        elif name == 'Zibai':
            mech = 'Skill / Lunar Phase Shift generates 4 or 5 Geo particles (avg 4.7)'
        elif name == 'Hu Tao':
            mech = 'Blood Blossom procs over 9s duration (avg 4.8 particles)'
        elif name == 'Fischl':
            mech = 'Oz attacks over 10s duration (~67% chance per hit, avg 6.7)'
        elif name == 'Furina':
            mech = 'Salon Members periodic attacks over 20s (avg 6.5 particles)'
        elif name == 'Raiden':
            mech = 'Eye of Stormy Judgment periodic hits (50% chance, 0.9s CD, avg 6.5)'
        elif name in ['Faruzan', 'Sara']:
            mech = 'Skill creates buffed Aimed Shot / Crowfeather that procs particles'
        elif name == 'Alhaitham':
            mech = 'Projection Attack hit on-field generates 1 particle (1.6s CD)'
        elif name == 'Kachina':
            mech = 'Turbo Twirler independent ground strikes generate ~3 particles total'
        elif name == 'Yae Miko':
            mech = 'Sesshou Sakura totem strikes generate ~3 particles across rotation'
        elif name == 'Wanderer':
            mech = 'Windfavored state normal/charged hits generate ~4 particles over 8-10s'
        elif name == 'Sandrone':
            mech = 'Hit on-field with mechanical automata generates 1 particle'
        elif name == 'Vodyanitsa':
            mech = 'Press skill generates 5.0 Hydro particles'
        elif name == 'Nefer':
            mech = 'Skill generates 2 or 3 Dendro particles (avg 2.67)'
        elif name == 'Varesa':
            mech = 'Skill generates 2 or 3 Electro particles (avg 2.5)'
        elif name == 'Keqing':
            mech = 'Stellar Restoration generates 2 or 3 Electro particles (avg 2.5)'
        elif name == 'Ifa':
            mech = 'Skill generates 4.3 Anemo particles on average'
        out.write(f'| {i} | {name} | {elem} | {w} | {cost} | {cd} | {parts} | {label} | {mech} |\n')

print('Generated char_table.md successfully!')
