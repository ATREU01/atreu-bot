export function filterRelevantTweets(tweets) {
  return tweets.filter(tweet => {
    if (!tweet.text) return false;
    const lower = tweet.text.toLowerCase();
    return lower.includes('atreu') || lower.includes('$atreu') || lower.includes('mirror') || lower.includes('archetype');
  });
}
