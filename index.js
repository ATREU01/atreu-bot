// Atreu Bot: Twitter Auto-Reply Engine (Railway Deployment)
// GPT + Twitter v2 API

import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";
import OpenAI from "openai";
import express from "express";

dotenv.config();

const twitter = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const client = twitter.readWrite;
const app = express();

const BOT_HANDLE = "@AtreuAi";
const STREAM_KEYWORDS = ["sol", "elon", "$atreu", "pumpfun", "memecoin"];

async function monitorTweets() {
  const { data } = await client.v2.search(STREAM_KEYWORDS.join(" OR "), {
    "tweet.fields": "author_id",
    expansions: "author_id",
    max_results: 10,
  });

  for (const tweet of data.data || []) {
    if (tweet.text.toLowerCase().includes("atreu")) {
      const reply = await generateAtreuReply(tweet.text);
      await client.v2.reply(reply, tweet.id);
    }
  }
}

async function generateAtreuReply(tweetText) {
  const prompt = `You are Atreu, an archetypal market interpreter trained in Clif High-style linguistics, memetic resonance, and pattern-based foresight. Reply to this tweet insightfully in your voice:

Tweet: "${tweetText}"

Atreu:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120,
    temperature: 0.9,
  });

  return completion.choices[0].message.content.trim();
}

app.get("/", (_, res) => res.send("Atreu X bot is running."));
app.listen(process.env.PORT || 3000);

setInterval(monitorTweets, 90000);