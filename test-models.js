require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  try {
    const response = await ai.models.list();
    // In @google/genai, ai.models.list() might not exist. Let's try calling an endpoint.
    // Actually, let's just use fetch if we need to.
  } catch (e) {
    console.error(e);
  }
}

async function listFetch() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    console.log(data.models.map(m => m.name).filter(name => name.includes('flash')));
}
listFetch();
