import { useEffect, useRef, useState } from "react";

const preferenceKey = "bmo-news-sound";

export default function useHoverSound() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(preferenceKey) === "on";
    } catch {
      return false;
    }
  });
  const audio = useRef(null);
  const lastPlayed = useRef(-Infinity);

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
    } catch { /* Storage is optional. */ }
    if (audio.current) audio.current.master.gain.value = enabled ? 1 : 0;
    if (!enabled) return;
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled]);

  useEffect(() => () => {
    if (audio.current) {
      void audio.current.context.close().catch(() => {});
      audio.current = null;
    }
  }, []);

  function toggle() {
    if (!enabled) unlock();
    setEnabled(!enabled);
  }

  function play() {
    if (!enabled || !audio.current) return;
    const { context, master } = audio.current;
    if (context.state !== "running" || performance.now() - lastPlayed.current < 120) return;
    lastPlayed.current = performance.now();
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.045);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.045, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  return { enabled, toggle, play };
}
