const fs = require('fs');
const path = require('path');

function walk(dir, res = []) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, res);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) res.push(p);
  });
  return res;
}

const tables = new Set();
walk('src').forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const m = c.matchAll(/from\(['"`]([a-zA-Z0-9_]+)['"`]\)/g);
  for (const match of m) tables.add(match[1]);
});
console.log(Array.from(tables).join('\n'));
