import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import { interpretArchetype } from './replies/archetypes.js';
import { filterRelevantTweets } from './utils/resonance.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// Twitter API (OAuth 1.0a for replies)
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = client.readWrite;

// Start express server + begin polling loop
app.listen(port, () => {
  console.log(`✅ Atreu server running on port ${port}`);
  pollLoop(); // start bot loop
});

// Main polling + reply logic
function pollLoop() {
  setInterval(async () => {
    console.log('🔍 Atreu scanning for resonance...');

    try {
      const query = 'atreu OR $atreu OR mirror OR archetype OR gmgn -is:retweet';
      const result = await rwClient.v2.search(query, {
        max_results: 10
      });

      const tweets = result?.data?.data || [];

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        const reply = interpretArchetype(tweet.text);
        if (reply) {
          await rwClient.v2.reply(`${reply} 🤖 Automated`, tweet.id);
          console.log(`✅ Replied to ${tweet.id}`);
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err.message || err);
    }

  }, 5 * 60 * 1000); // every 5 minutes
}
