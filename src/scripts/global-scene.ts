/**
 * 전역 모핑 3D 배경 — 페이지 전체를 관통하는 하나의 파티클 시스템.
 *
 * 섹션에 따라 파티클이 실시간 모핑한다 (uShape 0→3):
 *   0 히어로   : 파티클 바다 (사인파 물결 + 마우스 리플)
 *   1 소개     : 뉴럴 네트워크 그래프 (노드 + 엣지, 펄스)
 *   2 수상     : 별자리 성단 (트윙클)
 *   3 연락처   : 중심으로 수렴하는 동심원 파동
 *
 * - 형태별 타겟 좌표를 attribute(aNet/aStar/aWave)로 미리 계산, 셰이더에서 블렌드
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
  uniform float uShape;      // 0 바다, 1 네트워크, 2 별자리, 3 파동 (연속값)
  attribute float aRand;
  attribute vec3 aNet;
  attribute vec3 aStar;
  attribute vec3 aWave;
  varying float vAlpha;

  void main() {
    // 인접 형태끼리 piecewise-linear 블렌드 (인접 가중치 합 = 1)
    float wSea  = clamp(1.0 - abs(uShape - 0.0), 0.0, 1.0);
    float wNet  = clamp(1.0 - abs(uShape - 1.0), 0.0, 1.0);
    float wStar = clamp(1.0 - abs(uShape - 2.0), 0.0, 1.0);
    float wWave = clamp(1.0 - abs(uShape - 3.0), 0.0, 1.0);

    vec3 p = position * wSea + aNet * wNet + aStar * wStar + aWave * wWave;

    float t = uTime * 0.6;

    // ── 바다: 겹겹의 사인파 물결
    float sea = ( sin(p.x * 0.35 + t)        * 0.45
                + sin(p.z * 0.28 + t * 1.3)  * 0.35
                + sin((p.x + p.z) * 0.18 + t * 0.7) * 0.5 ) * wSea;

    // ── 바다/파동 공용: 포인터 리플
    float dM = distance(p.xz, uMouse);
    float ripple = ( exp(-dM * dM * 0.045) * sin(dM * 1.8 - uTime * 3.0) * 0.7
                   + exp(-dM * dM * 0.03) * 1.1 ) * max(wSea, wWave * 0.5);

    // ── 네트워크: 미세한 펄스 진동
    float net = sin(uTime * 2.0 + aRand * 12.56) * 0.06 * wNet;

    // ── 파동: 중심 동심원 물결
    float rW = length(p.xz);
    float wave = sin(rW * 1.6 - uTime * 2.2) * exp(-rW * 0.06) * 0.9 * wWave;

    p.y += sea + ripple + net + wave;

    // ── 형태 전환 중 산란 — f(1-f)가 전환 중간에서 최대
    float f = fract(uShape);
    float act = f * (1.0 - f) * 4.0;
    vec3 dir = normalize(vec3(aRand - 0.5, fract(aRand * 7.31) - 0.5, fract(aRand * 3.17) - 0.5) + 0.0001);
    p += dir * act * (1.5 + aRand * 2.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // 별자리에서는 트윙클로 크기 요동
    float twinkle = 1.0 + wStar * 0.6 * sin(uTime * 3.0 + aRand * 40.0);
    float size = (1.4 + aRand * 2.1) * twinkle;
    gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);

    float depthFade = smoothstep(-52.0, -9.0, mv.z);
    vAlpha = (0.35 + 0.65 * aRand) * depthFade;
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

const GRID = { width: 64, depth: 34, cols: 150, rows: 70 } as const;
const COUNT = GRID.cols * GRID.rows;

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

/* ---------- 형태별 타겟 좌표 생성 ---------- */

/** 바다 — XZ 그리드 (기본 position) */
function buildSea(): Float32Array {
  const arr = new Float32Array(COUNT * 3);
  let i = 0;
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      arr[i * 3] = (c / (GRID.cols - 1) - 0.5) * GRID.width + (Math.random() - 0.5) * 0.25;
      arr[i * 3 + 1] = -2.5;
      arr[i * 3 + 2] = (r / (GRID.rows - 1) - 0.5) * GRID.depth - 4 + (Math.random() - 0.5) * 0.25;
      i++;
    }
  }
  return arr;
}

/** 뉴럴 네트워크 — 레이어드 노드 + 엣지 위 분포 */
function buildNetwork(): Float32Array {
  const arr = new Float32Array(COUNT * 3);
  const LAYERS = 5;
  const nodes: THREE.Vector3[] = [];
  for (let l = 0; l < LAYERS; l++) {
    const perLayer = 6 + Math.round(Math.random() * 6); // 6~12
    const x = (l / (LAYERS - 1) - 0.5) * 22;
    for (let n = 0; n < perLayer; n++) {
      nodes.push(
        new THREE.Vector3(
          x + (Math.random() - 0.5) * 2.5,
          (n / Math.max(perLayer - 1, 1) - 0.5) * 12 + (Math.random() - 0.5) * 1.5 + 1,
          (Math.random() - 0.5) * 6 - 2,
        ),
      );
    }
  }
  // 각 노드의 최근접 3개 인덱스
  const nearest: number[][] = nodes.map((a, ai) =>
    nodes
      .map((b, bi) => ({ bi, d: ai === bi ? Infinity : a.distanceTo(b) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 3)
      .map((e) => e.bi),
  );

  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    const ni = Math.floor(Math.random() * nodes.length);
    if (Math.random() < 0.35) {
      // 노드 블롭
      v.copy(nodes[ni]).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7),
      );
    } else {
      // 엣지 위 분포
      const nb = nodes[nearest[ni][Math.floor(Math.random() * 3)]];
      v.lerpVectors(nodes[ni], nb, Math.random()).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12),
      );
    }
    arr[i * 3] = v.x;
    arr[i * 3 + 1] = v.y;
    arr[i * 3 + 2] = v.z;
  }
  return arr;
}

/** 별자리 — 딥 필드 + 성단 클러스터 */
function buildStars(): Float32Array {
  const arr = new Float32Array(COUNT * 3);
  const clusters = Array.from({ length: 7 }, () => ({
    c: new THREE.Vector3((Math.random() - 0.5) * 40, Math.random() * 14 - 3, -Math.random() * 22 - 2),
    r: 1.5 + Math.random() * 3,
  }));
  for (let i = 0; i < COUNT; i++) {
    if (Math.random() < 0.45) {
      const cl = clusters[Math.floor(Math.random() * clusters.length)];
      // 가우시안 근사 (uniform 합)
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
      arr[i * 3] = cl.c.x + g() * cl.r;
      arr[i * 3 + 1] = cl.c.y + g() * cl.r;
      arr[i * 3 + 2] = cl.c.z + g() * cl.r * 0.6;
    } else {
      arr[i * 3] = (Math.random() - 0.5) * 64;
      arr[i * 3 + 1] = Math.random() * 22 - 6;
      arr[i * 3 + 2] = -Math.random() * 34 + 4;
    }
  }
  return arr;
}

/** 수렴 파동 — 중심 동심원 링 디스크 */
function buildWave(): Float32Array {
  const arr = new Float32Array(COUNT * 3);
  const RINGS = 46;
  for (let i = 0; i < COUNT; i++) {
    const ring = i % RINGS;
    const radius = 0.8 + ring * 0.62 + (Math.random() - 0.5) * 0.3;
    const theta = Math.random() * Math.PI * 2;
    arr[i * 3] = Math.cos(theta) * radius;
    arr[i * 3 + 1] = -2.0;
    arr[i * 3 + 2] = Math.sin(theta) * radius * 0.75 - 3;
  }
  return arr;
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

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(buildSea(), 3));
  geometry.setAttribute('aNet', new THREE.BufferAttribute(buildNetwork(), 3));
  geometry.setAttribute('aStar', new THREE.BufferAttribute(buildStars(), 3));
  geometry.setAttribute('aWave', new THREE.BufferAttribute(buildWave(), 3));
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
        THREE.MathUtils.clamp(hit.x, -GRID.width / 2, GRID.width / 2),
        THREE.MathUtils.clamp(hit.z, -GRID.depth / 2 - 4, GRID.depth / 2 - 4),
      );
    }
  };
  window.addEventListener('pointermove', (e) => updatePointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
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
