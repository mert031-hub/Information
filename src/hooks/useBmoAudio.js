import { useEffect, useRef, useState } from "react";
import { getSoundSequence } from "../data/sounds.js";

const preferenceKey = "bmo-news-sound";

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
      if (audio.current) {
        void audio.current.context.close().catch(() => {});
        audio.current = null;
      }
    },
    [],
  );

  function toggle() {
    if (enabled && audio.current) {
      audio.current.master.gain.value = 0;
      stopVoices();
    }
    if (!enabled) unlock();
    setEnabled(!enabled);
  }

  function stopVoices() {
    for (const voice of voices.current) {
      voice.stop();
    }
    voices.current.clear();
  }

  function play(category, event = "hover") {
    if (!enabled || !audio.current) return;
    const { context, master } = audio.current;
    if (context.state !== "running") return;
    if (event === "hover" && performance.now() - lastPlayed.current < 120)
      return;
    lastPlayed.current = performance.now();
    // Önceki melodiyi temizle; hızlı kart değişimlerinde sesler birikmesin.
    stopVoices();
    for (const tone of getSoundSequence(category, event)) {
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
