/**
 * 시네마틱 룸 — 풀 뷰포트 sticky pin 모드.
 *
 * cinema-active 클래스를 부여해서 cinema.css 의 sticky pin + 100vh 룸을 활성화.
 * 카메라 시퀀스(GSAP ScrollTrigger)는 사용 안 함 — 단순 고정만.
 * cinema-interactive 도 항상 ON 으로 책장/펜던트 클릭 가능.
 */

function isMobile(): boolean {
  return window.innerWidth < 768;
}

export function init(): void {
  if (isMobile()) return;
  document.documentElement.classList.add('cinema-active', 'cinema-interactive');
}
