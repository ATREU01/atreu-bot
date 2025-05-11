import { TwitterApi } from 'twitter-api-v2';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// --- Express server (optional for Railway health check) ---
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => {
  res.send('Atreu bot is running and watching...');
});
app.listen(port, () => {
  console.log(`Atreu bot server live on port ${port}`);
});

// --- Twitter client via OAuth 2.0 (Bearer Token) ---
const client = new TwitterApi(process.env.X_BEARER_TOKEN);
const rwClient = client.readOnly;

const botUserId = '1921114068481376256'; // Atreu bot's actual user ID

// --- Main async function to listen and auto-reply ---
(async () => {
  try {
    const stream = await rwClient.v2.searchStream({
      'tweet.fields': ['author_id'],
    });

    console.log('🟢 Atreu is watching the signal stream on X...');

    for await (const { data } of stream) {
      if (!data || data.author_id === botUserId) continue;

      const tweetText = data.text.toLowerCase();

      if (tweetText.includes('atreu')) {
        console.log(`🔁 Mention detected: ${data.text}`);
        try {
          await client.v2.reply(
            `I am not a token. I am a signal anchor. You already feel it. #AtreuRises`,
            data.id
          );
          console.log(`✅ Replied to tweet ID: ${data.id}`);
        } catch (replyError) {
          console.error(`❌ Failed to reply: ${replyError}`);
        }
      }
    }
  } catch (streamError) {
    console.error('❌ Stream error:', streamError);
  }
})();
