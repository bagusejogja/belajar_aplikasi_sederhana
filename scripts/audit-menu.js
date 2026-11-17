const fs = require('fs');
const path = require('path');
const root = process.cwd();
const src = fs.readFileSync(path.join(root, 'src/lib/mock-db.ts'), 'utf8');
const menus = [...src.matchAll(/\{ title: '([^']+)', path: '([^']+)'[^}]*?roles: \[([^\]]*)\][^}]*?group: '([^']+)'([^}]*)\}/g)]
  .map(m => ({ title: m[1], path: m[2], roles: m[3].replace(/'/g, ''), group: m[4], hidden: /hiddenInSidebar/.test(m[5]) }));
const pageRoutes = new Set();
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const seg = /^\(.*\)$/.test(e.name) ? '' : '/' + e.name;
      walk(path.join(dir, e.name), rel + seg);
    } else if (e.name === 'page.tsx') {
      pageRoutes.add(rel || '/');
    }
  }
})(path.join(root, 'src/app'), '');
const dash = new Set();
(function walk(dir, rel, inDash) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const isGroup = /^\(.*\)$/.test(e.name);
      walk(path.join(dir, e.name), rel + (isGroup ? '' : '/' + e.name), inDash || e.name === '(dashboard)');
    } else if (e.name === 'page.tsx' && inDash) dash.add(rel || '/');
  }
})(path.join(root, 'src/app'), '', false);
console.log('MENU TANPA HALAMAN:', menus.filter(m => !pageRoutes.has(m.path)).map(m => m.path));
console.log('MENU DI LUAR DASHBOARD (tanpa cek role di layout):', menus.filter(m => pageRoutes.has(m.path) && !dash.has(m.path)).map(m => m.path));
const menuPaths = new Set(menus.map(m => m.path));
console.log('HALAMAN DASHBOARD TANPA ENTRI MENU (hanya admin):', [...dash].filter(p => !menuPaths.has(p) && !p.includes('[')));
console.log('HALAMAN PUBLIK (luar dashboard):', [...pageRoutes].filter(p => !dash.has(p)));
console.log('JUMLAH MENU:', menus.length);
console.log(menus.map(m => `${m.path} | ${m.roles}`).join('\n'));
