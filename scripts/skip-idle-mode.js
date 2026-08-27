const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // 1. Change default mode to 'manual'
  content = content.replace("const [mode, setMode] = useState<'idle' | 'manual' | 'import_select' | 'import'>('idle');", "const [mode, setMode] = useState<'idle' | 'manual' | 'import_select' | 'import'>('manual');");

  // 2. Remove idle mode block
  const idleRegex = /\/\/\s*=====================\s*IDLE MODE \/ MODE SELECTION\s*=====================\s*if \(mode === 'idle'\) \{[\s\S]*?\}\s*\/\/\s*=====================\s*IMPORT SELECT MODAL\s*=====================/;
  content = content.replace(idleRegex, "// ===================== IMPORT SELECT MODAL =====================");

  fs.writeFileSync(path, content);
}
