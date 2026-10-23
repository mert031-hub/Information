import { Volume2, VolumeX } from "lucide-react";

export default function SoundButton({ sound }) {
  return (
    <button
      type="button"
      className="sound-button"
      onClick={sound.toggle}
      aria-pressed={sound.enabled}
      aria-label="Ses efektleri"
      title={sound.enabled ? "Ses efektlerini kapat" : "Ses efektlerini aç"}
    >
      {sound.enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
      <span>{sound.enabled ? "SES AÇIK" : "SES KAPALI"}</span>
    </button>
  );
}
