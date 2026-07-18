/**
 * 히어로 3D 씬 — Three.js 파티클 웨이브 (모노크롬).
 *
 * - XZ 평면에 깔린 포인트 그리드가 겹겹의 사인파로 일렁이는 "입자 바다"
 * - 마우스(터치) 위치를 y=0 평면에 레이캐스트해 물결(ripple)이 따라다님
 * - 스크롤 진행에 따라 카메라가 뒤로 빠지며 서서히 페이드 아웃
 * - prefers-reduced-motion 시 호출부(HeroScene.astro)에서 아예 로드하지 않음
 * - 탭 비활성/뷰포트 이탈 시 rAF 정지로 GPU 낭비 방지
 */
import * as THREE from 'three';
import { gsap } from 'gsap';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;      // 포인터의 월드 XZ 좌표
  uniform float uPixelRatio;
  attribute float aRand;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * 0.6;

    // 겹겹의 사인파 — 주기/방향을 다르게 섞어 유기적인 물결
    float wave = sin(p.x * 0.35 + t)        * 0.45
               + sin(p.z * 0.28 + t * 1.3)  * 0.35
               + sin((p.x + p.z) * 0.18 + t * 0.7) * 0.5;

    // 포인터 주변 융기 + 동심원 물결
    float d = distance(p.xz, uMouse);
    float ripple = exp(-d * d * 0.045) * sin(d * 1.8 - uTime * 3.0) * 0.7;
    float bump = exp(-d * d * 0.03) * 1.1;

    p.y += wave + ripple + bump;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = 1.4 + aRand * 2.1;
    gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);

    // 카메라에서 멀수록 흐려져 자연스러운 깊이감
    float depthFade = smoothstep(-46.0, -9.0, mv.z);
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

/** 그리드 파라미터 — 화면을 넉넉히 덮는 입자 바다 */
const GRID = { width: 64, depth: 34, cols: 150, rows: 70 } as const;

export function init(canvas: HTMLCanvasElement): void {
  const hero = canvas.closest('section');
  if (!hero) return;

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  const pixelRatio = Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  const CAM_BASE = { x: 0, y: 4.6, z: 16 };
  camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z + 5); // 인트로에서 z가 당겨짐
  camera.lookAt(0, 0, -2);

  /* ---------- 파티클 그리드 ---------- */
  const count = GRID.cols * GRID.rows;
  const positions = new Float32Array(count * 3);
  const rands = new Float32Array(count);
  let i = 0;
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const x = (c / (GRID.cols - 1) - 0.5) * GRID.width;
      const z = (r / (GRID.rows - 1) - 0.5) * GRID.depth - 4;
      positions[i * 3] = x + (Math.random() - 0.5) * 0.25;
      positions[i * 3 + 1] = 0; // 높이는 points.position.y(-2.5)에서 일괄 지정
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.25;
      rands[i] = Math.random();
      i++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelRatio: { value: pixelRatio },
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

  const points = new THREE.Points(geometry, material);
  points.position.y = -2.5;
  scene.add(points);

  /* ---------- 포인터 → y=0 평면 레이캐스트 ---------- */
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
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  /* ---------- 가시성 기반 일시정지 ---------- */
  let inView = true;
  let pageVisible = !document.hidden;
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
  });
  io.observe(hero);
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  /* ---------- 인트로 (페이드 인 + 카메라 당김) ---------- */
  const intro = { fade: 0 };
  gsap.to(intro, { fade: 1, duration: 1.8, ease: 'power2.out', delay: 0.2 });
  gsap.to(camera.position, { z: CAM_BASE.z, duration: 2.2, ease: 'power3.out' });

  /* ---------- 메인 루프 ---------- */
  const clock = new THREE.Clock();

  // 개발 검증용 디버그 훅 (프로덕션 번들에서 tree-shake되지 않지만 부작용 없음)
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__heroScene = { uniforms, camera, renderer, points };
  }

  const tick = () => {
    requestAnimationFrame(tick);
    if (!inView || !pageVisible) return;

    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    // 포인터 물결/패럴랙스는 관성을 줘 부드럽게 따라오게
    uniforms.uMouse.value.lerp(mouseTarget, 0.06);

    // 스크롤 진행 → 카메라 상승 + 페이드 아웃
    const progress = Math.min(1, window.scrollY / (hero.offsetHeight * 0.85));
    uniforms.uFade.value = intro.fade * (1 - progress * 0.95);

    camera.position.x += (parallaxTarget.x * 1.4 - camera.position.x) * 0.04;
    camera.position.y +=
      (CAM_BASE.y + parallaxTarget.y * 0.7 + progress * 4 - camera.position.y) * 0.05;
    camera.lookAt(0, -progress * 2, -2);

    renderer.render(scene, camera);
  };
  tick();
}
