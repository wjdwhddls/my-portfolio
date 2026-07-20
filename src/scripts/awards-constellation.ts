/**
 * 수상 별자리 — 카드 위 별(.award-star)들을 잇는 라인을 스크롤로 그린다.
 *
 * - 각 별의 중심 좌표를 #awards-field 기준으로 계산해 polyline 경로 구성
 * - stroke-dasharray/dashoffset + ScrollTrigger scrub으로 드로잉
 * - 리사이즈 시 경로 재계산 (ScrollTrigger refreshInit 훅)
 * - prefers-reduced-motion: 라인을 즉시 완성된 상태로 노출
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function init(): void {
  const field = document.getElementById('awards-field');
  const svg = field?.querySelector<SVGSVGElement>('.awards-lines');
  const line = field?.querySelector<SVGPolylineElement>('.awards-polyline');
  if (!field || !svg || !line) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 별 좌표를 다시 계산해 polyline에 반영하고 전체 길이를 반환 */
  const layout = (): number => {
    const fieldRect = field.getBoundingClientRect();
    const stars = Array.from(field.querySelectorAll<HTMLElement>('.award-star'));
    if (stars.length < 2) return 0;

    const pts = stars.map((s) => {
      const r = s.getBoundingClientRect();
      return `${r.left + r.width / 2 - fieldRect.left},${r.top + r.height / 2 - fieldRect.top}`;
    });
    line.setAttribute('points', pts.join(' '));
    return line.getTotalLength();
  };

  const len = layout();
  if (len === 0) return;

  if (reduceMotion) return; // 라인은 완성된 상태로 그대로 노출

  line.style.strokeDasharray = `${len}`;
  line.style.strokeDashoffset = `${len}`;

  gsap.to(line, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: field,
      start: 'top 85%',
      end: 'top 25%',
      scrub: 0.5,
      invalidateOnRefresh: true,
    },
  });

  ScrollTrigger.addEventListener('refreshInit', () => {
    const l = layout();
    if (l > 0) line.style.strokeDasharray = `${l}`;
  });
}
