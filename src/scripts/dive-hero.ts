/**
 * 다이브 히어로 — 어두운 서재 씬에서 스크롤하면 맥북 화면 속으로 빨려 들어가는 연출.
 *
 * 구조:
 *   #dive(340vh) > .dive-pin(sticky 100vh) > .dive-scene(줌 대상)
 *     ├─ .dive-img          서재 이미지 (idle 브리딩 + 마우스 패럴랙스)
 *     └─ .dive-screen       이미지 속 노트북 화면 rect에 정렬된 DOM 레이어
 *         └─ .dive-screen-inner  뷰포트 크기로 저작 후 rect에 맞춰 축소(contain)
 *
 * 줌 수학:
 *   - 이미지 자연비(cover) 기준으로 화면 rect의 표시 좌표(scx, scy, sw, sh) 계산
 *   - si = min(sw/vw, sh/vh) (contain 배율), 최종 씬 스케일 S = 1/si
 *   - transform-origin을 화면 중심에 두고 scale(S) + translate(뷰포트 중심으로)
 *   → 줌 종료 시 inner의 net scale이 정확히 1이 되어 픽셀 선명
 *
 * 모바일(<768px)·prefers-reduced-motion: 섹션 자체를 숨기고 기존 히어로가 랜딩.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IMG_ASPECT = 5504 / 3072;

/** 노트북 화면 영역 — 원본 이미지 대비 비율 좌표 (측정값) */
const SCREEN = { cx: 0.4923, cy: 0.5878, w: 0.1875, h: 0.2402 } as const;

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
  if (!scene || !img || !screenEl || !inner || !caption || !pin) return true;

  // 명령 문자열을 글자 스팬으로 분해 — 스크롤에 맞춰 한 글자씩 타이핑
  const typed = section.querySelector<HTMLElement>('.boot-typed');
  let typedChars: HTMLElement[] = [];
  if (typed) {
    const text = typed.textContent ?? '';
    typed.textContent = '';
    typedChars = Array.from(text).map((ch) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.opacity = '0';
      typed.appendChild(span);
      return span;
    });
  }

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

  /* ---------- 스크롤 스크럽 타임라인 ---------- */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      // 전역 파티클 씬에 진행도 전달 — 마지막 구간 "광점 버스트" 연출용
      onUpdate: (self) => {
        window.dispatchEvent(new CustomEvent('dive:progress', { detail: self.progress }));
      },
    },
    defaults: { ease: 'none' },
  });

  const cmdLine = section.querySelector<HTMLElement>('.boot-line-cmd');
  const okLines = section.querySelectorAll<HTMLElement>('.boot-line:not(.boot-line-cmd):not(.boot-welcome)');
  const welcome = section.querySelector<HTMLElement>('.boot-welcome');
  const typeCaret = section.querySelector<HTMLElement>('.boot-type-caret');

  tl
    // 캡션은 초입에서 사라짐
    .to(caption, { opacity: 0, y: -24, duration: 0.08 }, 0.02)
    // 씬 줌 — 가속 이징으로 "빨려 들어가는" 감각
    .to(scene, { scale: () => S, x: () => dx, y: () => dy, duration: 1, ease: 'power2.in' }, 0)
    // 노트북 화면 콘텐츠 크로스페이드 (베이크된 IDE → 실제 DOM)
    .to(inner, { opacity: 1, duration: 0.2 }, 0.36);

  // 1) 프롬프트 줄 등장 → 명령이 한 글자씩 타이핑
  if (cmdLine) tl.to(cmdLine, { opacity: 1, y: 0, duration: 0.03 }, 0.42);
  if (typedChars.length)
    tl.to(typedChars, { opacity: 1, duration: 0.004, stagger: 0.0075 }, 0.45);
  if (typeCaret) tl.to(typeCaret, { opacity: 0, duration: 0.01 }, 0.6);

  // 2) [ OK ] 로그가 한 줄씩
  if (okLines.length)
    tl.to(okLines, { opacity: 1, y: 0, duration: 0.05, stagger: 0.09 }, 0.62);

  // 3) Welcome
  if (welcome) tl.to(welcome, { opacity: 1, y: 0, duration: 0.05 }, 0.84);

  // 4) 다이브 레이어가 투명해지며 뒤의 광점(전역 파티클)이 화면 전체로 드러남
  //    — 파티클 버스트는 dive:progress 이벤트를 받은 global-scene이 담당
  tl.to(pin, { opacity: 0, duration: 0.1 }, 0.89);

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
    (window as unknown as Record<string, unknown>).__dive = { tl, compute, get S() { return S; } };
  }

  return true;
}
