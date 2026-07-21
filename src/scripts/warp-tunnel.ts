/**
 * 워프 터널 — 부팅(Welcome) 직후 "웜홀을 뚫고 다음 페이지로 날아가는" 전환.
 *
 * 원 스펙(스크롤 구동 단독 페이지)을 시간 기반 전환 모듈로 이식:
 *   - 인디고→시안 팔레트의 원통형 파티클 터널 + 보라 코너 플레임 + 시안 모트
 *   - 3중 컴포저(토러스/블룸/파이널) 레이어 스위칭 구성 그대로
 *   - 페이지 스크롤 대신 내부 타이머가 warp 진행(0→1)을 구동
 *   - 마우스로 비행이 살짝 기울고(스티어), 커서 주변 벽이 밀려남
 *   - 시작/끝은 캔버스 CSS 페이드 — 끝나면 모든 리소스 dispose 후 onDone()
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';

/* ---------- 고정 파라미터 (스펙 그대로) ---------- */
const BG_COLOR = '#0a0524';
const FLAME_A = '#2bf0ff';
const FLAME_B = '#7a3cff';
const FLAME_AMT = 0.2;
const ATMO_COLOR = '#8fe6ff';
const ATMO_COUNT = 300;
const ATMO_SIZE = 24;
const ATMO_SPEED = 1.0;
const COLOR_LOW = '#180a3a';
const COLOR_HIGH = '#2bf0ff';
const OPACITY = 1.44;
const POINT_SIZE = 5;
const BRIGHTNESS = 0.4;
const SWIRL = 0.39;
const SPIN = 0.065;
const SCALE = 0.17;
const SCROLL_FLY = 34;
const SCROLL_SWIRL = 1.5;
const SCROLL_ROLL = 0.05;
const STEER = 0.6;
const PARALLAX = 0.12;
const POINTER_RADIUS = 2.4;
const POINTER_STRENGTH = 0.8;

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 } as const;

const Lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/* ---------- 공용 GLSL: 3D 심플렉스 노이즈 ---------- */
const SNOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const TUNNEL_VERTEX = /* glsl */ `
uniform float uTime; uniform float uSize; uniform float uSwirl; uniform float uScale;
uniform vec3 uColLow; uniform vec3 uColHigh;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
varying float vFade; varying vec3 vColor;
${SNOISE}
void main() {
  vec3 wp = vec3(position.x * 7.0, 0.0, position.z * 25.0);
  wp.x += position.y * 6.0;
  float wn = snoise(vec3(wp.x * 0.08, wp.z * 0.08, uTime * 0.15)) * 2.0;
  wn += snoise(vec3(wp.x * 0.16, wp.z * 0.16, uTime * 0.3)) * 0.8;

  float tunnelR = 12.0;
  float currentSliceRadius = sqrt(max(0.0, 17.64 - position.z * position.z));
  float maxSliceWidth = 9.2195 * currentSliceRadius;
  float normalizedX = wp.x / (maxSliceWidth + 0.001);
  float tunnelAngle = normalizedX * 3.14159265;

  float jitterAngle = snoise(vec3(position.x * 15.0, position.y * 15.0, uTime * 0.1)) * 0.35;
  float jitterZ = snoise(vec3(position.y * 15.0, position.z * 15.0, uTime * 0.1)) * 4.0;
  float ambientSwirl = snoise(vec3(position.x * 5.0, position.y * 5.0, uTime * 0.2)) * 3.0;
  tunnelAngle += jitterAngle + ambientSwirl * uSwirl;

  float dynamicR = tunnelR - wn;
  vec3 tunnelPos = vec3(dynamicR * sin(tunnelAngle), -dynamicR * cos(tunnelAngle), wp.z + jitterZ);

  vec3 finalPos = tunnelPos * uScale;
  vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
  vec3 toP = modelPosition.xyz - uCursor;
  float cd = length(toP);
  float fall = smoothstep(uRepelRadius, 0.0, cd);
  modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
  vec4 mvPosition = viewMatrix * modelPosition;

  float colMix = smoothstep(-3.0, 3.0, position.y + position.x * 0.5);
  vColor = mix(uColLow, uColHigh, clamp(colMix, 0.0, 1.0));
  vFade = 1.0;

  gl_PointSize = uSize * (10.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.5);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const TUNNEL_FRAGMENT = /* glsl */ `
uniform float uOpacity; uniform float uBrightness; uniform float uAppear;
varying float vFade; varying vec3 vColor;
void main() {
  vec2 xy = gl_PointCoord - 0.5;
  float ll = length(xy);
  if (ll > 0.5) discard;
  float a = smoothstep(0.5, 0.1, ll);
  gl_FragColor = vec4(vColor * uBrightness, vFade * a * uOpacity * uAppear);
}
`;

const ATMO_VERTEX = /* glsl */ `
attribute float size; attribute float seed; uniform float uTime; uniform vec2 uRes;
varying float vA;
vec3 warp(vec3 p, float t){ float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.;
  p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x); p.y+=c*sin(s*t+a*p.z)+t*b;
  p.z+=c*cos(s*t+a*p.y); p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
  return cos(p+vec3(1,2,4)); }
void main(){
  vec3 v = position*4.0 + warp(position, uTime)*1.2;
  vec4 mv = modelViewMatrix * vec4(v, 1.0);
  float r = length(v); float farF = 1.0 - smoothstep(5.0, 6.5, r); float nearF = smoothstep(0.0, 0.5, -mv.z);
  vA = farF * nearF;
  gl_PointSize = size * uRes.y / 900.0 / -mv.z; gl_PointSize = max(gl_PointSize, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const ATMO_FRAGMENT = /* glsl */ `
uniform vec3 uColor; varying float vA;
void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
  float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.6); }
`;

const FINAL_FRAGMENT = /* glsl */ `
uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
uniform vec3 uBg; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt;
varying vec2 vUv;
vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;
  pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
  pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
  pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
  return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }
void main(){
  vec2 uv = 2.*vUv - 1.;
  vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
  vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
  flame *= smoothstep(0.25, 1., abs(uv.y));
  float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
  vec3 bg = uBg * (1.0 - 0.4 * length(uv));
  vec3 halo = texture2D(haloTexture, vUv).xyz;
  gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
}
`;

export interface WarpOptions {
  /** 전체 재생 시간 (ms) */
  duration?: number;
  /** 종료 후 호출 (리소스 정리 후) */
  onDone?: () => void;
}

/** 웜홀 워프 전환 재생 — 전체화면 오버레이 캔버스에서 duration 동안 비행 */
export function playWarp(options: WarpOptions = {}): void {
  const duration = options.duration ?? 3200;
  const FADE_IN_MS = 350;
  const FADE_OUT_MS = 650;

  /* ---------- 캔버스/렌더러 ---------- */
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;display:block;z-index:58;pointer-events:none;' +
    `opacity:0;transition:opacity ${FADE_IN_MS}ms ease;background:#000;`;
  document.body.appendChild(canvas);
  requestAnimationFrame(() => { canvas.style.opacity = '1'; });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 0, 20);
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  /* ---------- 터널 포인트 ---------- */
  const group = new THREE.Group();
  scene.add(group);

  const tunnelUniforms = {
    uTime: { value: 0 },
    uAppear: { value: 0 },
    uColLow: { value: hexToVec3(COLOR_LOW) },
    uColHigh: { value: hexToVec3(COLOR_HIGH) },
    uOpacity: { value: OPACITY },
    uSize: { value: POINT_SIZE },
    uBrightness: { value: BRIGHTNESS },
    uSwirl: { value: SWIRL },
    uScale: { value: SCALE },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: POINTER_RADIUS },
    uRepelStrength: { value: POINTER_STRENGTH },
    uActivity: { value: 0 },
  };

  const tunnelGeometry = new THREE.SphereGeometry(4.2, 200, 600);
  const tunnelMaterial = new THREE.ShaderMaterial({
    vertexShader: TUNNEL_VERTEX,
    fragmentShader: TUNNEL_FRAGMENT,
    uniforms: tunnelUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const tunnelPoints = new THREE.Points(tunnelGeometry, tunnelMaterial);
  tunnelPoints.frustumCulled = false;
  tunnelPoints.layers.enable(LAYERS.ENTIRE_SCENE);
  group.add(tunnelPoints);

  /* ---------- 대기 모트 ---------- */
  const positions = new Float32Array(ATMO_COUNT * 3);
  const sizes = new Float32Array(ATMO_COUNT);
  const seeds = new Float32Array(ATMO_COUNT);
  for (let i = 0; i < ATMO_COUNT; i++) {
    positions[i * 3] = 2 * Math.random() - 1;
    positions[i * 3 + 1] = 2 * Math.random() - 1;
    positions[i * 3 + 2] = 2 * Math.random() - 1;
    sizes[i] = ATMO_SIZE * (0.4 + Math.random());
    seeds[i] = Math.random();
  }
  const atmoGeometry = new THREE.BufferGeometry();
  atmoGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  atmoGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  atmoGeometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));

  const atmoUniforms = {
    uTime: { value: 0 },
    uColor: { value: hexToVec3(ATMO_COLOR) },
    uRes: {
      value: new THREE.Vector2(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio,
      ),
    },
  };
  const atmoMaterial = new THREE.ShaderMaterial({
    vertexShader: ATMO_VERTEX,
    fragmentShader: ATMO_FRAGMENT,
    uniforms: atmoUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const atmoPoints = new THREE.Points(atmoGeometry, atmoMaterial);
  atmoPoints.frustumCulled = false;
  atmoPoints.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(atmoPoints);

  /* ---------- 포스트프로세싱 (3중 컴포저) ---------- */
  const FinalPass = {
    uniforms: {
      iTime: { value: 0 },
      tDiffuse: { value: null },
      torusTexture: { value: null },
      bloomTexture: { value: null },
      haloTexture: { value: null },
      uBg: { value: hexToVec3(BG_COLOR) },
      uFlameA: { value: hexToVec3(FLAME_A) },
      uFlameB: { value: hexToVec3(FLAME_B) },
      uFlameAmt: { value: FLAME_AMT },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: FINAL_FRAGMENT,
  };

  const renderScene = new RenderPass(scene, camera);

  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  torusComposer.addPass(renderScene);
  torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
  torusComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.2, 0),
  );
  torusComposer.addPass(new ShaderPass(CopyShader));

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.6, 0),
  );
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const finalPass = new ShaderPass(FinalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  /* ---------- 포인터 ---------- */
  const POINTER = { active: false, lastMove: 0, world: new THREE.Vector3(), activity: 0 };
  const mouse = { x: 0, y: 0 };
  const mouseTarget = { x: 0, y: 0 };

  const onMouseMove = (e: MouseEvent) => {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseTarget.y = -((e.clientY / window.innerHeight) * 2 - 1);
    POINTER.active = true;
    POINTER.lastMove = performance.now();
  };
  const onMouseOut = () => { POINTER.active = false; };
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mouseout', onMouseOut);

  const _ndc = new THREE.Vector3();
  const _dir = new THREE.Vector3();
  const _tgt = new THREE.Vector3();
  function updatePointerWorld() {
    _tgt.set(0, 0, 0);
    if (POINTER.active) {
      _ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
      _dir.copy(_ndc).sub(camera.position).normalize();
      const dn = _dir.z;
      if (Math.abs(dn) > 1e-4) {
        const tt = -camera.position.z / dn;
        if (tt > 0 && Number.isFinite(tt)) _tgt.copy(camera.position).addScaledVector(_dir, tt);
      }
    }
    POINTER.world.lerp(_tgt, 0.12);
    const idle = (performance.now() - POINTER.lastMove) / 1000;
    POINTER.activity += ((POINTER.active && idle < 3 ? 1 : 0) - POINTER.activity) * 0.06;
  }

  /* ---------- 리사이즈 ---------- */
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const composer of [torusComposer, bloomComposer, finalComposer]) {
      composer.setPixelRatio(dpr);
      composer.setSize(w, h);
    }
    atmoUniforms.uRes.value.set(w * dpr, h * dpr);
  };
  window.addEventListener('resize', onResize);

  /* ---------- 진행/애니메이션 ---------- */
  const startMs = performance.now();
  const appearStart = startMs;
  let rollPhase = 0;
  let t0 = performance.now() / 1000;
  let scrollTarget = 0;
  let scrollSmooth = 0;
  let scrollCurrent = 0;
  let disposed = false;
  let fadingOut = false;

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseout', onMouseOut);
    window.removeEventListener('resize', onResize);
    tunnelGeometry.dispose();
    tunnelMaterial.dispose();
    atmoGeometry.dispose();
    atmoMaterial.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    renderer.dispose();
    canvas.remove();
    options.onDone?.();
  };

  /** 한 프레임 실행 — render 루프와 DEV 검증 훅이 공용으로 사용 */
  function frame(nowMs: number) {
    const elapsedMs = nowMs - startMs;

    // 내부 타이머가 warp 진행을 구동 (0→1)
    scrollTarget = Math.min(1, Math.max(0, (elapsedMs - 150) / (duration - 150 - FADE_OUT_MS * 0.5)));

    // 종료 페이드
    if (!fadingOut && elapsedMs >= duration - FADE_OUT_MS) {
      fadingOut = true;
      canvas.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
      canvas.style.opacity = '0';
    }
    if (elapsedMs >= duration + 80) {
      cleanup();
      return;
    }

    scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.1);
    scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.06);
    mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06);
    mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06);

    const t = nowMs / 1000;
    const dt = Math.min(0.05, t - t0);
    t0 = t;

    tunnelUniforms.uTime.value = t;

    // 워프 비행 + 커서 스티어
    camera.position.set(mouse.x * PARALLAX, mouse.y * PARALLAX, 20 - scrollCurrent * SCROLL_FLY);
    camera.lookAt(mouse.x * STEER, mouse.y * STEER, camera.position.z - 12);
    updatePointerWorld();

    tunnelUniforms.uSwirl.value = SWIRL * (1 + scrollCurrent * SCROLL_SWIRL);
    rollPhase += dt * (SPIN + scrollCurrent * SCROLL_ROLL);
    group.rotation.z = rollPhase;

    tunnelUniforms.uCursor.value.copy(POINTER.world);
    tunnelUniforms.uActivity.value = POINTER.activity;
    const appearElapsed = (nowMs - appearStart) / 1000;
    tunnelUniforms.uAppear.value = Math.max(0, Math.min(1, (appearElapsed - 0.2) / 1.4));

    // 대기 모트 — 카메라를 따라다닌다
    atmoUniforms.uTime.value = t * ATMO_SPEED * 8.0;
    atmoPoints.position.copy(camera.position);
    finalPass.uniforms.iTime.value = t;

    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  }

  function render() {
    if (disposed) return;
    requestAnimationFrame(render);
    frame(performance.now());
  }
  render();

  // 개발 검증용 훅 — rAF가 멈춘 환경에서 프레임을 수동 구동
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__warp = {
      frame,
      resize: onResize,
      get scroll() {
        return scrollCurrent;
      },
    };
  }
}
