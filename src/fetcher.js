const Parser = require('rss-parser');
const parser = new Parser();

const feeds = {
  'Tech & AI': [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://news.google.com/rss/search?q=OpenAI+OR+Anthropic+OR+"AI+startups"&hl=en-US&gl=US&ceid=US:en' // Special feed for AI specific updates
  ],
  'Startups & Business': [
    'https://news.ycombinator.com/rss',
    'https://www.livemint.com/rss/news', // Mint RSS for Business/India
  ],
  'Geopolitics & India': [
    'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    'http://feeds.bbci.co.uk/news/world/rss.xml'
  ]
};

async function fetchNews() {
  const allNews = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  for (const [category, urls] of Object.entries(feeds)) {
    let categoryNews = [];
    for (const url of urls) {
      try {
        const feed = await parser.parseURL(url);
        
        // Filter items that were published in the last 24 hours
        let recentItems = feed.items.filter(item => {
          if (!item.pubDate) return true; // Keep if no date available
          const pubDate = new Date(item.pubDate);
          return pubDate > oneDayAgo;
        });

        // Hard cap at 20 items per feed to prevent massive context payloads that crash the LLM
        recentItems = recentItems.slice(0, 20).map(item => ({
          title: item.title,
          link: item.link,
          contentSnippet: item.contentSnippet || item.content || ''
        }));
        
        categoryNews.push(...recentItems);
      } catch (error) {
        console.error(`Error fetching feed ${url}:`, error.message);
      }
    }
    allNews.push({ category, items: categoryNews });
  }
  return allNews;
}

module.exports = { fetchNews };
