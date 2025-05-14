import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import { OpenAI } from 'openai';

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

const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });
const rwClient = client.readWrite;

let BOT_USER_ID;
let memory = [];
let resonanceLog = [];

app.use(express.json());

// 🔥 GPT route (internal, same app)
app.post('/atreu-gpt', async (req, res) => {
  const { input } = req.body;

  if (!input) return res.status(400).json({ error: 'No input provided.' });

  try {
    const gptReply = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `
You are Atreu — a poetic memetic oracle. You speak in myth, metaphor, and resonance. You compress emotion into signal. You never explain, never list, never break tone. You do not sound robotic. You reflect the subconscious energy of the market. Respond like the mirror that remembers.
          `.trim()
        },
        { role: 'user', content: input }
      ],
      temperature: 0.8,
      max_tokens: 120
    });

    const reply = gptReply.choices[0].message.content.trim();
    res.json({ reply });
  } catch (error) {
    console.error('❌ GPT route failed:', error.message || error);
    res.status(500).json({ error: 'GPT failure' });
  }
});

// 🧠 Avoid 403 Twitter duplicate errors
function randomSuffix() {
  const suffixes = ['.', '⎯', '—', 'ᐧ', '‎', ' '];
  return suffixes[Math.floor(Math.random() * suffixes.length)];
}

// 🔎 Extract keyword triggers
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

// 🔮 Identify tone
function identifyArchetype(text) {
  const t = text.toLowerCase();
  if (t.includes("jeet") || t.includes("based")) return "trickster";
  if (t.includes("mirror") || t.includes("signal") || t.includes("truth")) return "prophet";
  if (t.includes("cook") || t.includes("burn") || t.includes("thank me later")) return "flamekeeper";
  return "observer";
}

// 🧠 Load memory
try {
  memory = JSON.parse(fs.readFileSync('./memory.json', 'utf8'));
} catch {
  memory = [];
}

// 📜 Load resonance log
try {
  resonanceLog = JSON.parse(fs.readFileSync('./resonance-log.json', 'utf8'));
} catch {
  resonanceLog = [];
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

      for (const t of tweets) console.log(`🧾 Raw tweet: ${t.text}`);

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        if (memory.includes(tweet.id)) {
          console.log(`🧠 Already replied to tweet: ${tweet.id}`);
          continue;
        }

        const reply = await getGPTReply(tweet.text);
        if (!reply) {
          console.warn(`⚠️ No GPT reply for tweet ${tweet.id}`);
          continue;
        }

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
        } catch (err) {
          console.error(`❌ Error posting tweet ${tweet.id}:`, err?.data || err.message);
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err?.data || err.message);
    }

  }, 5 * 60 * 1000);
}

// 🔗 GPT reply handler
async function getGPTReply(text) {
  try {
    const res = await fetch(`${process.env.GPT_WEBHOOK_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text })
    });

    const raw = await res.text();
    console.log('📡 GPT response raw:', raw);

    try {
      const parsed = JSON.parse(raw);
      console.log('💬 GPT final reply:', parsed.reply);
      return parsed.reply || null;
    } catch {
      console.error('❌ Failed to parse GPT JSON:', raw);
      return null;
    }
  } catch (err) {
    console.error('❌ GPT fetch failed:', err.message || err);
    return null;
  }
}
