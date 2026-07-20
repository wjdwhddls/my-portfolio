/**
 * 섹션 플로우 — "한 페이지씩 끊기는" 느낌을 없애는 연속 스크롤 연출.
 *
 * [data-flow] 요소들이 스크롤 위치에 묶여(scrub):
 *   - 진입: 아래(+90px)에서 떠오르며 서서히 선명해지고
 *   - 이탈: 위(-60px)로 흘러가며 은은하게 잦아든다
 * 뷰포트 중앙 구간에서는 완전한 가독 상태를 유지한다.
 *
 * prefers-reduced-motion: 아무것도 하지 않음 (기본 노출 상태 유지).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll<HTMLElement>('[data-flow]').forEach((el) => {
    // 진입 — 아래에서 떠오르기
    gsap.fromTo(
      el,
      { opacity: 0, y: 90 },
      {
        opacity: 1,
        y: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 60%', scrub: 0.5 },
      },
    );

    // 이탈 — 위로 흘러가며 잦아들기 (진입 구간과 겹치지 않는 범위)
    gsap.to(el, {
      y: -60,
      opacity: 0.15,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'bottom 28%', end: 'bottom -8%', scrub: 0.5 },
    });
  });
}
