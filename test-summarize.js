require('dotenv').config();
const { fetchNews } = require('./src/fetcher');
const { summarizeCategory } = require('./src/summarizer');

async function test() {
  console.log("Fetching news...");
  const newsData = await fetchNews();
  const techCategory = newsData.find(c => c.category === 'Tech & AI');
  
  if (!techCategory) {
    console.log("Tech category not found");
    return;
  }
  
  console.log(`Found ${techCategory.items.length} items in Tech & AI. Summarizing...`);
  const startTime = Date.now();
  const summary = await summarizeCategory(techCategory.category, techCategory.items);
  const endTime = Date.now();
  
  console.log(`Summary completed in ${(endTime - startTime) / 1000} seconds.`);
  console.log("Length of summary:", summary.length, "characters");
}

test();
