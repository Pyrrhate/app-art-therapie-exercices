/** Génère des sons synthétiques minimaux (WAV mono 16-bit). */
const fs = require("fs");
const path = require("path");

function writeWav(outPath, freqs, durationSec, decay = 2.8) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * decay) * (1 - Math.exp(-t * 30));
    let sample = 0;
    freqs.forEach((freq, idx) => {
      sample += (0.55 / (idx + 1)) * Math.sin(2 * Math.PI * freq * t);
    });
    sample *= env;
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.floor(clamped * 32767 * 0.85), 44 + i * 2);
  }

  fs.writeFileSync(outPath, buffer);
  console.log("Écrit:", outPath);
}

const outDir = path.join(__dirname, "../apps/mobile/assets/sounds");
fs.mkdirSync(outDir, { recursive: true });

writeWav(path.join(outDir, "gong.wav"), [196, 392, 588], 1.8, 2.8);
writeWav(path.join(outDir, "chime.wav"), [523, 659, 784], 1.2, 4.5);
