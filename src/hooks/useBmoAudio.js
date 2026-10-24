import { useEffect, useRef, useState } from "react";
import { getSoundSequence } from "../data/sounds.js";
import { getBmoReaction } from "../data/reactions.js";

const preferenceKey = "bmo-news-sound";

function chooseBmoVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const localEnglish = voices.filter(
    (voice) => voice.localService && /^en(?:-|$)/i.test(voice.lang),
  );
  if (!localEnglish.length) return null;
  // Prefer the clearer, friendlier voices exposed by common desktop browsers;
  // the fallback keeps this deterministic on devices with a single local voice.
  const preferred = /(samantha|ava|zira|jenny|google us english|microsoft).*(natural|online|enhanced)?/i;
  return (
    localEnglish.find((voice) => preferred.test(`${voice.name} ${voice.voiceURI || ""}`)) ||
    localEnglish.find((voice) => /female|woman/i.test(voice.name)) ||
    localEnglish[0]
  );
}

export default function useBmoAudio() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(preferenceKey) === "on";
    } catch {
      return false;
    }
  });
  const audio = useRef(null);
  const lastPlayed = useRef(-Infinity);
  const voices = useRef(new Set());
  const speech = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  function unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!audio.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.connect(context.destination);
        audio.current = { context, master };
      }
      if (audio.current.context.state === "suspended") {
        void audio.current.context.resume().catch(() => {});
      }
    } catch {
      // Audio may be unavailable; card selection still works.
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem(preferenceKey, enabled ? "on" : "off");
    } catch {
      /* Storage is optional. */
    }
    if (audio.current) audio.current.master.gain.value = enabled ? 1 : 0;
    if (!enabled) stopVoices();
    if (!enabled) return;
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled]);

  useEffect(
    () => () => {
      stopVoices();
      if (audio.current) {
        void audio.current.context.close().catch(() => {});
        audio.current = null;
      }
    },
    [],
  );

  function toggle() {
    if (enabled) {
      if (audio.current) audio.current.master.gain.value = 0;
      stopVoices();
    }
    if (!enabled) unlock();
    setEnabled(!enabled);
  }

  function stopVoices() {
    if (speech.current) {
      speech.current = null;
      window.speechSynthesis?.cancel();
    }
    stopOscillators();
  }

  function stopOscillators() {
    for (const voice of voices.current) {
      voice.stop();
    }
    voices.current.clear();
  }

  function play(category, event = "hover") {
    if (!enabledRef.current) return;
    if (event === "stop") {
      stopVoices();
      return;
    }
    const speechEvent = event === "cheer" || event === "insert-cheer";
    let speechPlayed = false;
    if (speechEvent) {
      stopVoices();
      try {
        // Yalnızca cihazdaki İngilizce sesleri kullan; harici TTS servisi gerekmez.
        const voice = chooseBmoVoice();
        if (voice && window.SpeechSynthesisUtterance) {
          const line = new window.SpeechSynthesisUtterance(
            getBmoReaction(category).spoken,
          );
          line.voice = voice;
          line.lang = voice.lang;
          line.pitch = 1.7;
          line.rate = 1.05;
          line.volume = 0.62;
          speech.current = line;
          line.onend = () => {
            if (speech.current === line) speech.current = null;
          };
          line.onerror = () => {
            if (speech.current !== line) return;
            speech.current = null;
            if (enabledRef.current) play(category, "cheer-tone");
          };
          window.speechSynthesis.speak(line);
          speechPlayed = true;
          if (event === "cheer") return;
        }
      } catch {
        /* Yerel ses kullanılamıyorsa aşağıdaki elektronik tepki çalar. */
      }
    }
    if (!audio.current) return;
    const { context, master } = audio.current;
    if (context.state !== "running") return;
    if (event === "hover" && performance.now() - lastPlayed.current < 120)
      return;
    lastPlayed.current = performance.now();
    // Önceki melodiyi temizle; hızlı kart değişimlerinde sesler birikmesin.
    stopOscillators();
    let sequence = getSoundSequence(
      category,
      event === "insert-cheer" ? "insert" : event,
    );
    if (event === "insert-cheer" && !speechPlayed) {
      sequence = [
        ...sequence,
        ...getSoundSequence(category, "cheer-tone").map((tone) => ({
          ...tone,
          start: tone.start + 0.38,
        })),
      ];
    }
    for (const tone of sequence) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + tone.start;
      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      if (tone.endFrequency)
        oscillator.frequency.exponentialRampToValueAtTime(
          tone.endFrequency,
          start + tone.length,
        );
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(tone.volume, start + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + tone.length);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(start);
      oscillator.stop(start + tone.length + 0.01);
      voices.current.add(oscillator);
      oscillator.onended = () => {
        voices.current.delete(oscillator);
        oscillator.disconnect();
        envelope.disconnect();
      };
    }
  }

  return { enabled, toggle, play };
}
