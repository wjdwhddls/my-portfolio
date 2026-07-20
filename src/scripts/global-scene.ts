/**
 * 전역 모핑 3D 배경 — "맥북 내부의 회로 세계"를 관통하는 하나의 파티클 시스템.
 *
 * 섹션에 따라 파티클이 실시간 모핑한다 (uShape 0→3):
 *   0 히어로   : 메인보드 회로 기판 (직각 트레이스 + 비아 + 데이터 펄스)
 *   1 경력     : 직각 배선 로드맵 (칩 패드 마일스톤 + 진행 화살표)
 *   2 수상     : 발광 칩 코어 4개 + 연결 배선 (코어 쉬머)
 *   3 연락처   : 중앙 CPU 다이로 수렴하는 방사 배선
 *
 * - 형태별 타겟 좌표를 attribute(aRoad/aChip/aCpu)로 미리 계산, 셰이더에서 블렌드
 * - aPulse(트레이스 위 누적 위치)로 배선을 따라 달리는 데이터 펄스 광점 연출
 * - 마우스 근처 트레이스는 밝게 점등 (변위 대신 발광 — 회로가 휘지 않게)
 * - 전환 중에는 f(1-f) 기반 산란(scatter)을 더해 "흩어졌다 재조립"되는 감각
 * - 섹션 전환은 ScrollTrigger onEnter/onEnterBack → uShape/카메라/밝기 트윈
 * - 캔버스는 fixed 전역 배경 (#global-scene), 콘텐츠는 z-index로 위에 얹힘
 * - prefers-reduced-motion 시 호출부(GlobalScene.astro)에서 로드하지 않음
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;       // 포인터 월드 XZ
  uniform float uPixelRatio;
  uniform float uShape;      // 0 회로기판, 1 로드맵, 2 칩 코어, 3 CPU 수렴 (연속값)
  attribute float aRand;
  attribute float aPulse;    // 트레이스 위 누적 위치 (0~1) — 데이터 펄스 위상
  attribute vec3 aRoad;
  attribute vec3 aChip;
  attribute vec3 aCpu;
  varying float vAlpha;

  void main() {
    // 인접 형태끼리 piecewise-linear 블렌드 (인접 가중치 합 = 1)
    float wBoard = clamp(1.0 - abs(uShape - 0.0), 0.0, 1.0);
    float wRoad  = clamp(1.0 - abs(uShape - 1.0), 0.0, 1.0);
    float wChip  = clamp(1.0 - abs(uShape - 2.0), 0.0, 1.0);
    float wCpu   = clamp(1.0 - abs(uShape - 3.0), 0.0, 1.0);

    vec3 p = position * wBoard + aRoad * wRoad + aChip * wChip + aCpu * wCpu;

    // ── 기판: 아주 미세한 호흡 (회로가 휘지 않을 정도)
    float breathe = sin(uTime * 0.7 + p.x * 0.06 + p.z * 0.04) * 0.06 * wBoard;

    // ── 로드맵/칩: 미세한 펄스 진동
    float jitter = sin(uTime * 2.0 + aRand * 12.56) * 0.05 * (wRoad + wChip * 0.6);

    p.y += breathe + jitter;

    // ── 형태 전환 중 산란 — f(1-f)가 전환 중간에서 최대
    float f = fract(uShape);
    float act = f * (1.0 - f) * 4.0;
    vec3 dir = normalize(vec3(aRand - 0.5, fract(aRand * 7.31) - 0.5, fract(aRand * 3.17) - 0.5) + 0.0001);
    p += dir * act * (1.5 + aRand * 2.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // 칩 코어 쉬머 — 크기 요동
    float shimmer = 1.0 + wChip * 0.5 * sin(uTime * 3.0 + aRand * 40.0);
    float size = (1.4 + aRand * 2.1) * shimmer;
    gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);

    float depthFade = smoothstep(-52.0, -9.0, mv.z);

    // ── 데이터 펄스 — 배선을 따라 달리는 광점 (기판/로드맵/CPU)
    float pulse = pow(0.5 + 0.5 * sin(6.2832 * (aPulse * 3.0 - uTime * 0.3)), 12.0);
    float traceGlow = pulse * (wBoard * 1.7 + wRoad * 1.3 + wCpu * 1.1);

    // ── 마우스 근처 신호 점등 (변위 대신 발광)
    float dM = distance(p.xz, uMouse);
    float mouseGlow = exp(-dM * dM * 0.03) * (wBoard + wRoad * 0.6 + wCpu * 0.5);

    vAlpha = (0.32 + 0.68 * aRand) * depthFade * (1.0 + traceGlow) + mouseGlow * depthFade * 0.5;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uFade;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float circle = smoothstep(0.5, 0.12, d);
    if (circle < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0), circle * vAlpha * uFade);
  }
`;

const COUNT = 10500;

/** 섹션 → 형태/카메라/밝기 매핑 */
const STAGES: Array<{
  sel: string;
  shape: number;
  fade: number;
  cam: { y: number; z: number; lookY: number };
}> = [
  { sel: '#home',     shape: 0, fade: 1.0,  cam: { y: 4.6, z: 16, lookY: 0 } },
  { sel: '#about',    shape: 1, fade: 0.9,  cam: { y: 1.6, z: 14, lookY: 1 } },
  { sel: '#projects', shape: 1, fade: 0.3,  cam: { y: 2.4, z: 17, lookY: 0.5 } },
  { sel: '#awards',   shape: 2, fade: 0.95, cam: { y: 3.2, z: 18, lookY: 2 } },
  { sel: '#contact',  shape: 3, fade: 0.85, cam: { y: 7.5, z: 15, lookY: -0.5 } },
];

/* ---------- 형태별 타겟 좌표 생성 ----------
 * 모든 빌더는 [positions, pulses]를 채운다.
 * pulses: 배선 위 누적 위치(0~1) — 셰이더의 데이터 펄스 위상.
 */

type Target = { pos: Float32Array; pulse: Float32Array };

function makeTarget(): Target {
  return { pos: new Float32Array(COUNT * 3), pulse: new Float32Array(COUNT) };
}

function put(t: Target, i: number, x: number, y: number, z: number, pulse: number): void {
  t.pos[i * 3] = x;
  t.pos[i * 3 + 1] = y;
  t.pos[i * 3 + 2] = z;
  t.pulse[i] = pulse;
}

/**
 * 메인보드 회로 기판 — XZ 평면(y=-2.5) 위 직각 트레이스 + 비아 + 패드.
 * 트레이스는 x방향으로 걷다가 90°로 z방향 조그를 넣는 맨해튼 배선.
 */
function buildBoard(): Target {
  const t = makeTarget();
  const Y = -2.5;
  const X_MIN = -32;
  const X_MAX = 32;
  const Z_MIN = -21;
  const Z_MAX = 13;

  // 트레이스 폴리라인들 생성
  type Trace = { pts: Array<[number, number]>; len: number };
  const traces: Trace[] = [];
  const TRACE_N = 95;
  for (let n = 0; n < TRACE_N; n++) {
    const pts: Array<[number, number]> = [];
    let x = X_MIN + Math.random() * (X_MAX - X_MIN) * 0.7;
    let z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
    pts.push([x, z]);
    const dirX = Math.random() < 0.8 ? 1 : -1;
    const jogs = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < jogs; j++) {
      x += dirX * (2.5 + Math.random() * 7);
      pts.push([x, z]);
      z += (Math.random() < 0.5 ? 1 : -1) * (1 + Math.random() * 3.5);
      z = Math.max(Z_MIN, Math.min(Z_MAX, z));
      pts.push([x, z]);
    }
    x += dirX * (2.5 + Math.random() * 6);
    pts.push([x, z]);

    let len = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      len += Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
    }
    traces.push({ pts, len });
  }
  const totalLen = traces.reduce((s, tr) => s + tr.len, 0);

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    if (r < 0.78) {
      // 트레이스 위 — 길이 비례로 선택
      let pick = Math.random() * totalLen;
      let tr = traces[0];
      for (const cand of traces) {
        if (pick <= cand.len) { tr = cand; break; }
        pick -= cand.len;
      }
      // 폴리라인 위 pick 지점
      let acc = 0;
      let px = tr.pts[0][0];
      let pz = tr.pts[0][1];
      for (let s = 0; s < tr.pts.length - 1; s++) {
        const [ax, az] = tr.pts[s];
        const [bx, bz] = tr.pts[s + 1];
        const segLen = Math.abs(bx - ax) + Math.abs(bz - az);
        if (acc + segLen >= pick) {
          const tt = segLen > 0 ? (pick - acc) / segLen : 0;
          px = ax + (bx - ax) * tt;
          pz = az + (bz - az) * tt;
          break;
        }
        acc += segLen;
      }
      put(t, i, px + (Math.random() - 0.5) * 0.12, Y, pz + (Math.random() - 0.5) * 0.12, pick / tr.len);
    } else if (r < 0.9) {
      // 비아(접점) — 트레이스 꺾임 지점에 밝은 점 클러스터
      const tr = traces[Math.floor(Math.random() * traces.length)];
      const corner = tr.pts[1 + Math.floor(Math.random() * Math.max(1, tr.pts.length - 2))];
      const theta = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.28;
      put(t, i, corner[0] + Math.cos(theta) * rad, Y, corner[1] + Math.sin(theta) * rad, Math.random());
    } else {
      // 칩 패드 — 작은 사각 클러스터
      const cx = X_MIN + Math.random() * (X_MAX - X_MIN);
      const cz = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
      put(t, i, cx + (Math.random() - 0.5) * 0.9, Y, cz + (Math.random() - 0.5) * 0.9, Math.random());
    }
  }
  return t;
}

/**
 * 경력 로드맵 — 직각 배선으로 오르는 경로.
 * 칩 패드(사각 링) 마일스톤 2개 + 끝의 진행 화살표.
 */
function buildRoadmap(): Target {
  const t = makeTarget();
  const Z = -2;
  const M0: [number, number] = [-6.5, -0.8];
  const M1: [number, number] = [1.5, 1.0];
  const TIP: [number, number] = [9.5, 2.4];

  // 맨해튼 경로: 수평 → 수직 조그 → 수평 …
  const path: Array<[number, number]> = [
    [-11.5, -1.8],
    [-8.8, -1.8],
    [-8.8, M0[1]],
    M0,
    [-2.0, M0[1]],
    [-2.0, M1[1]],
    M1,
    [5.5, M1[1]],
    [5.5, TIP[1]],
    TIP,
  ];
  const segLens: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const L = Math.abs(path[i + 1][0] - path[i][0]) + Math.abs(path[i + 1][1] - path[i][1]);
    segLens.push(L);
    totalLen += L;
  }

  // 화살촉 날개 (마지막 진행 방향 = +x)
  const wingLen = 1.7;
  const wings: Array<[number, number]> = [
    [-0.866, 0.5],
    [-0.866, -0.5],
  ];

  const squareRing = (c: [number, number], side: number): [number, number] => {
    // 사각 링 둘레 위 무작위 점
    const h = side / 2;
    const edge = Math.floor(Math.random() * 4);
    const u = Math.random() * side - h;
    if (edge === 0) return [c[0] + u, c[1] + h];
    if (edge === 1) return [c[0] + u, c[1] - h];
    if (edge === 2) return [c[0] + h, c[1] + u];
    return [c[0] - h, c[1] + u];
  };

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    if (r < 0.48) {
      // 경로 본선
      let pick = Math.random() * totalLen;
      let px = path[0][0];
      let py = path[0][1];
      let pulse = 0;
      let acc = 0;
      for (let s = 0; s < path.length - 1; s++) {
        if (acc + segLens[s] >= pick) {
          const tt = segLens[s] > 0 ? (pick - acc) / segLens[s] : 0;
          px = path[s][0] + (path[s + 1][0] - path[s][0]) * tt;
          py = path[s][1] + (path[s + 1][1] - path[s][1]) * tt;
          pulse = pick / totalLen;
          break;
        }
        acc += segLens[s];
      }
      put(t, i, px + (Math.random() - 0.5) * 0.2, py + (Math.random() - 0.5) * 0.2, Z + (Math.random() - 0.5) * 0.4, pulse);
    } else if (r < 0.74) {
      // 마일스톤 칩 패드 (사각 링)
      const c = Math.random() < 0.5 ? M0 : M1;
      const [x, y] = squareRing(c, 2.2);
      put(t, i, x + (Math.random() - 0.5) * 0.14, y + (Math.random() - 0.5) * 0.14, Z + (Math.random() - 0.5) * 0.4, Math.random());
    } else if (r < 0.88) {
      // 화살촉 날개
      const w = wings[Math.random() < 0.5 ? 0 : 1];
      const tt = Math.random();
      put(
        t, i,
        TIP[0] + w[0] * wingLen * tt + (Math.random() - 0.5) * 0.18,
        TIP[1] + w[1] * wingLen * tt + (Math.random() - 0.5) * 0.18,
        Z + (Math.random() - 0.5) * 0.3,
        0.95 + Math.random() * 0.05,
      );
    } else {
      // 주변 잔별 (비아 느낌의 산포)
      put(
        t, i,
        -12 + Math.random() * 24,
        -4 + Math.random() * 8.5,
        Z - 1 + Math.random() * 2,
        Math.random(),
      );
    }
  }
  return t;
}

/**
 * 수상 — 발광 칩 코어 4개 + 직각 연결 배선.
 * 카드 4장의 리듬에 맞춰 기판 위 프로세서들이 점등한 인상.
 */
function buildChips(): Target {
  const t = makeTarget();
  const Z = -4;
  const chips: Array<[number, number]> = [
    [-9.5, 3.6],
    [-3.2, 1.4],
    [3.2, 4.2],
    [9.5, 2.0],
  ];
  const SIDE = 2.3;

  // 연결 배선 (직각): chip[i] → chip[i+1]
  const links: Array<Array<[number, number]>> = [];
  for (let i = 0; i < chips.length - 1; i++) {
    const a = chips[i];
    const b = chips[i + 1];
    links.push([a, [b[0], a[1]], b]);
  }
  const linkLens = links.map(
    (l) => Math.abs(l[1][0] - l[0][0]) + Math.abs(l[2][1] - l[1][1]),
  );
  const linkTotal = linkLens.reduce((s, x) => s + x, 0);

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    if (r < 0.38) {
      // 칩 다이 사각 링
      const c = chips[Math.floor(Math.random() * chips.length)];
      const h = SIDE / 2;
      const edge = Math.floor(Math.random() * 4);
      const u = Math.random() * SIDE - h;
      const x = edge === 2 ? c[0] + h : edge === 3 ? c[0] - h : c[0] + u;
      const y = edge === 0 ? c[1] + h : edge === 1 ? c[1] - h : c[1] + u;
      put(t, i, x + (Math.random() - 0.5) * 0.12, y + (Math.random() - 0.5) * 0.12, Z + (Math.random() - 0.5) * 0.4, Math.random());
    } else if (r < 0.62) {
      // 코어 내부 발광 클러스터
      const c = chips[Math.floor(Math.random() * chips.length)];
      const g = () => (Math.random() + Math.random() - 1) * 0.55;
      put(t, i, c[0] + g(), c[1] + g(), Z + (Math.random() - 0.5) * 0.5, Math.random());
    } else if (r < 0.84) {
      // 연결 배선
      let pick = Math.random() * linkTotal;
      let li = 0;
      for (; li < links.length; li++) {
        if (pick <= linkLens[li]) break;
        pick -= linkLens[li];
      }
      const l = links[Math.min(li, links.length - 1)];
      const seg1 = Math.abs(l[1][0] - l[0][0]);
      let x: number;
      let y: number;
      if (pick <= seg1) {
        const tt = seg1 > 0 ? pick / seg1 : 0;
        x = l[0][0] + (l[1][0] - l[0][0]) * tt;
        y = l[0][1];
      } else {
        const seg2 = Math.abs(l[2][1] - l[1][1]);
        const tt = seg2 > 0 ? (pick - seg1) / seg2 : 0;
        x = l[1][0];
        y = l[1][1] + (l[2][1] - l[1][1]) * tt;
      }
      put(t, i, x + (Math.random() - 0.5) * 0.14, y + (Math.random() - 0.5) * 0.14, Z + (Math.random() - 0.5) * 0.4, pick / linkTotal);
    } else {
      // 주변 비아 산포
      put(t, i, (Math.random() - 0.5) * 30, -3 + Math.random() * 11, Z - 3 + Math.random() * 4, Math.random());
    }
  }
  return t;
}

/**
 * 연락처 — 중앙 CPU 다이 + 사방에서 수렴하는 방사 직각 배선.
 */
function buildCpu(): Target {
  const t = makeTarget();
  const Y = -2;
  const CX = 0;
  const CZ = -3;
  const DIE = 3.2;

  // 방사 배선 12개: 바깥에서 시작해 직각 조그 한 번 후 다이 가장자리로
  const RAYS = 12;
  const rays: Array<Array<[number, number]>> = [];
  for (let n = 0; n < RAYS; n++) {
    const theta = (n / RAYS) * Math.PI * 2 + 0.13;
    const sx = CX + Math.cos(theta) * (11 + Math.random() * 4);
    const sz = CZ + Math.sin(theta) * (8 + Math.random() * 3);
    // 직각 조그: 먼저 x를 맞추고, 다음 z를 맞춘다
    const jx = CX + Math.cos(theta) * (DIE / 2) * 1.4;
    const jz = CZ + Math.sin(theta) * (DIE / 2) * 1.4;
    rays.push([[sx, sz], [jx, sz], [jx, jz]]);
  }
  const rayLens = rays.map(
    (l) => Math.abs(l[1][0] - l[0][0]) + Math.abs(l[2][1] - l[1][1]),
  );
  const rayTotal = rayLens.reduce((s, x) => s + x, 0);

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random();
    if (r < 0.34) {
      // CPU 다이 — 중앙 사각 밀집 클러스터
      const g = () => (Math.random() + Math.random() - 1) * (DIE / 2);
      put(t, i, CX + g(), Y, CZ + g() * 0.8, Math.random());
    } else if (r < 0.5) {
      // 다이 테두리 사각 링
      const h = DIE / 2;
      const edge = Math.floor(Math.random() * 4);
      const u = Math.random() * DIE - h;
      const x = edge === 2 ? CX + h : edge === 3 ? CX - h : CX + u;
      const z = edge === 0 ? CZ + h : edge === 1 ? CZ - h : CZ + u;
      put(t, i, x + (Math.random() - 0.5) * 0.1, Y, z + (Math.random() - 0.5) * 0.1, Math.random());
    } else if (r < 0.88) {
      // 방사 배선 — 펄스가 중앙으로 향하도록 pulse는 바깥=0, 중앙=1
      let pick = Math.random() * rayTotal;
      let ri = 0;
      for (; ri < rays.length; ri++) {
        if (pick <= rayLens[ri]) break;
        pick -= rayLens[ri];
      }
      const l = rays[Math.min(ri, rays.length - 1)];
      const seg1 = Math.abs(l[1][0] - l[0][0]);
      let x: number;
      let z: number;
      const localLen = rayLens[Math.min(ri, rays.length - 1)];
      if (pick <= seg1) {
        const tt = seg1 > 0 ? pick / seg1 : 0;
        x = l[0][0] + (l[1][0] - l[0][0]) * tt;
        z = l[0][1];
      } else {
        const seg2 = Math.abs(l[2][1] - l[1][1]);
        const tt = seg2 > 0 ? (pick - seg1) / seg2 : 0;
        x = l[1][0];
        z = l[1][1] + (l[2][1] - l[1][1]) * tt;
      }
      put(t, i, x + (Math.random() - 0.5) * 0.14, Y, z + (Math.random() - 0.5) * 0.14, localLen > 0 ? pick / localLen : 0);
    } else {
      // 주변 비아 산포
      put(t, i, (Math.random() - 0.5) * 30, Y, CZ - 9 + Math.random() * 18, Math.random());
    }
  }
  return t;
}

/* ---------- 초기화 ---------- */

export function init(canvas: HTMLCanvasElement): void {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  const pixelRatio = Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 90);
  camera.position.set(0, 4.6, 21); // 인트로에서 z 16으로 당겨짐
  const look = new THREE.Vector3(0, 0, -2);
  camera.lookAt(look);

  const board = buildBoard();
  const road = buildRoadmap();
  const chip = buildChips();
  const cpu = buildCpu();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(board.pos, 3));
  geometry.setAttribute('aRoad', new THREE.BufferAttribute(road.pos, 3));
  geometry.setAttribute('aChip', new THREE.BufferAttribute(chip.pos, 3));
  geometry.setAttribute('aCpu', new THREE.BufferAttribute(cpu.pos, 3));
  // 펄스 위상은 형태별로 다르지만, 대표로 기판/로드맵 위상을 섞어 사용해도
  // 시각적으로 충분히 "달리는 신호"로 읽힌다 — 단순화를 위해 기판 위상 사용
  geometry.setAttribute('aPulse', new THREE.BufferAttribute(board.pulse, 1));
  const rands = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) rands[i] = Math.random();
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelRatio: { value: pixelRatio },
    uShape: { value: 0 },
    uFade: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(geometry, material));

  /* ---------- 포인터 → 파티클 평면 레이캐스트 ---------- */
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.5);
  const ndc = new THREE.Vector2(0, 0);
  const hit = new THREE.Vector3();
  const mouseTarget = new THREE.Vector2(0, 0);
  const parallaxTarget = new THREE.Vector2(0, 0);

  const updatePointer = (clientX: number, clientY: number) => {
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    parallaxTarget.set(ndc.x, ndc.y);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      mouseTarget.set(
        THREE.MathUtils.clamp(hit.x, -32, 32),
        THREE.MathUtils.clamp(hit.z, -21, 13),
      );
    }
  };
  window.addEventListener('pointermove', (e) => updatePointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener(
    'touchmove',
    (e) => {
      const tt = e.touches[0];
      if (tt) updatePointer(tt.clientX, tt.clientY);
    },
    { passive: true },
  );

  /* ---------- 리사이즈 ---------- */
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  /* ---------- 탭 비활성 시 일시정지 ---------- */
  let pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  /* ---------- 섹션 → 형태 전환 트리거 ---------- */
  const state = { fadeTarget: 1 };
  const applyStage = (st: (typeof STAGES)[number]) => {
    gsap.to(uniforms.uShape, { value: st.shape, duration: 1.8, ease: 'power2.inOut', overwrite: 'auto' });
    gsap.to(state, { fadeTarget: st.fade, duration: 1.2, ease: 'power1.out', overwrite: 'auto' });
    gsap.to(camera.position, { y: st.cam.y, z: st.cam.z, duration: 2.0, ease: 'power2.inOut', overwrite: 'auto' });
    gsap.to(look, { y: st.cam.lookY, duration: 2.0, ease: 'power2.inOut', overwrite: 'auto' });
  };

  STAGES.forEach((st) => {
    const el = document.querySelector(st.sel);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => applyStage(st),
      onEnterBack: () => applyStage(st),
    });
  });

  /* ---------- 인트로 ---------- */
  const intro = { fade: 0 };
  gsap.to(intro, { fade: 1, duration: 1.8, ease: 'power2.out', delay: 0.2 });
  gsap.to(camera.position, { z: 16, duration: 2.2, ease: 'power3.out' });

  /* ---------- 메인 루프 ---------- */
  const clock = new THREE.Clock();

  // 개발 검증용 디버그 훅
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__globalScene = {
      uniforms,
      camera,
      renderer,
      scene,
      applyStage,
      STAGES,
    };
  }

  const tick = () => {
    requestAnimationFrame(tick);
    if (!pageVisible) return;

    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(mouseTarget, 0.06);
    uniforms.uFade.value = intro.fade * state.fadeTarget;

    camera.position.x += (parallaxTarget.x * 1.4 - camera.position.x) * 0.04;
    camera.lookAt(look);

    renderer.render(scene, camera);
  };
  tick();
}
