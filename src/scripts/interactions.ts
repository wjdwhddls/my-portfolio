/**
 * 사이트 전역 인터랙션 — BaseLayout에서 한 번만 로드된다.
 *
 * 책임:
 *   1. 스크롤 진행 바 너비 갱신
 *   2. Navbar — 50px 스크롤 시 glass 효과 토글
 *   3. 활성 nav 링크 — 현재 보이는 섹션과 동기화
 *   4. Hero blob 패럴렉스
 *   5. 모바일 메뉴 토글 (aria-expanded 동기화)
 *   6. 커서 글로우 (데스크톱)
 *   7. 부드러운 스크롤 (앵커 링크 일괄)
 *   8. scroll-to-top 버튼 가시성
 *   9. IntersectionObserver로 .fade-in-up 등 진입 애니메이션 트리거 + stagger
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 1. 스크롤 진행 바 ─────────────────────────────────────────
const progressEl = document.getElementById('scroll-progress');
const updateScrollProgress = () => {
  if (!progressEl) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressEl.style.width = `${progress}%`;
};

// ── 2. Navbar glass 효과 ──────────────────────────────────────
const navbar = document.getElementById('navbar');
const updateNavbar = () => {
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.classList.add('glass');
    navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
  } else {
    navbar.classList.remove('glass');
    navbar.style.borderBottom = 'none';
  }
};

// ── 3. 활성 nav 링크 ──────────────────────────────────────────
const updateActiveNavLink = () => {
  const sections = document.querySelectorAll<HTMLElement>('section[id]');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
  let currentSection = '';

  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 200) {
      currentSection = section.getAttribute('id') ?? '';
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove('active');
    if (link.getAttribute('href')?.slice(1) === currentSection) {
      link.classList.add('active');
    }
  });
};

// ── 4. Hero blob 패럴렉스 ─────────────────────────────────────
const updateParallax = () => {
  if (reduceMotion) return;
  const heroSection = document.getElementById('home');
  if (!heroSection) return;
  const blobs = heroSection.querySelectorAll<HTMLElement>('.float-animate');
  blobs.forEach((blob, i) => {
    const speed = (i + 1) * 0.1;
    blob.style.transform = `translateY(${-window.scrollY * speed}px)`;
  });
};

// ── 5. 모바일 메뉴 ───────────────────────────────────────────
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    const expanded = mobileMenu.classList.toggle('hidden');
    mobileBtn.setAttribute('aria-expanded', String(!expanded));
    mobileBtn.setAttribute('aria-label', expanded ? '메뉴 열기' : '메뉴 닫기');
  });
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileBtn.setAttribute('aria-label', '메뉴 열기');
    }),
  );
}

// ── 6. 커서 글로우 ───────────────────────────────────────────
const glow = document.getElementById('cursor-glow');
if (glow && !reduceMotion) {
  document.addEventListener('mousemove', (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

// ── 7. 부드러운 스크롤 (앵커) ────────────────────────────────
// Lenis가 활성화되어 있으면 lenis.scrollTo로 통일 (시네마틱 ScrollTrigger와 호환).
// reduce-motion 시 Lenis가 생성되지 않으므로 자동 native fallback.
type LenisLike = {
  scrollTo: (target: HTMLElement | number, options?: { offset?: number }) => void;
};
function getLenis(): LenisLike | null {
  return (window as unknown as { __lenis: LenisLike | null }).__lenis;
}

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href') ?? '';
    if (href.length <= 1) return;
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { offset: -64 /* navbar 보정 */ });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });
});

// ── 8. scroll-to-top 버튼 ────────────────────────────────────
const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}
const updateScrollTop = () => {
  if (!scrollTopBtn) return;
  scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
};

// ── 9. 진입 애니메이션 (IntersectionObserver) ────────────────
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target as HTMLElement;
        el.style.animationPlayState = 'running';

        if (el.classList.contains('stagger-children')) {
          Array.from(el.children).forEach((child, i) => {
            const c = child as HTMLElement;
            c.style.animationDelay = `${i * 0.1}s`;
            c.style.animationPlayState = 'running';
          });
        }
      }
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll<HTMLElement>('.fade-in-up, .slide-in-left, .scale-in, .stagger-children').forEach((el) => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});
document.querySelectorAll<HTMLElement>('.stagger-children > *').forEach((c) => {
  c.style.animationPlayState = 'paused';
});

// ── 스크롤 이벤트 한 번 묶어서 ───────────────────────────────
let ticking = false;
const onScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollProgress();
      updateNavbar();
      updateActiveNavLink();
      updateParallax();
      updateScrollTop();
      ticking = false;
    });
    ticking = true;
  }
};
window.addEventListener('scroll', onScroll, { passive: true });

// 초기 1회 실행
updateNavbar();
updateActiveNavLink();
