import { TwitterApi } from 'twitter-api-v2';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Express health route for Railway
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Atreu bot is running.');
});
app.listen(port, () => {
  console.log(`Atreu server live on port ${port}`);
});

// Twitter OAuth 1.0a auth (fully env-secured)
const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = client.readWrite;

const BOT_ID = '1921114068481376256'; // do not expose in .env for security, this is public data
let lastSeenId = null;

const pollTweets = async () => {
  try {
    const searchParams = {
      query: 'atreu -is:retweet',
      'tweet.fields': 'author_id',
      max_results: 10,
    };

    const result = await rwClient.v2.search(searchParams);
    const tweets = result.data?.data || [];

    for (const tweet of tweets.reverse()) {
      if (tweet.author_id === BOT_ID || tweet.id === lastSeenId) continue;

      console.log(`📡 Found tweet: ${tweet.text}`);

      await rwClient.v2.reply(
        `Atreu doesn't chase pumps. He decodes momentum. You already feel it. #AtreuRises`,
        tweet.id
      );
      console.log(`✅ Replied to tweet ID: ${tweet.id}`);

      lastSeenId = tweet.id;
    }
  } catch (error) {
    console.error('❌ Error during polling:', error);
  }
};

// 🔁 Poll every 60 seconds
setInterval(pollTweets, 60 * 1000);
