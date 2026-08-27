const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\actions\\ai-scan.ts';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // We have "const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });" duplicated in the same scope.
  // The first occurrence is usually right under "// 2. Inisialisasi Model..."
  // The second occurrence is right above "const result = await model.generateContent(request);"
  
  // We can just remove ALL lines that have "const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });" 
  // EXCEPT the ones immediately followed by "const result = await model.generateContent(request);"
  // Wait, easier: just replace ALL `const model =` with `let model =` at the top? No, `Identifier 'model' has already been declared`.
  // Let's just remove the first ones.
  
  content = content.replace(/\/\/\s*2\.\s*Inisialisasi Model.*?\n\s*const model = genAI\.getGenerativeModel\(\{ model: "gemini-1\.5-flash" \}\);\n/g, "");
  
  fs.writeFileSync(path, content);
}
