require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in environment variables.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('Bot is running! Send a message to your bot on Telegram to get your Chat ID.');

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log('====================================');
  console.log(`Your Chat ID is: ${chatId}`);
  console.log('Add this to your .env file as TELEGRAM_CHAT_ID');
  console.log('====================================');
  bot.sendMessage(chatId, `Your Chat ID is: ${chatId}\n\nAdd this to your .env file!`);
});
