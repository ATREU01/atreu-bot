export function filterRelevantTweets(tweets) {
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();

    const isRelevant =
      text.includes('atreu') ||
      text.includes('mirror') ||
      text.includes('meme') ||
      text.includes('signal') ||
      text.includes('burn') ||
      text.includes('cook') ||
      text.includes('cookin') ||
      text.includes('jeet') ||
      text.includes('llm') ||
      text.includes('ai agent') ||
      text.includes('thank me later') ||
      text.includes('real') ||
      text.includes('is this automated') ||
      text.includes('twitter space') ||
      text.includes('host a space') ||
      text.includes('zero iq') ||
      text.includes('low iq') ||
      text.includes('based') ||
      text.includes('top holder');

    if (!isRelevant) {
      console.log(`🚫 Filtered out: ${tweet.text}`);
    } else {
      console.log(`✅ Kept: ${tweet.text}`);
    }

    return isRelevant;
  });
}
