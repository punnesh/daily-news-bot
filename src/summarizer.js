require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function summarizeCategory(categoryName, items) {
  let rawText = '';
  for (const item of items) {
    rawText += `- Title: ${item.title}\n  Link: ${item.link}\n  Snippet: ${item.contentSnippet}\n\n`;
  }

  if (!rawText.trim()) return `No major news in *${categoryName}* today.`;

  const prompt = `
You are an expert news curator and editor. I am providing you with today's top news headlines for the category: ${categoryName}.
Your task is to write a readable, beautiful, and highly structured daily digest for a professional.

Here is the raw news data:
${rawText}

CRITICAL INSTRUCTIONS:
1. Summarize EVERY distinct and important news story from the data provided. DO NOT skip major stories.
2. For EVERY story you include, you MUST write at least 60 words of detailed, analytical summary explaining the news and why it matters. 
3. Include the link to the story so the user can read more.
4. Format the output in Telegram-friendly Markdown:
   - Use bold for titles: *Story Title*
   - Use links: [Read more](url)
   - Do NOT use complex markdown like headers (#) or tables.

Start directly with the news items. Make it engaging, analytical, and highly detailed (60+ words per item).
  `;

  // We will try up to 3 times in case of rate limits or temporary errors
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          // Lowering the safety filters because World News/Geopolitics often trigger false positives
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        }
      });
      return `🌅 *Daily News Digest: ${categoryName}*\n\n` + response.text;
    } catch (error) {
      console.error(`Attempt ${4 - retries} failed for ${categoryName}:`, error.message);
      retries--;
      if (retries === 0) {
        return `Failed to generate news summary for ${categoryName} after multiple attempts. (Error: ${error.message})`;
      }
      // Wait 25 seconds before trying again to let the rate limit completely reset
      console.log(`Waiting 25 seconds before retrying ${categoryName}...`);
      await sleep(25000);
    }
  }
}

module.exports = { summarizeCategory };
