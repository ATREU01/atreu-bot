import { TwitterApi } from 'twitter-api-v2';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

const rwClient = client.readWrite;
const botUserId = '1921114068481376256'; // Atreu bot's actual ID

// Express health route
app.get('/', async (req, res) => {
  try {
    const me = await client.v2.me();
    res.send(`Atreu bot active. Connected as @${me.data.username}`);
  } catch (e) {
    res.status(500).send(`Error: ${e}`);
  }
});

app.listen(port, () => {
  console.log(`Atreu bot running on port ${port}`);
});

// Twitter stream + reply logic
(async () => {
  try {
    const stream = await rwClient.v2.searchStream({
      'tweet.fields': ['author_id'],
    });

    console.log('🟢 Atreu is now watching for mentions on X...');

    for await (const { data } of stream) {
      if (!data || data.author_id === botUserId) continue;

      const text = data.text.toLowerCase();
      if (text.includes('atreu')) {
        const reply = 'Atreu doesn’t chase charts. He decodes momentum. #AtreuRises';
        await rwClient.v2.reply(reply, data.id);
        console.log(`↪ Replied to tweet ID: ${data.id}`);
      }
    }
  } catch (err) {
    console.error('❌ Stream error:', err);
  }
})();
