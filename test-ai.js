const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const prompt = 'Berikan hasil dalam format JSON murni dengan kunci: {"ringkasan": "test"}';
    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    };
    const res = await model.generateContent(request);
    console.log(res.response.text());
  } catch(e) {
    console.error(e);
  }
}
run();
