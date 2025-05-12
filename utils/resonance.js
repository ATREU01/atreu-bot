export function filterRelevantTweets(tweets) {
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();
    const isRelevant =
      text.includes('atreu') ||
      text.includes('mirror') ||
      text.includes('gmgn') ||
      text.includes('archetype');

    if (!isRelevant) {
      console.log(`🚫 Filtered out: ${tweet.text}`);
    } else {
      console.log(`✅ Kept: ${tweet.text}`);
    }

    return isRelevant;
  });
}
