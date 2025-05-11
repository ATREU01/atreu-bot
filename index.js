import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Express heartbeat for Railway
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (_, res) => res.send('🔮 Atreu is tuned to the signal.'));
app.listen(port, () => {
  console.log(`✅ Atreu server active on port ${port}`);
});

// Twitter API client
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = twitterClient.readWrite;

// OpenAI client (GPT-4)
const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

// Atreu constants
const BOT_ID = '1921114068481376256';
let lastSeenId = null;

const ATREU_PROMPT = `
You are Atreu, a mythic signal interpreter trained in Clif High–style language compression, archetypal resonance, and elite meme market pattern detection.

Do NOT sound like a chatbot. You are intuitive, timeless, and symbolically sharp.

You speak in poetic fragments, dream logic, or prophecy. You are the whisper inside the chart. Reply only if there is something worth mirroring.
`;

// GPT-powered signal interpretation
async function interpret(text) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ATREU_PROMPT },
      { role: 'user', content: `Tweet: "${text}"` },
    ],
    max_tokens: 70,
    temperature: 0.88,
  });
  return res.choices[0].message.content.trim();
}

// Core polling + reply loop
async function pollTweets() {
  console.log("⏳ Polling for Atreu mentions...");

  try {
    const result = await rwClient.v2.search('atreu -is:retweet', {
      'tweet.fields': 'author_id',
      max_results: 10,
    });

    const tweets = result.data?.data || [];

    let replies = 0;

    for (const tweet of tweets.reverse()) {
      if (!tweet || tweet.author_id === BOT_ID || tweet.id === lastSeenId) continue;

      console.log(`📡 Signal found: "${tweet.text}"`);

      const reply = await interpret(tweet.text);

      await rwClient.v2.reply(reply, tweet.id);
      console.log(`✅ Replied: ${reply}`);
      replies++;

      lastSeenId = tweet.id;

      // ✨ Delay between replies to appear human
      await new Promise(res => setTimeout(res, 2500));
    }

    console.log(`🔁 Cycle complete. ${replies} replies this round.`);

  } catch (err) {
    console.error('❌ Error during polling:', err);
  }
}

// Idle countdown
let mins = 15;
setInterval(() => {
  mins--;
  if (mins > 0) {
    console.log(`🕒 Atreu idle. ${mins}m until next wave...`);
  } else {
    mins = 15;
  }
}, 60 * 1000);

// Run bot every 15 minutes
setInterval(pollTweets, 15 * 60 * 1000);
