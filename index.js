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
