import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../apps/mobile/assets/sounds");
const outPath = path.join(outDir, "gong.wav");

const sampleRate = 22050;
const duration = 1.2;
const samples = Math.floor(sampleRate * duration);
const freq = 220;
const buf = Buffer.alloc(44 + samples * 2);

buf.write("RIFF", 0);
buf.writeUInt32LE(36 + samples * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(samples * 2, 40);

for (let i = 0; i < samples; i++) {
  const t = i / sampleRate;
  const env = Math.exp(-3.5 * t) * Math.sin((Math.PI * t) / duration);
  const s =
    Math.sin(2 * Math.PI * freq * t) * 0.55 +
    Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.25;
  buf.writeInt16LE(
    Math.max(-32767, Math.min(32767, Math.floor(s * env * 28000))),
    44 + i * 2
  );
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, buf);
console.log("Written", outPath, buf.length, "bytes");
