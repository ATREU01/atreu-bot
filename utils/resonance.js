export function filterRelevantTweets(tweets) {
  if (!tweets || !Array.isArray(tweets)) return [];

  return tweets.filter(tweet => {
    const t = tweet.text.toLowerCase();
    return (
      !t.includes('airdrop') &&
      !t.includes('follow for') &&
      t.length > 10 &&
      t.length < 280
    );
  });
}
