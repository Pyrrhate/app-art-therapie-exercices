import type { MandalaPath, MandalaSpec, MandalaTheme } from "./types";

const CX = 200;
const CY = 200;
const VIEW = "0 0 400 400";

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

/** Pétale de lotus en courbe de Bézier. */
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

function generateCalmMandala(): MandalaPath[] {
  const paths: MandalaPath[] = [];
  paths.push({ id: "center", d: circlePath(CX, CY, 22) });

  for (let i = 0; i < 8; i++) {
    paths.push({
      id: `petal-${i}`,
      d: lotusPetalPath(CX, CY, i * 45, 95, 28),
    });
  }

  for (let i = 0; i < 8; i++) {
    const [x, y] = polar(CX, CY, 62, i * 45 + 22.5);
    paths.push({ id: `orb-${i}`, d: circlePath(x, y, 18) });
  }

  for (let i = 0; i < 8; i++) {
    paths.push({
      id: `outer-petal-${i}`,
      d: lotusPetalPath(CX, CY, i * 45 + 22.5, 145, 22),
    });
  }

  paths.push({ id: "ring-outer", d: circlePath(CX, CY, 168) });
  paths.push({ id: "ring-inner", d: circlePath(CX, CY, 155) });

  return paths;
}

function generateEnergyMandala(): MandalaPath[] {
  const paths: MandalaPath[] = [];

  paths.push({
    id: "star-main",
    d: starPath(CX, CY, 165, 72, 12),
  });
  paths.push({
    id: "star-inner",
    d: starPath(CX, CY, 110, 48, 8, -90 + 22.5),
  });
  paths.push({ id: "core", d: circlePath(CX, CY, 28) });

  for (let ring = 0; ring < 3; ring++) {
    const count = 16 + ring * 8;
    const radius = 55 + ring * 38;
    for (let i = 0; i < count; i++) {
      const a = (360 / count) * i;
      const [x, y] = polar(CX, CY, radius, a);
      paths.push({
        id: `spike-${ring}-${i}`,
        d: starPath(x, y, 14 - ring * 2, 5, 4, a),
      });
    }
  }

  for (let i = 0; i < 24; i++) {
    const a1 = (360 / 24) * i;
    const a2 = a1 + 8;
    paths.push({
      id: `wedge-${i}`,
      d: ringSegmentPath(CX, CY, 118, 148, a1, a2),
    });
  }

  return paths;
}

function generateFocusMandala(): MandalaPath[] {
  const paths: MandalaPath[] = [];
  const rings = [
    { inner: 18, outer: 42, segments: 8 },
    { inner: 42, outer: 68, segments: 12 },
    { inner: 68, outer: 98, segments: 16 },
    { inner: 98, outer: 128, segments: 20 },
    { inner: 128, outer: 158, segments: 24 },
  ];

  rings.forEach(({ inner, outer, segments }, ringIdx) => {
    const step = 360 / segments;
    for (let i = 0; i < segments; i++) {
      paths.push({
        id: `seg-${ringIdx}-${i}`,
        d: ringSegmentPath(CX, CY, inner, outer, i * step, (i + 1) * step),
      });
    }
  });

  paths.push({ id: "center-dot", d: circlePath(CX, CY, 14) });

  for (let i = 0; i < 4; i++) {
    const rot = i * 90;
    const p1 = polar(CX, CY, 45, rot);
    const p2 = polar(CX, CY, 45, rot + 90);
    const p3 = polar(CX, CY, 45, rot + 180);
    const p4 = polar(CX, CY, 45, rot + 270);
    paths.push({
      id: `cross-${i}`,
      d: `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} L ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} L ${p3[0].toFixed(2)} ${p3[1].toFixed(2)} L ${p4[0].toFixed(2)} ${p4[1].toFixed(2)} Z`,
    });
  }

  paths.push({ id: "frame", d: circlePath(CX, CY, 172) });
  paths.push({ id: "frame-inner", d: circlePath(CX, CY, 160) });

  return paths;
}

const GENERATORS: Record<MandalaTheme, () => MandalaPath[]> = {
  calm: generateCalmMandala,
  energy: generateEnergyMandala,
  focus: generateFocusMandala,
};

export function generateMandala(theme: MandalaTheme): MandalaSpec {
  return {
    theme,
    viewBox: VIEW,
    paths: GENERATORS[theme](),
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
