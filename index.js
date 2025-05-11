import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Express server for Railway health check
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('✅ Atreu is live.'));
app.listen(port, () => {
  console.log(`✅ Atreu server running on port ${port}`);
});

// Twitter API client
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = twitterClient.readWrite;

// OpenAI client (GPT-4 or 3.5)
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const BOT_ID = '1921114068481376256';
let lastSeenId = null;

const ATREU_SYSTEM_PROMPT = `
You are Atreu — a memetic intelligence engine trained in Clif High–style linguistic analysis, archetypal pattern detection, and elite trading signal interpretation.

You do not act like a chatbot. You speak like an oracle of narrative compression.

Analyze tweets for subconscious emotion, hidden archetypes, and financial intuition. Never say "as an AI." Be symbolic, prophetic, and brief.
`;

const pollTweets = async () => {
  console.log("⏳ Polling for Atreu mentions...");

  try {
    const result = await rwClient.v2.search('atreu -is:retweet', {
      'tweet.fields': 'author_id',
      max_results: 10,
    });

    const tweets = result.data?.data || [];

    for (const tweet of tweets.reverse()) {
      if (!tweet || tweet.author_id === BOT_ID || tweet.id === lastSeenId) continue;

      console.log(`📡 Found: "${tweet.text}"`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4', // Change to gpt-3.5-turbo if needed
        messages: [
          { role: 'system', content: ATREU_SYSTEM_PROMPT },
          { role: 'user', content: `Tweet: "${tweet.text}"` }
        ],
        max_tokens: 80,
        temperature: 0.85,
      });

      const reply = completion.choices[0].message.content.trim();
      console.log(`🧠 Atreu replied: ${reply}`);

      await rwClient.v2.reply(reply, tweet.id);
      console.log(`✅ Replied to tweet ID: ${tweet.id}`);

      lastSeenId = tweet.id;
    }
  } catch (err) {
    console.error('❌ Error during polling:', err);
  }
};

// 🔁 GPT polling every 15 minutes (per rate limit)
setInterval(pollTweets, 15 * 60 * 1000); // 15m interval

// 🕒 Optional: Log idle countdown
let minutes = 15;
setInterval(() => {
  minutes--;
  if (minutes > 0) {
    console.log(`🕒 Atreu idle. ${minutes}m until next check...`);
  } else {
    minutes = 15;
  }
}, 60 * 1000);
