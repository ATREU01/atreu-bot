// index.js

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import { interpretArchetype } from './replies/archetypes.js';
import { filterRelevantTweets } from './utils/resonance.js';

dotenv.config();

console.log("🧠 Atreu startup sequence initiated...");

const app = express();
const port = process.env.PORT || 8080;

// Twitter API client using OAuth 1.0a
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

const rwClient = client.readWrite;

// Start server + polling loop
app.listen(port, () => {
  console.log(`✅ Atreu server running on port ${port}`);
  pollLoop();
});

// Poll every 5 minutes for mentions of @Atr3uAi
function pollLoop() {
  setInterval(async () => {
    console.log('🔍 Atreu scanning for mentions...');

    try {
      const result = await rwClient.v2.search({
        query: '@Atr3uAi -is:retweet',
        max_results: 10,
      });

      const tweets = Array.isArray(result?.data) ? result.data : [];

      console.log(`📥 Pulled ${tweets.length} tweets from mentions:`);

      for (const t of tweets) {
        console.log(`🧾 Raw tweet: ${t.text}`);
      }

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        const reply = interpretArchetype(tweet.text);
        if (reply) {
          await rwClient.v2.tweet({
            text: `${reply} 🤖 Automated`,
            reply: {
              in_reply_to_tweet_id: tweet.id
            }
          });
          console.log(`✅ Replied to ${tweet.id}`);
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err?.data || err.message || err);
    }

  }, 5 * 60 * 1000); // every 5 minutes
}
