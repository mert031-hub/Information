export const bmoReactions = {
  technology: { text: "LET'S PLAY!", spoken: "Let's play!", style: "play" },
  economy: { text: "UWHUUUU!", spoken: "Woo hoo!", style: "woohoo" },
  politics: { text: "LET'S PLAY!", spoken: "Let's play!", style: "play" },
  weather: { text: "UWHUUUU!", spoken: "Woo hoo!", style: "woohoo" },
  culture: { text: "YAAAY!", spoken: "Yay! Let's play!", style: "yay" },
};

export function getBmoReaction(category) {
  return bmoReactions[category] || bmoReactions.technology;
}
