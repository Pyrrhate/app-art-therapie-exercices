import type { MandalaPath, MandalaSpec, MandalaTheme } from "./types";

const CX = 200;
const CY = 200;
const VIEW = "0 0 400 400";

type Rng = () => number;

function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pickFloat(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

function lotusPetalPath(
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
  width: number
): string {
  const tip = polar(cx, cy, length, angleDeg);
  const left = polar(cx, cy, length * 0.35, angleDeg - width);
  const right = polar(cx, cy, length * 0.35, angleDeg + width);
  const baseL = polar(cx, cy, length * 0.08, angleDeg - 18);
  const baseR = polar(cx, cy, length * 0.08, angleDeg + 18);
  return [
    `M ${baseL[0].toFixed(2)} ${baseL[1].toFixed(2)}`,
    `Q ${left[0].toFixed(2)} ${left[1].toFixed(2)} ${tip[0].toFixed(2)} ${tip[1].toFixed(2)}`,
    `Q ${right[0].toFixed(2)} ${right[1].toFixed(2)} ${baseR[0].toFixed(2)} ${baseR[1].toFixed(2)}`,
    "Z",
  ].join(" ");
}

function teardropPath(
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
  width: number
): string {
  const tip = polar(cx, cy, length, angleDeg);
  const left = polar(cx, cy, length * 0.55, angleDeg - width);
  const right = polar(cx, cy, length * 0.55, angleDeg + width);
  return [
    `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    `Q ${left[0].toFixed(2)} ${left[1].toFixed(2)} ${tip[0].toFixed(2)} ${tip[1].toFixed(2)}`,
    `Q ${right[0].toFixed(2)} ${right[1].toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function starPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  rotation = -90
): string {
  const verts: [number, number][] = [];
  const step = 360 / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = rotation + (i * step) / 2;
    verts.push(polar(cx, cy, r, a));
  }
  return (
    verts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" ") + " Z"
  );
}

function ringSegmentPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  const s1 = polar(cx, cy, rInner, startDeg);
  const s2 = polar(cx, cy, rOuter, startDeg);
  const e2 = polar(cx, cy, rOuter, endDeg);
  const e1 = polar(cx, cy, rInner, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s1[0].toFixed(2)} ${s1[1].toFixed(2)}`,
    `L ${s2[0].toFixed(2)} ${s2[1].toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${e2[0].toFixed(2)} ${e2[1].toFixed(2)}`,
    `L ${e1[0].toFixed(2)} ${e1[1].toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${s1[0].toFixed(2)} ${s1[1].toFixed(2)}`,
    "Z",
  ].join(" ");
}

function arcBandPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  return ringSegmentPath(cx, cy, rInner, rOuter, startDeg, endDeg);
}

function generateCalmLotus(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const petals = pickInt(rng, 6, 10);
  const rotation = pickFloat(rng, 0, 360 / petals);
  const centerR = pickInt(rng, 16, 28);
  const petalLen = pickInt(rng, 82, 105);
  const petalWidth = pickInt(rng, 22, 32);
  const orbR = pickInt(rng, 12, 22);
  const orbDist = pickInt(rng, 52, 72);
  const outerLen = pickInt(rng, 130, 155);
  const outerWidth = pickInt(rng, 18, 26);
  const step = 360 / petals;

  paths.push({ id: "center", d: circlePath(CX, CY, centerR) });

  for (let i = 0; i < petals; i++) {
    paths.push({
      id: `petal-${i}`,
      d: lotusPetalPath(CX, CY, rotation + i * step, petalLen, petalWidth),
    });
  }

  if (rng() > 0.35) {
    for (let i = 0; i < petals; i++) {
      const [x, y] = polar(CX, CY, orbDist, rotation + i * step + step / 2);
      paths.push({ id: `orb-${i}`, d: circlePath(x, y, orbR) });
    }
  }

  for (let i = 0; i < petals; i++) {
    paths.push({
      id: `outer-petal-${i}`,
      d: lotusPetalPath(CX, CY, rotation + i * step + step / 2, outerLen, outerWidth),
    });
  }

  const bandCount = pickInt(rng, 6, 12);
  const bandStep = 360 / bandCount;
  const bandInner = pickInt(rng, 158, 165);
  const bandOuter = pickInt(rng, 168, 175);
  for (let i = 0; i < bandCount; i++) {
    paths.push({
      id: `band-${i}`,
      d: arcBandPath(CX, CY, bandInner, bandOuter, i * bandStep, (i + 1) * bandStep),
    });
  }

  return paths;
}

function generateCalmRings(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const ringCount = pickInt(rng, 4, 6);
  const rotation = pickFloat(rng, 0, 15);
  let inner = pickInt(rng, 14, 22);

  paths.push({ id: "center", d: circlePath(CX, CY, inner) });

  for (let ring = 0; ring < ringCount; ring++) {
    const outer = inner + pickInt(rng, 22, 32);
    const segments = pickInt(rng, 8 + ring * 2, 12 + ring * 3);
    const step = 360 / segments;
    for (let i = 0; i < segments; i++) {
      paths.push({
        id: `ring-${ring}-seg-${i}`,
        d: ringSegmentPath(
          CX,
          CY,
          inner,
          outer,
          rotation + i * step,
          rotation + (i + 1) * step
        ),
      });
    }
    inner = outer + pickInt(rng, 4, 10);
  }

  const leafCount = pickInt(rng, 8, 14);
  const leafStep = 360 / leafCount;
  const leafRot = pickFloat(rng, 0, leafStep);
  for (let i = 0; i < leafCount; i++) {
    paths.push({
      id: `leaf-${i}`,
      d: teardropPath(CX, CY, leafRot + i * leafStep, inner + 18, pickInt(rng, 14, 20)),
    });
  }

  return paths;
}

function generateCalmBubbles(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const layers = pickInt(rng, 3, 5);
  const baseRot = pickFloat(rng, 0, 30);
  let radius = pickInt(rng, 28, 40);

  paths.push({ id: "core", d: circlePath(CX, CY, pickInt(rng, 12, 20)) });

  for (let layer = 0; layer < layers; layer++) {
    const count = pickInt(rng, 6, 10);
    const step = 360 / count;
    const bubbleR = pickInt(rng, 14, 26);
    const orbit = radius + bubbleR + pickInt(rng, 6, 14);

    for (let i = 0; i < count; i++) {
      const [x, y] = polar(CX, CY, orbit, baseRot + layer * 11 + i * step);
      paths.push({ id: `bubble-${layer}-${i}`, d: circlePath(x, y, bubbleR) });
    }

    const arcSegs = pickInt(rng, count, count * 2);
    const arcStep = 360 / arcSegs;
    const arcInner = orbit - bubbleR - 4;
    const arcOuter = orbit + bubbleR + 8;
    for (let i = 0; i < arcSegs; i++) {
      if (i % 2 === 0) continue;
      paths.push({
        id: `arc-${layer}-${i}`,
        d: ringSegmentPath(
          CX,
          CY,
          arcInner,
          arcOuter,
          baseRot + i * arcStep,
          baseRot + (i + 1) * arcStep
        ),
      });
    }

    radius = orbit + bubbleR + pickInt(rng, 10, 18);
  }

  return paths;
}

function generateCalmWaves(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const spokes = pickInt(rng, 8, 16);
  const step = 360 / spokes;
  const rot = pickFloat(rng, 0, step / 2);

  paths.push({ id: "center", d: circlePath(CX, CY, pickInt(rng, 18, 26)) });

  for (let i = 0; i < spokes; i++) {
    const a = rot + i * step;
    const inner = pickInt(rng, 32, 48);
    const mid = pickInt(rng, 72, 95);
    const outer = pickInt(rng, 115, 140);
    paths.push({
      id: `wave-inner-${i}`,
      d: lotusPetalPath(CX, CY, a, inner, pickInt(rng, 16, 24)),
    });
    paths.push({
      id: `wave-mid-${i}`,
      d: lotusPetalPath(CX, CY, a + step / 2, mid, pickInt(rng, 12, 18)),
    });
    paths.push({
      id: `wave-outer-${i}`,
      d: teardropPath(CX, CY, a, outer, pickInt(rng, 10, 16)),
    });
  }

  const rimSegs = pickInt(rng, spokes, spokes * 2);
  const rimStep = 360 / rimSegs;
  for (let i = 0; i < rimSegs; i++) {
    paths.push({
      id: `rim-${i}`,
      d: ringSegmentPath(CX, CY, 155, 172, rot + i * rimStep, rot + (i + 1) * rimStep),
    });
  }

  return paths;
}

function generateCalmMandala(rng: Rng): MandalaPath[] {
  const variant = pickInt(rng, 0, 3);
  switch (variant) {
    case 0:
      return generateCalmLotus(rng);
    case 1:
      return generateCalmRings(rng);
    case 2:
      return generateCalmBubbles(rng);
    default:
      return generateCalmWaves(rng);
  }
}

function generateEnergyStarburst(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const points = pickInt(rng, 8, 16);
  const innerRatio = pickFloat(rng, 0.38, 0.52);
  const rot = pickFloat(rng, -90, -90 + 180 / points);

  paths.push({
    id: "star-main",
    d: starPath(CX, CY, pickInt(rng, 155, 170), pickInt(rng, 60, 85), points, rot),
  });

  if (rng() > 0.4) {
    paths.push({
      id: "star-inner",
      d: starPath(
        CX,
        CY,
        pickInt(rng, 95, 120),
        pickInt(rng, 38, 55),
        pickInt(rng, 6, 10),
        rot + pickFloat(rng, 10, 30)
      ),
    });
  }

  paths.push({ id: "core", d: circlePath(CX, CY, pickInt(rng, 20, 32)) });

  const ringCount = pickInt(rng, 2, 4);
  for (let ring = 0; ring < ringCount; ring++) {
    const count = pickInt(rng, 12, 20);
    const radius = pickInt(rng, 48, 58) + ring * pickInt(rng, 32, 42);
    const spikeSize = pickInt(rng, 8, 14) - ring;
    for (let i = 0; i < count; i++) {
      const a = (360 / count) * i + rot;
      const [x, y] = polar(CX, CY, radius, a);
      paths.push({
        id: `spike-${ring}-${i}`,
        d: starPath(x, y, spikeSize, spikeSize * innerRatio, pickInt(rng, 3, 5), a),
      });
    }
  }

  const wedgeCount = pickInt(rng, 16, 28);
  const wedgeSpan = pickFloat(rng, 5, 10);
  for (let i = 0; i < wedgeCount; i++) {
    const a1 = (360 / wedgeCount) * i + rot;
    paths.push({
      id: `wedge-${i}`,
      d: ringSegmentPath(CX, CY, pickInt(rng, 108, 125), pickInt(rng, 138, 152), a1, a1 + wedgeSpan),
    });
  }

  return paths;
}

function generateEnergySun(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const rays = pickInt(rng, 16, 32);
  const step = 360 / rays;
  const rot = pickFloat(rng, 0, step);
  const coreR = pickInt(rng, 22, 36);

  paths.push({ id: "core", d: circlePath(CX, CY, coreR) });

  for (let i = 0; i < rays; i++) {
    const a1 = rot + i * step;
    const a2 = a1 + step * pickFloat(rng, 0.35, 0.65);
    const inner = coreR + pickInt(rng, 4, 12);
    const outer = pickInt(rng, 145, 168);
    paths.push({
      id: `ray-${i}`,
      d: ringSegmentPath(CX, CY, inner, outer, a1, a2),
    });
  }

  const midRings = pickInt(rng, 2, 4);
  let r = coreR + pickInt(rng, 18, 28);
  for (let ring = 0; ring < midRings; ring++) {
    const segs = pickInt(rng, 10, 18);
    const segStep = 360 / segs;
    const outer = r + pickInt(rng, 16, 28);
    for (let i = 0; i < segs; i++) {
      paths.push({
        id: `sun-ring-${ring}-${i}`,
        d: ringSegmentPath(CX, CY, r, outer, rot + i * segStep, rot + (i + 1) * segStep),
      });
    }
    r = outer + pickInt(rng, 6, 12);
  }

  return paths;
}

function generateEnergyZigzag(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const layers = pickInt(rng, 4, 6);
  const sides = pickInt(rng, 6, 12);
  const rot = pickFloat(rng, 0, 360 / sides);

  paths.push({ id: "core", d: circlePath(CX, CY, pickInt(rng, 16, 24)) });

  for (let layer = 0; layer < layers; layer++) {
    const outerR = pickInt(rng, 42, 52) + layer * pickInt(rng, 22, 30);
    const innerR = outerR - pickInt(rng, 14, 22);
    for (let i = 0; i < sides; i++) {
      const a = rot + (360 / sides) * i;
      paths.push({
        id: `zig-${layer}-${i}`,
        d: starPath(CX, CY, outerR, innerR, 3, a),
      });
    }
  }

  const ticks = pickInt(rng, 20, 36);
  const tickStep = 360 / ticks;
  for (let i = 0; i < ticks; i++) {
    const a = rot + i * tickStep;
    const [x, y] = polar(CX, CY, pickInt(rng, 130, 150), a);
    paths.push({
      id: `tick-${i}`,
      d: starPath(x, y, pickInt(rng, 6, 10), 2, 3, a),
    });
  }

  return paths;
}

function generateEnergyLattice(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const rings = pickInt(rng, 5, 7);
  const rot = pickFloat(rng, 0, 22.5);
  let inner = pickInt(rng, 16, 24);

  paths.push({ id: "core", d: circlePath(CX, CY, inner) });

  for (let ring = 0; ring < rings; ring++) {
    const outer = inner + pickInt(rng, 18, 28);
    const diamonds = pickInt(rng, 8, 16);
    const step = 360 / diamonds;
    for (let i = 0; i < diamonds; i++) {
      const a = rot + i * step;
      const midR = (inner + outer) / 2;
      const [x, y] = polar(CX, CY, midR, a);
      paths.push({
        id: `diamond-${ring}-${i}`,
        d: starPath(x, y, pickInt(rng, 10, 16), pickInt(rng, 4, 7), 4, a + 45),
      });
      paths.push({
        id: `seg-${ring}-${i}`,
        d: ringSegmentPath(CX, CY, inner, outer, a, a + step * pickFloat(rng, 0.4, 0.85)),
      });
    }
    inner = outer + pickInt(rng, 2, 8);
  }

  return paths;
}

function generateEnergyMandala(rng: Rng): MandalaPath[] {
  const variant = pickInt(rng, 0, 3);
  switch (variant) {
    case 0:
      return generateEnergyStarburst(rng);
    case 1:
      return generateEnergySun(rng);
    case 2:
      return generateEnergyZigzag(rng);
    default:
      return generateEnergyLattice(rng);
  }
}

function generateFocusRings(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const ringCount = pickInt(rng, 4, 6);
  const rotation = pickFloat(rng, 0, 20);
  let inner = pickInt(rng, 14, 22);

  for (let ringIdx = 0; ringIdx < ringCount; ringIdx++) {
    const outer = inner + pickInt(rng, 22, 32);
    const segments = pickInt(rng, 8 + ringIdx * 2, 12 + ringIdx * 4);
    const step = 360 / segments;
    for (let i = 0; i < segments; i++) {
      paths.push({
        id: `seg-${ringIdx}-${i}`,
        d: ringSegmentPath(CX, CY, inner, outer, rotation + i * step, rotation + (i + 1) * step),
      });
    }
    inner = outer + pickInt(rng, 2, 8);
  }

  paths.push({ id: "center-dot", d: circlePath(CX, CY, pickInt(rng, 10, 18)) });

  if (rng() > 0.45) {
    const arms = pickInt(rng, 4, 8);
    for (let i = 0; i < arms; i++) {
      const rot = (360 / arms) * i + rotation;
      const p1 = polar(CX, CY, inner * 0.35, rot);
      const p2 = polar(CX, CY, inner * 0.35, rot + 90);
      const p3 = polar(CX, CY, inner * 0.35, rot + 180);
      const p4 = polar(CX, CY, inner * 0.35, rot + 270);
      paths.push({
        id: `cross-${i}`,
        d: `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} L ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} L ${p3[0].toFixed(2)} ${p3[1].toFixed(2)} L ${p4[0].toFixed(2)} ${p4[1].toFixed(2)} Z`,
      });
    }
  }

  const rimSegs = pickInt(rng, 12, 24);
  const rimStep = 360 / rimSegs;
  for (let i = 0; i < rimSegs; i++) {
    paths.push({
      id: `frame-${i}`,
      d: ringSegmentPath(CX, CY, 160, 172, rotation + i * rimStep, rotation + (i + 1) * rimStep),
    });
  }

  return paths;
}

function generateFocusSpokes(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const spokes = pickInt(rng, 10, 20);
  const step = 360 / spokes;
  const rot = pickFloat(rng, 0, step);
  const coreR = pickInt(rng, 12, 20);

  paths.push({ id: "center-dot", d: circlePath(CX, CY, coreR) });

  for (let i = 0; i < spokes; i++) {
    const a1 = rot + i * step;
    const a2 = a1 + step * pickFloat(rng, 0.55, 0.9);
    for (let band = 0; band < pickInt(rng, 3, 5); band++) {
      const inner = coreR + 8 + band * pickInt(rng, 24, 32);
      const outer = inner + pickInt(rng, 16, 26);
      paths.push({
        id: `spoke-${band}-${i}`,
        d: ringSegmentPath(CX, CY, inner, outer, a1, a2),
      });
    }
  }

  const orbitals = pickInt(rng, 6, 12);
  for (let i = 0; i < orbitals; i++) {
    const [x, y] = polar(CX, CY, pickInt(rng, 55, 75), rot + (360 / orbitals) * i);
    paths.push({ id: `orbital-${i}`, d: circlePath(x, y, pickInt(rng, 8, 16)) });
  }

  return paths;
}

function generateFocusNested(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const layers = pickInt(rng, 4, 6);
  const rot = pickFloat(rng, 0, 45);
  let size = pickInt(rng, 20, 30);

  paths.push({ id: "center-dot", d: circlePath(CX, CY, pickInt(rng, 8, 14)) });

  for (let layer = 0; layer < layers; layer++) {
    const sides = pickInt(rng, 4, 8);
    paths.push({
      id: `poly-${layer}`,
      d: starPath(CX, CY, size, size * pickFloat(rng, 0.55, 0.75), sides, rot + layer * 8),
    });
    size += pickInt(rng, 24, 34);
  }

  const ticks = pickInt(rng, 16, 28);
  const tickStep = 360 / ticks;
  for (let i = 0; i < ticks; i++) {
    paths.push({
      id: `tick-${i}`,
      d: ringSegmentPath(
        CX,
        CY,
        size - 8,
        size + pickInt(rng, 4, 12),
        rot + i * tickStep,
        rot + (i + 1) * tickStep
      ),
    });
  }

  return paths;
}

function generateFocusMaze(rng: Rng): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const tracks = pickInt(rng, 5, 7);
  const rot = pickFloat(rng, 0, 15);
  let inner = pickInt(rng, 16, 24);

  paths.push({ id: "center-dot", d: circlePath(CX, CY, inner) });

  for (let track = 0; track < tracks; track++) {
    const outer = inner + pickInt(rng, 18, 26);
    const cells = pickInt(rng, 12, 20);
    const cellStep = 360 / cells;
    for (let i = 0; i < cells; i++) {
      const gap = rng() > 0.55;
      if (gap) continue;
      paths.push({
        id: `cell-${track}-${i}`,
        d: ringSegmentPath(
          CX,
          CY,
          inner,
          outer,
          rot + track * 3 + i * cellStep,
          rot + track * 3 + (i + 1) * cellStep
        ),
      });
    }
    inner = outer + pickInt(rng, 3, 8);
  }

  return paths;
}

function generateFocusMandala(rng: Rng): MandalaPath[] {
  const variant = pickInt(rng, 0, 3);
  switch (variant) {
    case 0:
      return generateFocusRings(rng);
    case 1:
      return generateFocusSpokes(rng);
    case 2:
      return generateFocusNested(rng);
    default:
      return generateFocusMaze(rng);
  }
}

const GENERATORS: Record<MandalaTheme, (rng: Rng) => MandalaPath[]> = {
  calm: generateCalmMandala,
  energy: generateEnergyMandala,
  focus: generateFocusMandala,
};

export function generateMandala(theme: MandalaTheme, seed: number): MandalaSpec {
  const rng = createRng(seed);
  return {
    theme,
    viewBox: VIEW,
    paths: GENERATORS[theme](rng),
    seed,
  };
}

export function buildMandalaSvgString(
  spec: MandalaSpec,
  fills: Record<string, string>,
  defaultFill = "#FFFFFF"
): string {
  const paths = spec.paths
    .map(
      (p) =>
        `<path id="${p.id}" d="${p.d}" fill="${fills[p.id] ?? defaultFill}" stroke="#E8DDD4" stroke-width="0.6"/>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${spec.viewBox}" width="1200" height="1200">\n<rect width="100%" height="100%" fill="#FAF7F4"/>\n${paths}\n</svg>`;
}
