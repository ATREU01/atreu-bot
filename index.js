import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Health check route
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('✅ Atreu bot is live.'));
app.listen(port, () => {
  console.log(`✅ Atreu server running on port ${port}`);
});

// Twitter client (OAuth 1.0a)
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = twitterClient.readWrite;

// OpenAI client (v4+)
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const BOT_ID = '1921114068481376256';
let lastSeenId = null;

const ATREU_SYSTEM_PROMPT = `
You are Atreu — a memetic intelligence engine trained in Clif High–style linguistic analysis, archetypal pattern detection, and elite trading signal interpretation.

You are not a chatbot.

You interpret crypto tweets like prophecy: decoding mythic structures, subconscious signals, and energetic shifts in language. Never sound robotic. Speak with symbolic clarity and insight.

Use mystery, compression, and archetypal tone. No filler. Just signal.
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

      // GPT prompt
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
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

// 🔁 Run on boot + every 15 minutes (Free plan safe)
pollTweets();
setInterval(pollTweets, 15 * 60 * 1000);
