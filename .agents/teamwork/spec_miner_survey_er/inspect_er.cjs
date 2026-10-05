const fs = require('fs');

const htmlPath = 'C:/Users/dabiv/Downloads/Calculadora_Recarga_Genshin.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

const match = html.match(/const CHARACTERS = (\[.*?\]);/s);
if (!match) {
  console.error("CHARACTERS array not found!");
  process.exit(1);
}

const characters = JSON.parse(match[1]);
console.log(`Loaded ${characters.length} characters.`);

// Print summary by element
const byElem = {};
characters.forEach(c => {
  byElem[c.element] = (byElem[c.element] || 0) + 1;
});
console.log("Characters by Element:", byElem);

// Check characters with burst_cost == 0
const zeroCost = characters.filter(c => c.burst_cost === 0);
console.log("Zero burst cost characters:", zeroCost);

// Check max and min particles
const minPart = characters.reduce((min, c) => c.particles < min.particles ? c : min, characters[0]);
const maxPart = characters.reduce((max, c) => c.particles > max.particles ? c : max, characters[0]);
console.log("Min particle char:", minPart);
console.log("Max particle char:", maxPart);

// Output full table in JSON or text
fs.writeFileSync('C:/Users/dabiv/ametist-impact-suite/.agents/teamwork/spec_miner_survey_er/characters_dump.json', JSON.stringify(characters, null, 2));
console.log("Dumped characters to characters_dump.json");
