const fs = require('fs');
const execSync = require('child_process').execSync;

const path = 'src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const originalContent = execSync(`git show HEAD:${path}`).toString();
let currentContent = fs.readFileSync(path, 'utf8');

// 1. Restore mode = 'idle'
currentContent = currentContent.replace("const [mode, setMode] = useState<'idle' | 'manual' | 'import_select' | 'import'>('manual');", "const [mode, setMode] = useState<'idle' | 'manual' | 'import_select' | 'import'>('idle');");

// 2. Extract idle block from original
const idleRegex = /\/\/\s*=====================\s*IDLE MODE \/ MODE SELECTION\s*=====================\s*if \(mode === 'idle'\) \{[\s\S]*?\}\s*(?=\/\/\s*=====================\s*IMPORT SELECT MODAL\s*=====================)/;
const match = originalContent.match(idleRegex);

if (match && match[0]) {
  currentContent = currentContent.replace("// ===================== IMPORT SELECT MODAL =====================", match[0] + "\n  // ===================== IMPORT SELECT MODAL =====================");
} else {
  console.log("Idle block not found in HEAD");
}

// 3. Restore the back button. It was removed by remove-back-btn.js
// The back button was: 
// <button onClick={() => setMode('idle')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors hidden md:block">
//    <ChevronLeft size={20} />
// </button>
// It was right before the mode icon in MAIN FORM RENDERER.
// Also in IMPORT SELECT MODAL.
// Let's just extract the MAIN FORM RENDERER header from original and replace it in current?
// Too risky. Let's extract the whole IMPORT SELECT MODAL and MAIN FORM RENDERER header from original.

// Let's just restore the file from HEAD and re-apply our 4 JS fixes!
// It's much safer and cleaner.
fs.writeFileSync(path, originalContent);

console.log("Restored original file. Now run the fix scripts.");
