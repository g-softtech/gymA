require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
async function test() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const prompt = 'Create a personalised daily meal plan for a Nigerian gym member:\n- Daily calorie target: 2000 kcal\n- Goal: WEIGHT LOSS\n- Allergies/restrictions: none\n- Food preferences: Nigerian foods preferred\n\nRespond ONLY with valid JSON:\n{ "title": "meal plan title", "totalCalories": 2000, "protein": 0, "carbs": 0, "fats": 0, "meals": [], "tips": [], "substitutions": [] }';
    const result = await model.generateContent(prompt);
    console.log('SUCCESS:', result.response.text());
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();
