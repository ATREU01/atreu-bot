// index.js

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { interpretArchetype } from './replies/archetypes.js';
import { filterRelevantTweets } from './utils/resonance.js';

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
let resonanceLog = [];

// 🧠 Load memory
try {
  memory = JSON.parse(fs.readFileSync('./memory.json', 'utf8'));
} catch {
  memory = [];
}

// 📜 Load reply log
try {
  resonanceLog = JSON.parse(fs.readFileSync('./resonance-log.json', 'utf8'));
} catch {
  resonanceLog = [];
}

// 🎲 Random character pad for Twitter duplicate detection
function randomSuffix() {
  const suffixes = ['.', '⎯', '—', 'ᐧ', '‎', ' '];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
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
        max_results: 10
      });

      const tweets = Array.isArray(result?.data?.data) ? result.data.data : [];

      console.log(`📥 Pulled ${tweets.length} tweets from mention timeline:`);

      for (const t of tweets) {
        console.log(`🧾 Raw tweet: ${t.text}`);
      }

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        if (memory.includes(tweet.id)) {
          console.log(`🧠 Already replied to tweet: ${tweet.id}`);
          continue;
        }

        const reply = interpretArchetype(tweet.text);
        if (reply) {
          const finalText = `${reply} 🤖 Automated ${randomSuffix()}`;
          try {
            await rwClient.v2.tweet({
              text: finalText,
              reply: {
                in_reply_to_tweet_id: tweet.id
              }
            });

            console.log(`✅ Replied to ${tweet.id}`);
            memory.push(tweet.id);
            fs.writeFileSync('./memory.json', JSON.stringify(memory, null, 2));

            // Log the resonance
            resonanceLog.push({
              id: tweet.id,
              text: tweet.text,
              reply: finalText,
              timestamp: new Date().toISOString()
            });
            fs.writeFileSync('./resonance-log.json', JSON.stringify(resonanceLog, null, 2));
            console.log(`📜 Logged reply for tweet ${tweet.id}`);
          } catch (error) {
            console.error(`❌ Error posting reply to ${tweet.id}:`, error?.data || error.message);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err?.data || err.message || err);
    }

  }, 5 * 60 * 1000); // every 5 minutes
}
