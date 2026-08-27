const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\actions\\ai-scan.ts';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace all 'const model = ...' with 'var model = ...' to avoid duplicate block-scoped declaration errors
  content = content.replace(/const model = genAI\.getGenerativeModel\(\{ model: "gemini-1\.5-flash" \}\);/g, 'var model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });');
  content = content.replace(/const result = await model\.generateContent\(request\);/g, 'var result = await model.generateContent(request);');

  fs.writeFileSync(path, content);
}
