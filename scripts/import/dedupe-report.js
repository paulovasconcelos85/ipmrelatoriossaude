const fs = require('fs');
const sql = fs.readFileSync('supabase/seed.sql', 'utf8');

function extractNames(marker, endMarker) {
  const start = sql.indexOf(marker);
  const end = sql.indexOf(endMarker, start);
  const block = sql.slice(start, end);
  const names = [];
  const re = /\('((?:[^'\\]|'')*)'/g;
  let m;
  while ((m = re.exec(block))) names.push(m[1].replace(/''/g, "'"));
  return names;
}

const parceiros = extractNames('insert into public.parceiros (', ';\n');
const profissionais = extractNames('insert into public.profissionais', ';\n');

function normKey(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findSimilar(list) {
  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = normKey(list[i]);
      const b = normKey(list[j]);
      if (a === b) {
        pairs.push([list[i], list[j], 'exact-after-normalize']);
        continue;
      }
      if (a.length > 4 && b.length > 4 && (a.includes(b) || b.includes(a))) {
        pairs.push([list[i], list[j], 'substring']);
      }
    }
  }
  return pairs;
}

console.log('=== Parceiros possivelmente duplicados ===');
findSimilar(parceiros).forEach((p) => console.log(p[2], '|', p[0], '<->', p[1]));
console.log('total parceiros', parceiros.length);

console.log('\n=== Profissionais possivelmente duplicados ===');
findSimilar(profissionais).forEach((p) => console.log(p[2], '|', p[0], '<->', p[1]));
console.log('total profissionais', profissionais.length);
