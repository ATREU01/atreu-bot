import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const stream = await client.v2.searchStream({
  'tweet.fields': ['referenced_tweets', 'author_id'],
  expansions: ['referenced_tweets.id'],
});

for await (const { data } of stream) {
  const tweetText = data.text;
  const username = data.author_id;

  // Prevent replying to retweets
  if (data.referenced_tweets?.[0]?.type === 'retweeted') continue;

  // Skip tweets from self
  const botUser = await client.v2.me();
  if (username === botUser.data.id) continue;

  const prompt = `You are Atreu, a crypto AI that uses archetypal resonance, memetic energy, and Clif High–style linguistics to assess sentiment and market momentum. The tweet is: "${tweetText}". How should Atreu respond? Keep it short, insightful, and mysterious.`;

  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });

  const reply = aiResponse.choices[0].message.content;
  await client.v2.reply(reply, data.id);
}
