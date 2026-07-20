/**
 * 프로젝트 3D 원형 캐러셀 — 스크롤로 회전하는 실린더 갤러리 (데스크톱 전용).
 *
 * - 카드 N장을 rotateY(i·360/N) translateZ(R)로 원통 배치
 * - 섹션(300vh) 동안 sticky pin, 스크럽으로 링을 -(N-1)·각도 만큼 회전
 * - 정면 카드(.is-active)만 또렷하게, 나머지는 어둡게 — HUD에 인덱스/제목 표시
 * - 모바일(<768px)·reduced-motion: CSS에서 캐러셀 숨김(기존 카드 그리드 사용)
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let built = false;

export function init(): void {
  if (trySetup()) return;
  const retry = () => {
    if (trySetup()) {
      window.removeEventListener('resize', retry);
      window.removeEventListener('load', retry);
    }
  };
  window.addEventListener('resize', retry);
  window.addEventListener('load', retry);
}

function trySetup(): boolean {
  if (built) return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

  const section = document.getElementById('carousel-section');
  if (!section || window.innerWidth < 768) return false;

  const ring = section.querySelector<HTMLElement>('.carousel-ring');
  const cards = Array.from(section.querySelectorAll<HTMLElement>('.carousel-card'));
  const hudIndex = section.querySelector<HTMLElement>('.carousel-hud-index');
  const hudTitle = section.querySelector<HTMLElement>('.carousel-hud-title');
  if (!ring || cards.length === 0) return true;
  built = true;

  const N = cards.length;
  const angle = 360 / N;

  /* 카드 폭 기준 반지름 — 카드끼리 살짝 겹치지 않게 여유 계수 1.25.
     카드 수가 적으면 계산 반지름이 너무 작아지므로 최소값을 보장한다. */
  const cardW = cards[0].offsetWidth || 420;
  const R = Math.max(
    Math.round(((cardW / 2) / Math.tan((angle / 2) * (Math.PI / 180))) * 1.25),
    Math.round(cardW * 1.15),
  );

  cards.forEach((card, i) => {
    card.style.transform = `rotateY(${i * angle}deg) translateZ(${R}px)`;
  });

  // 링 자체를 뒤로 물려 정면 카드의 투영 확대를 완화 (rotationY 트윈과 독립 축)
  gsap.set(ring, { z: -Math.round(R * 0.38) });

  let active = -1;
  const setActive = (idx: number) => {
    if (idx === active) return;
    active = idx;
    cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    if (hudIndex) hudIndex.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    if (hudTitle) hudTitle.textContent = cards[idx].dataset.title ?? '';
  };
  setActive(0);

  gsap.to(ring, {
    rotationY: -(N - 1) * angle,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setActive(Math.min(N - 1, Math.max(0, Math.round(self.progress * (N - 1)))));
      },
    },
  });

  // 섹션 진입 시 캐러셀 등장
  gsap.from(ring, {
    opacity: 0,
    y: 60,
    duration: 1.0,
    ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' },
  });

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__carousel = { ring, cards, R, angle, setActive };
  }

  return true;
}
