export const bmoReactions = {
  technology: { text: "LET'S PLAY!", spoken: "Let's play!", style: "play" },
  economy: { text: "UWHUUUU!", spoken: "Woo hoo!", style: "woohoo" },
  politics: { text: "OH YEAH!", spoken: "Oh yeah!", style: "yay" },
  weather: { text: "ADVENTURE TIME!", spoken: "Adventure time!", style: "woohoo" },
  culture: { text: "YAAAY!", spoken: "Yay! Let's play!", style: "yay" },
};

export function getBmoReaction(category) {
  return bmoReactions[category] || bmoReactions.technology;
}
