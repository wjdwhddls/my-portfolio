/**
 * 스크롤 런타임 — Lenis 스무스 스크롤 + GSAP ScrollTrigger 초기화.
 *
 * - Lenis는 native window scroll을 그대로 사용하므로 기존 `window.scrollY` 기반
 *   로직(interactions.ts의 스크롤 진행바 / navbar glass / blob parallax 등)이
 *   수정 없이 작동한다.
 * - GSAP ticker로 Lenis raf를 호출해 두 라이브러리가 같은 rAF 루프를 공유.
 * - `prefers-reduced-motion` 시 Lenis 자체를 생성하지 않고, 시네마틱 룸도
 *   정적 폴백으로 동작.
 * - (구) 시네마틱 룸 로딩은 3D 캐러셀 도입으로 제거됨.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;

if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    // 모바일 터치는 native 관성을 유지 (smoothTouch는 v1에서 syncTouch로 변경됨)
    syncTouch: false,
  } as ConstructorParameters<typeof Lenis>[0]);

  // GSAP ticker와 Lenis raf 연동 — 같은 rAF 루프 공유
  gsap.ticker.add((time) => {
    lenis!.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Lenis 가상 스크롤 위치 변화를 ScrollTrigger에 즉시 반영
  lenis.on('scroll', ScrollTrigger.update);
}

// BookshelfController / interactions.ts 에서 lenis.scrollTo / stop / start를 호출하기 위한 전역 노출
(window as unknown as { __lenis: Lenis | null }).__lenis = lenis;

// (구) 시네마틱 룸/책장 씬은 3D 캐러셀로 대체되어 더 이상 로드하지 않는다.
