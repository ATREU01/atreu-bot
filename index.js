function pollLoop() {
  setInterval(async () => {
    console.log('🔍 Atreu scanning for resonance...');

    try {
      const result = await rwClient.v2.search({
        query: 'atreu OR mirror OR archetype OR gmgn -is:retweet',
        max_results: 10,
      });

      const tweets = result?.data || [];

      const filtered = filterRelevantTweets(tweets);

      for (const tweet of filtered) {
        const reply = interpretArchetype(tweet.text);
        if (reply) {
          await rwClient.v2.tweet({
            text: `${reply} 🤖 Automated`,
            reply: {
              in_reply_to_tweet_id: tweet.id
            }
          });
          console.log(`✅ Replied to ${tweet.id}`);
        }
      }
    } catch (err) {
      console.error('❌ Error polling:', err?.data || err.message || err);
    }
  }, 5 * 60 * 1000);
}
