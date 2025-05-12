// index.js

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { interpretArchetype } from './replies/archetypes.js';

// Updated tweet filter with wider keyword detection
export function filterRelevantTweets(tweets) {
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();

    const isRelevant =
      text.includes('atreu') ||
      text.includes('mirror') ||
      text.includes('meme') ||
      text.includes('what do you think') ||
      text.includes('burn') ||
      text.includes('cook') ||
      text.includes('cookin') ||
      text.includes('signal') ||
      text.includes('truth') ||
      text.includes('real') ||
      text.includes('jeet') ||
      text.includes('top holder') ||
      text.includes('soon') ||
      text.includes('whale') ||
      text.includes('trash') ||
      text.includes('fire bot') ||
      text.includes('beast mode') ||
      text.includes('check out');

    if (!isRelevant) {
      console.log(`🚫 Filtered out: ${tweet.text}`);
    } else {
      console.log(`✅ Kept: ${tweet.text}`);
    }

    return isRelevant;
  });
}

dotenv.config();

console.log("🧠 Atreu startup sequence initiated...");

const app = express();
const port = process.env.PORT || 8080;

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

const rwClient = client.readWrite;

let BOT_USER_ID;
let memory = [];

try {
  memory = JSON.parse(fs.readFileSync('./memory.json', 'utf8'));
} catch (err) {
  console.error('⚠️ Could not load memory.json, using empty memory.');
  memory = [];
}

app.listen(port, () => {
  console.log(`✅ Atreu server running on port ${port}`);
  pollLoop();
});

async function pollLoop() {
  if (!BOT_USER_ID) {
    const me = await rwClient.v2.me();
    BOT_USER_ID = me.data.id;
    console.log(`🤖 Atreu ID loaded: ${BOT_USER_ID}`);
  }

  setInterval(async () => {
    console.log('🔍 Atreu scanning for direct mentions...');

    try {
      const result = await rwClient.v2.userMentionTimeline(BOT_USER_ID, {
        max_results: 10,
      });

      const tweets = Array.isArray(result?.data?.data) ? result.data.data : [];

      console.log(`📥 Pulled ${tweets.length} tweets from mention timeline:`);

      for (const t of tweets) {
        console.log(`🧾 Raw tweet: ${t.text}`);
      }

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        if (memory.includes(tweet.id)) {
          console.log(`🧠 Skipping already replied tweet: ${tweet.id}`);
          continue;
        }

        const reply = interpretArchetype(tweet.text);
        if (reply) {
          await rwClient.v2.tweet({
            text: `${reply} 🤖 Automated`,
            reply: {
              in_reply_to_tweet_id: tweet.id
            }
          });
          console.log(`✅ Replied to ${tweet.id}`);

          memory.push(tweet.id);
          fs.writeFileSync('./memory.json', JSON.stringify(memory, null, 2));
          console.log(`💾 Stored tweet ${tweet.id} to memory`);
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err?.data || err.message || err);
    }

  }, 5 * 60 * 1000);
}
