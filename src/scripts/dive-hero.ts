/**
 * 다이브 히어로 — 서재 씬에서 맥북 화면 속으로 빨려 들어가면
 * 전체화면 터미널이 스스로 부팅되고, 마지막에 터미널 자체가 광점으로
 * 분해되며 히어로 페이지가 만들어지는 연출.
 *
 * 흐름:
 *   1) 스크롤 스크럽: 서재 → 노트북 화면 줌 (여기까지만 스크롤이 관여)
 *   2) 줌 완료 시 스크롤 잠금 → 시간 기반 부팅 타임라인 자동 재생
 *      · ./portfolio --start 한 글자씩 타이핑 → [ OK ] 한 줄씩 → Welcome
 *      · 부팅 중 클릭하면 8배속 빨리감기
 *   3) Welcome 직후: 터미널 창/글자를 캔버스로 샘플링해 그 자리에서
 *      광점으로 분해·확산 (dissolve) + 전역 파티클 버스트(dive:progress)
 *   4) 자동 스크롤로 히어로 진입 + 스크롤 잠금 해제 (부팅은 세션당 1회)
 *
 * 줌 수학:
 *   - 이미지 자연비(cover) 기준으로 화면 rect의 표시 좌표(scx, scy, sw, sh) 계산
 *   - si = min(sw/vw, sh/vh) (contain 배율), 최종 씬 스케일 S = 1/si
 *   - transform-origin을 화면 중심에 두고 scale(S) + translate(뷰포트 중심으로)
 *   → 줌 종료 시 inner의 net scale이 정확히 1 (전체화면 터미널이 픽셀 선명)
 *
 * 모바일(<768px)·prefers-reduced-motion: 섹션 자체를 숨기고 기존 히어로가 랜딩.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IMG_ASPECT = 5504 / 3072;

/** 노트북 화면 영역 — 원본 이미지 대비 비율 좌표 (측정값) */
const SCREEN = { cx: 0.4923, cy: 0.5878, w: 0.1875, h: 0.2402 } as const;

type LenisLike = {
  stop: () => void;
  start: () => void;
  scrollTo: (target: HTMLElement | number, options?: Record<string, unknown>) => void;
};

let built = false;

export function init(): void {
  if (trySetup()) return;
  // 로드 시점에 뷰포트가 아직 확정되지 않았거나 좁았던 경우 — 이후 이벤트에서 재시도
  const retry = () => {
    if (trySetup()) {
      window.removeEventListener('resize', retry);
      window.removeEventListener('load', retry);
    }
  };
  window.addEventListener('resize', retry);
  window.addEventListener('load', retry);
}

/** 조건이 충족되면 씬을 구성하고 true 반환. reduce-motion이면 영구 skip(true). */
function trySetup(): boolean {
  if (built) return true;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return true;

  const section = document.getElementById('dive');
  if (!section || window.innerWidth < 768) return false;
  built = true;

  const scene = section.querySelector<HTMLElement>('.dive-scene');
  const img = section.querySelector<HTMLElement>('.dive-img');
  const screenEl = section.querySelector<HTMLElement>('.dive-screen');
  const inner = section.querySelector<HTMLElement>('.dive-screen-inner');
  const caption = section.querySelector<HTMLElement>('.dive-caption');
  const pin = section.querySelector<HTMLElement>('.dive-pin');
  const terminal = section.querySelector<HTMLElement>('.dive-terminal');
  if (!scene || !img || !screenEl || !inner || !caption || !pin || !terminal) return true;

  /* ---------- 부팅 텍스트 준비 ---------- */
  const cmdLine = section.querySelector<HTMLElement>('.boot-line-cmd');
  const okLines = section.querySelectorAll<HTMLElement>('.boot-line:not(.boot-line-cmd):not(.boot-welcome)');
  const welcome = section.querySelector<HTMLElement>('.boot-welcome');
  const typeCaret = section.querySelector<HTMLElement>('.boot-type-caret');

  // 명령 문자열을 글자 스팬으로 분해 — 부팅 타임라인이 한 글자씩 켠다
  const typed = section.querySelector<HTMLElement>('.boot-typed');
  let typedChars: HTMLElement[] = [];
  if (typed) {
    const text = typed.textContent ?? '';
    typed.textContent = '';
    typedChars = Array.from(text).map((ch) => {
      const span = document.createElement('span');
      span.textContent = ch;
      // 타이핑 전에는 자리 자체를 차지하지 않아야 커서가 프롬프트 뒤에 붙는다
      span.style.display = 'none';
      typed.appendChild(span);
      return span;
    });
  }
  // 프롬프트 줄은 처음부터 보이게 (글자만 숨김)
  if (cmdLine) gsap.set(cmdLine, { opacity: 1, y: 0 });

  let S = 4;
  let dx = 0;
  let dy = 0;

  /** 뷰포트/이미지 크기 기준으로 줌 파라미터와 화면 rect 배치 재계산 */
  const compute = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vpAspect = vw / vh;

    const dispW = vpAspect > IMG_ASPECT ? vw : vh * IMG_ASPECT;
    const dispH = vpAspect > IMG_ASPECT ? vw / IMG_ASPECT : vh;
    const offX = (vw - dispW) / 2;
    const offY = (vh - dispH) / 2;

    const sw = SCREEN.w * dispW;
    const sh = SCREEN.h * dispH;
    const scx = offX + SCREEN.cx * dispW;
    const scy = offY + SCREEN.cy * dispH;

    const si = Math.min(sw / vw, sh / vh);
    S = 1 / si;
    dx = vw / 2 - scx;
    dy = vh / 2 - scy;

    gsap.set(scene, { transformOrigin: `${scx}px ${scy}px` });
    gsap.set(screenEl, { left: scx - sw / 2, top: scy - sh / 2, width: sw, height: sh });
    gsap.set(inner, {
      width: vw,
      height: vh,
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      scale: si,
    });
  };
  compute();
  ScrollTrigger.addEventListener('refreshInit', compute);

  /* ---------- 부팅 (시간 기반, 세션당 1회) ---------- */
  let bootStarted = false;
  let bootDone = false;

  const getLenis = (): LenisLike | null =>
    (window as unknown as { __lenis: LenisLike | null }).__lenis;

  type DissolveP = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    a: number;
    s: number;
  };

  /** 터미널의 글자/테두리를 샘플링 — 광점 시작 좌표 (스크롤 점프 전에 호출) */
  const sampleTerminalParts = (): DissolveP[] => {
    const rect = terminal.getBoundingClientRect();
    const SCALE = 0.5;
    const off = document.createElement('canvas');
    off.width = Math.max(2, Math.round(rect.width * SCALE));
    off.height = Math.max(2, Math.round(rect.height * SCALE));
    const octx = off.getContext('2d');
    if (!octx) return [];

    // 터미널 텍스트를 같은 위치에 그린다
    octx.fillStyle = '#fff';
    octx.textBaseline = 'top';
    terminal.querySelectorAll<HTMLElement>('.boot-line, .dive-terminal-title').forEach((el) => {
      const er = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      octx.font = `${parseFloat(cs.fontSize) * SCALE}px ${cs.fontFamily}`;
      octx.fillText(el.textContent ?? '', (er.left - rect.left) * SCALE, (er.top - rect.top) * SCALE);
    });
    // 창 테두리
    octx.strokeStyle = '#fff';
    octx.lineWidth = 1;
    octx.strokeRect(0.5, 0.5, off.width - 1, off.height - 1);

    const data = octx.getImageData(0, 0, off.width, off.height).data;

    const parts: DissolveP[] = [];
    const STEP = 2;
    for (let gy = 0; gy < off.height; gy += STEP) {
      for (let gx = 0; gx < off.width; gx += STEP) {
        const alpha = data[(gy * off.width + gx) * 4 + 3];
        if (alpha < 40) continue;
        const x = rect.left + gx / SCALE;
        const y = rect.top + gy / SCALE;
        // 각 광점이 완전 랜덤 방향으로 확산 — 어느 쪽으로도 쏠리지 않는다
        const ang = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 10;
        parts.push({
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 0.4,
          a: 0.75 + Math.random() * 0.25,
          s: 1 + Math.random() * 1.6,
        });
      }
    }
    return parts;
  };

  /**
   * 광점 비행 — 터미널 자리에서 사방으로 대칭 확산하며 서서히 소멸.
   * 특정 목적지로 몰지 않는다 (몰면 한쪽 구석에서 터지는 것처럼 보인다).
   * "다음 페이지로 조립"은 커튼이 걷히며 드러나는 페이지 자신
   * (히어로 인트로 + 초상 조립 + 배경 회로)이 담당한다.
   */
  const launchDissolve = (parts: DissolveP[]) => {
    if (parts.length === 0) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const overlay = document.createElement('canvas');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:60;pointer-events:none;';
    overlay.width = window.innerWidth * dpr;
    overlay.height = window.innerHeight * dpr;
    document.body.appendChild(overlay);
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const DURATION = 2000;
    const t0 = performance.now();

    const loop = (now: number) => {
      const t = (now - t0) / DURATION;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (t >= 1) {
        overlay.remove();
        return;
      }

      // 퍼진 뒤 서서히 잦아듦 — 그 사이 커튼이 걷히며 페이지가 드러난다
      const fade = t < 0.45 ? 1 : 1 - (t - 0.45) / 0.55;

      ctx.fillStyle = '#fff';
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        ctx.globalAlpha = p.a * fade;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  const startBoot = () => {
    if (bootStarted) return;
    bootStarted = true;

    // 스크럽 지연으로 스크롤이 다이브 끝을 지나쳐 있을 수 있다 —
    // 터미널이 정확히 전체화면이 되도록 다이브 끝 지점에 스냅한 뒤 잠근다
    const endY = section.getBoundingClientRect().top + window.scrollY + section.offsetHeight - window.innerHeight;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(endY, { immediate: true, force: true });
    else window.scrollTo(0, endY);
    lenis?.stop();

    const boot = gsap.timeline({ defaults: { ease: 'none' } });

    // 1) 명령 타이핑 — 한 글자씩
    if (typedChars.length)
      boot.to(typedChars, { display: 'inline', duration: 0.01, stagger: 0.05 }, 0.35);
    if (typeCaret) boot.to(typeCaret, { opacity: 0, duration: 0.05 }, '>+0.15');

    // 2) [ OK ] 로그 — 한 줄씩
    if (okLines.length)
      boot.to(okLines, { opacity: 1, y: 0, duration: 0.18, stagger: 0.48, ease: 'power1.out' }, '>+0.1');

    // 3) Welcome
    if (welcome) boot.to(welcome, { opacity: 1, y: 0, duration: 0.22, ease: 'power1.out' }, '>+0.35');

    // 4) 터미널이 그 자리에서 광점으로 분해 → 커튼 뒤에서 즉시 히어로로 점프
    //    → 광점이 날아다니는 동안 커튼이 걷히며 조립된 페이지가 드러난다
    //    (스크롤 이동이 눈에 보이지 않아 "페이지가 갈라지는" 느낌이 없다)
    boot.call(
      () => {
        // ① 터미널 글자/테두리를 광점으로 샘플링 (점프 전 좌표)
        const parts = sampleTerminalParts();

        // DOM 터미널은 즉시 사라지고 광점이 그 자리를 이어받는다
        gsap.to(terminal, { opacity: 0, duration: 0.15, ease: 'power1.out' });

        // 터미널 배경과 같은 검정 커튼 — 이 뒤에서 스크롤을 순간 이동시킨다
        const curtain = document.createElement('div');
        curtain.style.cssText = 'position:fixed;inset:0;background:#000;z-index:50;pointer-events:none;';
        document.body.appendChild(curtain);

        const hero = document.getElementById('home');
        const l = getLenis();
        l?.start();
        if (hero) {
          if (l) l.scrollTo(hero, { immediate: true, force: true });
          else window.scrollTo(0, hero.getBoundingClientRect().top + window.scrollY);
        }

        // ② 광점이 화면 전체로 대칭 확산 — 커튼이 걷히며 페이지가 조립된다
        launchDissolve(parts);

        // 전역 파티클 버스트 (0.84→1 구간을 시간으로 재생)
        const proxy = { p: 0.84 };
        gsap.to(proxy, {
          p: 1,
          duration: 1.6,
          ease: 'power1.inOut',
          onUpdate: () => {
            window.dispatchEvent(new CustomEvent('dive:progress', { detail: proxy.p }));
          },
        });

        // 광점이 퍼지는 동안 커튼이 걷히며 페이지가 "만들어진다"
        gsap.to(curtain, {
          opacity: 0,
          duration: 1.0,
          delay: 0.35,
          ease: 'power1.inOut',
          onComplete: () => curtain.remove(),
        });

        bootDone = true;
      },
      [],
      '>+0.55',
    );

    // 부팅 중 클릭하면 빨리감기
    const skip = () => boot.timeScale(8);
    window.addEventListener('pointerdown', skip, { once: true });

    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__boot = boot;
    }
  };

  /* ---------- 스크롤 스크럽 타임라인 (줌 전용) ---------- */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // 줌 완료 → 부팅 시작 (최초 1회)
        if (self.progress >= 0.985 && !bootStarted) startBoot();
        // 부팅 후 위로 되돌아오면 다이브/터미널을 다시 보이게
        if (bootDone && self.progress < 0.9) {
          gsap.set(pin, { opacity: 1 });
          gsap.set(terminal, { opacity: 1, scale: 1 });
        }
      },
    },
    defaults: { ease: 'none' },
  });

  tl
    // 캡션은 초입에서 사라짐
    .to(caption, { opacity: 0, y: -24, duration: 0.08 }, 0.02)
    // 씬 줌 — 가속 이징으로 "빨려 들어가는" 감각
    .to(scene, { scale: () => S, x: () => dx, y: () => dy, duration: 1, ease: 'power2.in' }, 0)
    // 노트북 화면 콘텐츠 크로스페이드 (베이크된 IDE → 실제 DOM 터미널)
    .to(inner, { opacity: 1, duration: 0.25 }, 0.5);

  /* ---------- idle 모션 — 브리딩 + 마우스 패럴랙스 (img에만 적용해 줌과 분리) ---------- */
  gsap.to(img, { scale: 1.045, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  const parX = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power2.out' });
  const parY = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power2.out' });
  window.addEventListener(
    'pointermove',
    (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      parX(nx * -10);
      parY(ny * -7);
    },
    { passive: true },
  );

  // 개발 검증용 훅
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__dive = {
      tl,
      compute,
      startBoot,
      sampleTerminalParts,
      launchDissolve,
      get S() {
        return S;
      },
    };
  }

  return true;
}
