import { getBmoReaction } from "./reactions.js";

// Frekanslar Hz, zamanlar saniye. Her kategori ayrı bir kısa melodi taşır.
export const soundProfiles = {
  technology: {
    wave: "square",
    notes: [880, 1320],
    spacing: 0.045,
    length: 0.065,
    volume: 0.022,
  },
  economy: {
    wave: "triangle",
    notes: [523.25, 783.99, 1046.5],
    spacing: 0.035,
    length: 0.08,
    volume: 0.06,
  },
  politics: {
    wave: "sine",
    notes: [293.66, 440],
    spacing: 0.075,
    length: 0.09,
    volume: 0.065,
  },
  weather: {
    wave: "sine",
    notes: [783.99, 987.77, 1174.66],
    spacing: 0.045,
    length: 0.11,
    volume: 0.05,
  },
  culture: {
    wave: "triangle",
    notes: [659.25, 830.61, 987.77],
    spacing: 0.055,
    length: 0.12,
    volume: 0.05,
  },
};

export function getSoundSequence(category, event = "hover") {
  const profile = soundProfiles[category] || soundProfiles.technology;
  if (event === "cheer" || event === "cheer-tone") {
    const style = getBmoReaction(category).style;
    // Yerel konuşma sesi yoksa karakterin neşesini yükselen elektronik heceler taşır.
    const notes =
      style === "woohoo"
        ? [
            [420, 880, 0, 0.19],
            [620, 1450, 0.22, 0.34],
          ]
        : style === "yay"
          ? [
              [660, 990, 0, 0.12],
              [880, 1320, 0.14, 0.12],
              [1100, 1650, 0.28, 0.28],
            ]
          : [
              [660, 880, 0, 0.12],
              [880, 1320, 0.17, 0.25],
            ];
    return notes.map(([frequency, endFrequency, start, length]) => ({
      wave: "triangle",
      frequency,
      endFrequency,
      start,
      length,
      volume: 0.06,
    }));
  }
  if (event === "insert") {
    return [
      {
        wave: "triangle",
        frequency: 180,
        endFrequency: 70,
        start: 0,
        length: 0.07,
        volume: 0.09,
      },
      ...profile.notes.map((frequency, index) => ({
        wave: profile.wave,
        frequency,
        start: 0.08 + index * 0.07,
        length: 0.14,
        volume: profile.volume,
      })),
    ];
  }
  if (event === "eject") {
    return [...profile.notes].reverse().map((frequency, index) => ({
      wave: "triangle",
      frequency: frequency * 0.65,
      endFrequency: frequency * 0.5,
      start: index * 0.05,
      length: 0.09,
      volume: 0.05,
    }));
  }
  if (event === "select") {
    return [
      {
        wave: "triangle",
        frequency: profile.notes[0] * 0.5,
        endFrequency: profile.notes[0],
        start: 0,
        length: 0.13,
        volume: 0.045,
      },
    ];
  }
  return profile.notes.map((frequency, index) => ({
    wave: profile.wave,
    frequency,
    start: index * profile.spacing,
    length: profile.length,
    volume: profile.volume,
  }));
}
