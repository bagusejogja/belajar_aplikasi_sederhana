const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function testGemini() {
  console.log("Using API Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, write a 1-sentence welcome greeting.");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}

testGemini();
