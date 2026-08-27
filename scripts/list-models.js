const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    const pkg = require(path.join(__dirname, '../package.json'));
    console.log("Package version:", pkg.dependencies['@google/generative-ai']);
    
    const testModels = [
      "gemini-pro",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro-latest",
      "gemini-2.0-flash-exp",
      "gemini-flash-latest"
    ];
    
    for (const m of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent("Hi");
        console.log(`Model ${m} works! Response:`, res.response.text());
        break; // Stop on first working model
      } catch (err) {
        console.log(`Model ${m} failed:`, err.message);
      }
    }
  } catch (error) {
    console.error("List error:", error);
  }
}

listModels();
