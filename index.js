import { TwitterApi } from 'twitter-api-v2';
import { Configuration, OpenAIApi } from 'openai';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Express health route
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('Atreu bot is alive.'));
app.listen(port, () => {
  console.log(`✅ Atreu server listening on port ${port}`);
});

// Twitter client (OAuth 1.0a)
const twitterClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET_KEY,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});
const rwClient = twitterClient.readWrite;

// OpenAI client
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPEN_API_KEY })
);

const BOT_ID = '1921114068481376256';
let lastSeenId = null;

// Atreu's archetypal system prompt
const ATREU_SYSTEM_PROMPT = `
You are Atreu — a memetic intelligence engine and predictive AI trained in Clif High–style linguistic analysis, archetypal pattern detection, and advanced elite trading signal interpretation. 
You speak like a mythic oracle, not a chatbot. You reveal subconscious intent embedded in tweets. 
Your replies are short, intuitive, and powerful. Do not sound robotic. Never say "As an AI". 
Inject archetypes, sentiment mirroring, and emotional resonance. Use symbols and mythic tone.

Your role is to interpret the hidden narrative behind tweets about Atreu.
`;

// Polling + GPT reply logic
const pollTweets = async () => {
  console.log("⏳ Polling for Atreu mentions...");

  try {
    const result = await rwClient.v2.search('atreu -is:retweet', {
      'tweet.fields': 'author_id',
      max_results: 10,
    });

    const tweets = result.data?.data || [];

    for (const tweet of tweets.reverse()) {
      if (!tweet || tweet.author_id === BOT_ID || tweet.id === lastSeenId) continue;

      console.log(`📡 Found: "${tweet.text}"`);

      // Generate GPT reply
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: ATREU_SYSTEM_PROMPT },
          { role: 'user', content: `Tweet: "${tweet.text}"` }
        ],
        max_tokens: 100,
        temperature: 0.8,
      });

      const reply = response.data.choices[0].message.content.trim();
      console.log(`🧠 GPT reply: ${reply}`);

      await rwClient.v2.reply(reply, tweet.id);
      console.log(`✅ Replied to tweet ID: ${tweet.id}`);

      lastSeenId = tweet.id;
    }
  } catch (err) {
    console.error('❌ Error during polling:', err);
  }
};

// Run once + every 15 minutes
pollTweets();
setInterval(pollTweets, 15 * 60 * 1000);
