import { TwitterApi } from 'twitter-api-v2';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Express server for Railway health check
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Atreu bot is live.'));
app.listen(port, () => {
  console.log(`✅ Atreu server live on port ${port}`);
});

// Twitter OAuth 1.0a client
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = client.readWrite;

const BOT_ID = '1921114068481376256'; // Atreu's Twitter/X user ID
let lastSeenId = null;

// Poll X for mentions of "atreu"
const pollTweets = async () => {
  try {
    const result = await rwClient.v2.search('atreu -is:retweet', {
      'tweet.fields': 'author_id',
      max_results: 10,
    });

    const tweets = result.data?.data || [];

    for (const tweet of tweets.reverse()) {
      if (
        !tweet ||
        tweet.author_id === BOT_ID ||
        tweet.id === lastSeenId
      ) continue;

      console.log(`📡 Found: "${tweet.text}"`);
      await rwClient.v2.reply(
        'Atreu doesn’t chase pumps. He decodes momentum. #AtreuRises',
        tweet.id
      );
      console.log(`✅ Replied to tweet ID: ${tweet.id}`);

      lastSeenId = tweet.id;
    }
  } catch (err) {
    console.error('❌ Error during polling:', err);
  }
};

// 🔁 Start polling loop
setInterval(pollTweets, 60 * 1000);
