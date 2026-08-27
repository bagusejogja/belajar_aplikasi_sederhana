const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\actions\\ai-scan.ts';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  // Use a generic regex to replace all fallback patterns
  const regex = /let result;\s*try\s*\{\s*const model = genAI\.getGenerativeModel\(\{ model: "gemini-1\.5-flash" \}\);\s*result = await model\.generateContent\(request\);\s*\}\s*catch\s*\([^)]*\)\s*\{\s*console\.log\([^)]*\);\s*const fallbackModel = genAI\.getGenerativeModel\(\{ model: "gemini-1\.5-pro" \}\);\s*result = await fallbackModel\.generateContent\(request\);\s*\}/g;
  
  content = content.replace(regex, `const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });\n    const result = await model.generateContent(request);`);
  fs.writeFileSync(path, content);
}
