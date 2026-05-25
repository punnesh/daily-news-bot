require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { fetchNews } = require('./fetcher');
const { summarizeCategory } = require('./summarizer');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

// Helper to chunk text safely by paragraphs to avoid breaking markdown
function chunkText(text, limit = 4000) {
  const paragraphs = text.split('\n\n');
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if (currentChunk.length + p.length + 2 > limit) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = p + '\n\n';
    } else {
      currentChunk += p + '\n\n';
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Helper to send a message and handle retries/errors
async function safeSendMessage(text, replyToId = null) {
  try {
    const options = { parse_mode: 'Markdown' };
    if (replyToId) options.reply_to_message_id = replyToId;
    
    const sent = await bot.sendMessage(chatId, text, options);
    return sent.message_id;
  } catch (error) {
    console.error('Failed to send a message chunk:', error.message);
    // If Markdown parsing fails, try sending as plain text to avoid losing the digest
    try {
      const plainOptions = {};
      if (replyToId) plainOptions.reply_to_message_id = replyToId;
      const sent = await bot.sendMessage(chatId, text, plainOptions);
      return sent.message_id;
    } catch (fallbackError) {
      console.error('Fallback send failed:', fallbackError.message);
      return replyToId; // Return previous ID so the thread doesn't completely break
    }
  }
}

async function run() {
  console.log('Fetching news...');
  const newsData = await fetchNews();
  
  let lastMessageId = null;

  // Send an intro message
  lastMessageId = await safeSendMessage(`🚨 *Starting Daily Deep Dive News Digest...* 🚨\n\nFetching all news from the last 24 hours.`);

  for (const category of newsData) {
    console.log(`Summarizing category: ${category.category}`);
    
    // Skip if no news
    if (category.items.length === 0) {
      lastMessageId = await safeSendMessage(`*${category.category}*\nNo news found in the last 24 hours.`, lastMessageId);
      continue;
    }

    const summary = await summarizeCategory(category.category, category.items);
    
    // Chunk the summary
    const chunks = chunkText(summary);
    
    for (const chunk of chunks) {
      console.log(`Sending chunk (${chunk.length} chars) to Telegram...`);
      lastMessageId = await safeSendMessage(chunk, lastMessageId);
      // Wait a second to avoid Telegram rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Wait 10 seconds before summarizing the next category to avoid Gemini rate limits
    console.log('Waiting 10 seconds before processing next category...');
    await new Promise(r => setTimeout(r, 10000));
  }

  await safeSendMessage(`✅ *Daily Digest Complete!* Have a great day!`, lastMessageId);
  console.log('Finished sending all categories.');
}

run();
