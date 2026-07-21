/**
 * 히어로 인트로 타임라인 (GSAP).
 *
 * - 이름(h1)을 글자 단위로 분해해 오버플로 마스크 안에서 솟아오르는 스태거 리빌
 * - 인사말 → 이름 → 타이핑 → 본문 → CTA → 에디터 카드 순차 등장
 * - prefers-reduced-motion 시 아무것도 하지 않음 (마크업은 기본 상태로 노출)
 * - 기존 CSS 진입 애니메이션(fade-in-up 등)은 히어로에서 제거하고 이 타임라인이 대체
 */
import { gsap } from 'gsap';

export function init(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const hero = document.getElementById('home');
  if (!hero) return;

  // 히어로 위에 다이브 섹션이 있으면(데스크톱) 워프 종료 신호에 맞춰 인트로 시작
  // (커튼/터널에 가려진 동안 미리 재생돼 버리는 것을 방지)
  const rect = hero.getBoundingClientRect();
  if (rect.top > window.innerHeight * 0.6) {
    window.addEventListener('hero:reveal', () => build(hero), { once: true });
    return;
  }
  build(hero);
}

function build(hero: HTMLElement): void {

  const q = (sel: string) => hero.querySelector<HTMLElement>(sel);
  const greeting = q('[data-hero="greeting"]');
  const name = q('[data-hero="name"]');
  const typing = q('[data-hero="typing"]');
  const intro = q('[data-hero="intro"]');
  const cta = q('[data-hero="cta"]');
  const portrait = q('[data-hero="portrait"]');
  const hint = q('[data-hero="scroll-hint"]');

  // 이름을 글자 단위 마스크 스팬으로 분해 (진행적 향상 — JS 없으면 원본 그대로)
  // gradient-text(background-clip: text)는 overflow:hidden 자손과 충돌하므로
  // 부모에서 떼어내고 글자 스팬 각각에 다시 부여한다.
  let chars: HTMLElement[] = [];
  if (name) {
    const text = name.textContent ?? '';
    const hasGradient = name.classList.contains('gradient-text');
    name.classList.remove('gradient-text');
    name.textContent = '';
    name.setAttribute('aria-label', text);
    chars = Array.from(text).map((ch) => {
      const mask = document.createElement('span');
      mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;';
      mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.style.display = 'inline-block';
      if (hasGradient) inner.classList.add('gradient-text');
      inner.textContent = ch === ' ' ? ' ' : ch;
      mask.appendChild(inner);
      name.appendChild(mask);
      return inner;
    });
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (greeting) tl.from(greeting, { y: 24, opacity: 0, duration: 0.6 }, 0.1);
  if (chars.length)
    tl.from(chars, { yPercent: 115, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 0.25);
  if (typing) tl.from(typing, { y: 20, opacity: 0, duration: 0.6 }, 0.75);
  if (intro) tl.from(intro, { y: 24, opacity: 0, duration: 0.7 }, 0.9);
  if (cta)
    tl.from(cta.children, { y: 24, opacity: 0, duration: 0.6, stagger: 0.09 }, 1.05);
  if (portrait)
    tl.from(portrait, { opacity: 0, scale: 0.94, duration: 1.2, ease: 'power2.out' }, 0.5);
  if (hint) tl.from(hint, { opacity: 0, duration: 0.8 }, 1.6);

  // 개발 검증용 훅 — rAF가 멈춘 환경에서 tl.progress(1)로 최종 상태 확인
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__heroIntro = tl;
  }
}
