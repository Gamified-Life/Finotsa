import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      "Extract bank transactions and current balance. Return JSON with 'balance' (number) and 'transactions' (array of {amount: number, shopName: string}). Return ONLY raw JSON object.",
      { inlineData: { data: imageBase64, mimeType: mimeType } }
    ]);

    let text = result.response.text().trim();
    // Clean JSON
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[EDGE AI] Error:', error);
    return new Response(JSON.stringify({ error: 'AI Edge Extraction failed', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
