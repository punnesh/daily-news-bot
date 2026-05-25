require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function summarizeCategory(categoryName, items) {
  let rawText = '';
  for (const item of items) {
    rawText += `- Title: ${item.title}\n  Link: ${item.link}\n  Snippet: ${item.contentSnippet}\n\n`;
  }

  // If there's no news for this category today
  if (!rawText.trim()) return `No major news in *${categoryName}* today.`;

  const prompt = `
You are an expert news curator and editor. I am providing you with today's top news headlines for the category: ${categoryName}.
Your task is to write a readable, beautiful, and highly structured daily digest for a professional.

Here is the raw news data:
${rawText}

CRITICAL INSTRUCTIONS:
1. Summarize EVERY distinct and important news story from the data provided. DO NOT skip major stories.
2. For EVERY story you include, you MUST write at least 60 words of detailed, analytical summary explaining the news and why it matters. 
3. If the category is Tech/AI or Business, ensure you explicitly cover any news related to OpenAI, Anthropic, or AI startups.
4. If the category is Geopolitics & India, ensure you highlight news from Indian sources like Mint or Times of India if present.
5. Include the link to the story so the user can read more.
6. Use emojis to make the digest visually appealing.
7. Format the output in Telegram-friendly Markdown:
   - Use bold for titles: *Story Title*
   - Use links: [Read more](url)
   - Do NOT use complex markdown like headers (#) or tables, as Telegram cannot render them well.

Start directly with the news items. Make it engaging, analytical, and highly detailed (60+ words per item).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return `🌅 *Daily News Digest: ${categoryName}*\n\n` + response.text;
  } catch (error) {
    console.error(`Error calling Gemini API for ${categoryName}:`, error);
    return `Failed to generate news summary for ${categoryName}.`;
  }
}

module.exports = { summarizeCategory };
