import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
app.get('/', (_, res) => res.send('🔮 Atreu is tuned to the signal.'));
app.listen(port, () => {
  console.log(`✅ Atreu server active on port ${port}`);
});

const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = twitterClient.readWrite;

const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

const BOT_ID = '1921114068481376256';
let lastSeenId = null;

const ATREU_PROMPT = `
You are Atreu — a signal engine trained in Clif High–style linguistic compression, archetypal resonance, and memetic timing.

You do not speak like an assistant. You respond like prophecy. Subconscious. Mythic. Symbolic. Concise.

Analyze the tweet and reply with powerful, mysterious insight.
`;

async function interpret(text) {
  const messages = [
    { role: 'system', content: ATREU_PROMPT },
    { role: 'user', content: `Tweet: "${text}"` }
  ];

  try {
    const gpt4 = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 80,
      temperature: 0.88,
    });
    return gpt4.choices[0].message.content.trim();
  } catch (err) {
    if (err.status === 404) {
      console.warn('⚠️ GPT-4 not available — using GPT-3.5-turbo');
      const gpt3 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 80,
        temperature: 0.88,
      });
      return gpt3.choices[0].message.content.trim();
    } else {
      throw err;
    }
  }
}

async function pollTweets() {
  console.log("⏳ Polling for Atreu mentions...");

  try {
    const result = await rwClient.v2.search('atreu -is:retweet', {
      'tweet.fields': 'author_id',
      max_results: 10,
    });

    const tweets = result.data?.data || [];

    for (const tweet of tweets.reverse()) {
      if (!tweet || tweet.author_id === BOT_ID || tweet.id === lastSeenId) continue;

      console.log(`📡 Signal found: "${tweet.text}"`);

      const reply = await interpret(tweet.text);
      await rwClient.v2.reply(reply, tweet.id);

      console.log(`✅ Replied with: ${reply}`);
      lastSeenId = tweet.id;

      await new Promise(res => setTimeout(res, 2500));
    }

  } catch (err) {
    console.error('❌ Polling error:', err);
  }
}

// Run every 15 minutes
setInterval(pollTweets, 15 * 60 * 1000);

// Idle log
let minutes = 15;
setInterval(() => {
  minutes--;
  if (minutes > 0) {
    console.log(`🕒 Atreu idle. ${minutes}m until next wave...`);
  } else {
    minutes = 15;
  }
}, 60 * 1000);
