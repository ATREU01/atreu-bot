import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch'; // ensure installed via npm if not already

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

// 🎲 Prevent duplicate reply errors
function randomSuffix() {
  const suffixes = ['.', '⎯', '—', 'ᐧ', '‎', ' '];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
}

// 🔎 Extract signals from tweet
function extractSignals(text) {
  const lower = text.toLowerCase();
  const signals = [];
  const keywords = [
    'atreu', 'mirror', 'meme', 'signal', 'burn', 'cook', 'cookin', 'jeet',
    'llm', 'ai agent', 'thank me later', 'real', 'is this automated',
    'twitter space', 'host a space', 'zero iq', 'low iq', 'based', 'top holder'
  ];
  for (const word of keywords) {
    if (lower.includes(word)) signals.push(word);
  }
  return signals;
}

// 🧠 Identify archetype from tweet
function identifyArchetype(text) {
  const t = text.toLowerCase();
  if (t.includes("jeet") || t.includes("based")) return "trickster";
  if (t.includes("mirror") || t.includes("signal") || t.includes("truth")) return "prophet";
  if (t.includes("cook") || t.includes("burn") || t.includes("thank me later")) return "flamekeeper";
  return "observer";
}

// 🧠 Live GPT response from webhook
async function getGPTReply(text) {
  try {
    const response = await fetch(process.env.GPT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text })
    });

    const data = await response.json();
    return data.reply || null;
  } catch (err) {
    console.error('❌ GPT fetch failed:', err.message || err);
    return null;
  }
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

        const reply = await getGPTReply(tweet.text);
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
            const signals = extractSignals(tweet.text);
            const archetype = identifyArchetype(tweet.text);

            resonanceLog.push({
              id: tweet.id,
              text: tweet.text,
              reply: finalText,
              signal: signals,
              archetype: archetype,
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

  }, 5 * 60 * 1000);
}
