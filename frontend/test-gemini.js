require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_API_KEY found in .env");
    process.exit(1);
  }
  console.log("Found API Key starting with:", apiKey.substring(0, 10));

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello! Are you there?");
    console.log("Success! Response:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message || err);
  }
}

testGemini();
