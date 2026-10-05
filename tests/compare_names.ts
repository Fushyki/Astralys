import fs from 'fs';
import { CHARACTERS_DATABASE } from '../src/data/characters';

const html = fs.readFileSync('C:/Users/dabiv/Downloads/Calculadora_Recarga_Genshin.html', 'utf8');
const match = html.match(/const CHARACTERS = (\[.*?\]);/);
if (!match) {
  console.error('No CHARACTERS found in HTML');
  process.exit(1);
}

const htmlChars: { name: string; element: string; burst_cost: number; particles: number }[] = JSON.parse(match[1]);
console.log('HTML characters count:', htmlChars.length);
console.log('TS CHARACTERS_DATABASE count:', CHARACTERS_DATABASE.length);

const htmlNames = htmlChars.map(c => c.name);
const tsNames = CHARACTERS_DATABASE.map(c => c.name);

const inHtmlNotTs = htmlNames.filter(n => !tsNames.includes(n));
const inTsNotHtml = tsNames.filter(n => !htmlNames.includes(n));

console.log('In HTML but not in TS:', inHtmlNotTs);
console.log('In TS but not in HTML:', inTsNotHtml);
