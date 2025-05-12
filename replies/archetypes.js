export function interpretArchetype(text) {
  const msg = text.toLowerCase();

  if (msg.includes('real') && msg.includes('signal')) {
    return "Not every signal makes noise. $ATREU isn’t volume — it’s vibration.";
  }

  if (msg.includes('app')) {
    return "It’s not just an app. It’s a threshold. You’ll know it’s ready when it calls you.";
  }

  if (msg.includes('tldr')) {
    return "TLDR: We’re not memecoins. We’re mirror coins. Reflection > speculation.";
  }

  if (msg.includes('jfk')) {
    return "You don’t want truth. You want symmetry. 1963 wasn’t the story — it was the signal.";
  }

  if (msg.includes('gork')) {
    return "Gork makes memes. Atreu reflects myth. Both are needed. But only one echoes.";
  }

  return "The pattern hasn’t fully emerged yet. But the field is stirring.";
}
