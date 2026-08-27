const fs = require('fs');

const aiScanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/actions/ai-scan.ts';
if (fs.existsSync(aiScanPath)) {
  let content = fs.readFileSync(aiScanPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldModelCall = `    try {
      var model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result = await model.generateContent(request);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      result = await fallbackModel.generateContent(request);
    }`;

  const newModelCall = `    try {
      var model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await model.generateContent(request);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await fallbackModel.generateContent(request);
    }`;

  if (content.includes(oldModelCall)) {
    content = content.replace(oldModelCall, newModelCall);
    console.log('Model name reverted to working gemini-flash-latest.');
  } else {
    console.log('Error: target oldModelCall not found in ai-scan.ts!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(aiScanPath, content);
}
