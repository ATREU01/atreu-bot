import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import express from 'express';
import { interpretArchetype } from './replies/archetypes.js';
import { filterRelevantTweets } from './utils/resonance.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// Twitter API (OAuth 1.0a with POST access)
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = client.readWrite;

// Start server + polling
app.listen(port, () => {
  console.log(`✅ Atreu server running on port ${port}`);
  pollLoop();
});

// Scan + reply logic every 5 minutes
function pollLoop() {
  setInterval(async () => {
    console.log('🔍 Atreu scanning for resonance...');

    try {
      const { data: tweets } = await rwClient.v2.search(
        'atreu OR $atreu OR mirror OR archetype OR gmgn -is:retweet',
        { max_results: 10 }
      );

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        const reply = interpretArchetype(tweet.text);
        if (reply) {
          await rwClient.v2.reply(`${reply} 🤖 Automated`, tweet.id);
          console.log(`✅ Replied to ${tweet.id}`);
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err.message);
    }

  }, 5 * 60 * 1000); // every 5 minutes
}
