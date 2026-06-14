import { Audio } from "expo-av";
import { Platform } from "react-native";

export type TimerSoundId = "gong" | "chime" | "none";

/** Sons de fin de timer — ajoutez d'autres entrées ici. */
export const TIMER_SOUNDS: Record<
  Exclude<TimerSoundId, "none">,
  ReturnType<typeof require>
> = {
  gong: require("../assets/sounds/gong.wav"),
  chime: require("../assets/sounds/chime.wav"),
};

let cachedSound: Audio.Sound | null = null;

function playWebTone(kind: "gong" | "chime"): void {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const freqs = kind === "gong" ? [196, 392, 588] : [523, 659, 784];
  const now = ctx.currentTime;
  const duration = kind === "gong" ? 1.6 : 1.1;

  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22 / (index + 1), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });

  window.setTimeout(() => void ctx.close(), (duration + 0.2) * 1000);
}

export async function playTimerSound(id: TimerSoundId = "gong"): Promise<void> {
  if (id === "none") return;

  if (Platform.OS === "web") {
    playWebTone(id);
    return;
  }

  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    if (cachedSound) {
      await cachedSound.unloadAsync();
      cachedSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(TIMER_SOUNDS[id], {
      shouldPlay: true,
      volume: 0.85,
    });
    cachedSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
        if (cachedSound === sound) cachedSound = null;
      }
    });
  } catch {
    playWebTone(id);
  }
}

export async function previewTimerSound(id: TimerSoundId): Promise<void> {
  await playTimerSound(id);
}
