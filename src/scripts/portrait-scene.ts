/**
 * 파티클 초상 — 증명사진을 흰 별 입자들로 재구성하는 "별자리 초상" (2D Canvas).
 *
 * - public/profile.jpg 를 다운샘플해 어두운(피사체) 픽셀 위치를 별의 홈 좌표로 사용
 * - 로드 시 흩어진 별들이 초상으로 "재조립"되는 인트로
 * - 마우스 근처의 별은 부드럽게 밀려나고, 손을 떼면 제자리로 복귀
 * - 히어로를 지나 스크롤하면 별들이 사방으로 흩어지며 잦아든다
 * - 사진이 없으면(404) 'JJ' 모노그램을 대신 샘플링하는 폴백
 * - prefers-reduced-motion: 조립 완료 정지 화면만 렌더
 */

const MAX_PARTICLES = 7000;

type Star = {
  hx: number; // 홈 좌표
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  dirX: number; // 스크롤 산란 방향
  dirY: number;
};

export function init(canvas: HTMLCanvasElement, imageUrl: string): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  const hero = canvas.closest('section');
  if (!ctx || !hero) return;

  const dpr = Math.min(window.devicePixelRatio, 2);
  let W = 0;
  let H = 0;
  let stars: Star[] = [];

  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /** 이미지(또는 폴백 모노그램)를 다운샘플해 별 홈 좌표를 만든다 */
  const sample = (source: CanvasImageSource, sw: number, sh: number) => {
    // 초상을 캔버스 중앙에 맞추는 스케일 (contain, 약간의 여백)
    const fit = Math.min((W * 0.92) / sw, (H * 0.92) / sh);
    const dw = sw * fit;
    const dh = sh * fit;
    const ox = (W - dw) / 2;
    const oy = (H - dh) / 2;

    // 성능을 위해 저해상도 격자로 샘플
    const GRID = 110; // 가로 셀 수
    const cell = sw / GRID;
    const off = document.createElement('canvas');
    off.width = GRID;
    off.height = Math.round(sh / cell);
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.drawImage(source, 0, 0, off.width, off.height);
    const data = octx.getImageData(0, 0, off.width, off.height).data;

    const picked: Array<{ x: number; y: number; dark: number }> = [];
    for (let gy = 0; gy < off.height; gy++) {
      for (let gx = 0; gx < off.width; gx++) {
        const i = (gy * off.width + gx) * 4;
        const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        const a = data[i + 3] / 255;
        const dark = (1 - lum) * a; // 어두울수록(피사체) 1에 가까움
        if (dark > 0.16) picked.push({ x: gx / off.width, y: gy / off.height, dark });
      }
    }

    // 상한 초과 시 어두운 픽셀 우선으로 균등 추림
    let list = picked;
    if (picked.length > MAX_PARTICLES) {
      const step = picked.length / MAX_PARTICLES;
      list = [];
      for (let i = 0; i < picked.length; i += step) list.push(picked[Math.floor(i)]);
    }

    stars = list.map((p) => {
      const hx = ox + p.x * dw + (Math.random() - 0.5) * 1.2;
      const hy = oy + p.y * dh + (Math.random() - 0.5) * 1.2;
      const theta = Math.random() * Math.PI * 2;
      return {
        hx,
        hy,
        // 인트로: 화면 밖 사방에서 모여들도록 흩어진 시작점
        x: W / 2 + Math.cos(theta) * (Math.max(W, H) * (0.6 + Math.random() * 0.6)),
        y: H / 2 + Math.sin(theta) * (Math.max(W, H) * (0.6 + Math.random() * 0.6)),
        vx: 0,
        vy: 0,
        size: 0.7 + p.dark * 1.5 + Math.random() * 0.5,
        alpha: 0.35 + p.dark * 0.65,
        dirX: Math.cos(theta),
        dirY: Math.sin(theta),
      };
    });

    if (reduceMotion) {
      // 정지 화면: 조립 완료 상태로 1회 렌더
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        ctx.globalAlpha = s.alpha;
        ctx.fillRect(s.hx, s.hy, s.size, s.size);
      }
      ctx.globalAlpha = 1;
    }
  };

  /** 사진 로드 — 실패 시 'JJ' 모노그램 폴백 */
  const load = () => {
    const img = new Image();
    img.onload = () => sample(img, img.naturalWidth, img.naturalHeight);
    img.onerror = () => {
      const fb = document.createElement('canvas');
      fb.width = 400;
      fb.height = 500;
      const fctx = fb.getContext('2d');
      if (!fctx) return;
      fctx.fillStyle = '#fff';
      fctx.fillRect(0, 0, fb.width, fb.height);
      fctx.fillStyle = '#000';
      fctx.font = '900 240px "Noto Sans KR", sans-serif';
      fctx.textAlign = 'center';
      fctx.textBaseline = 'middle';
      fctx.fillText('JJ', fb.width / 2, fb.height / 2);
      sample(fb, fb.width, fb.height);
    };
    img.src = imageUrl;
  };

  resize();
  load();
  window.addEventListener('resize', () => {
    resize();
    load(); // 좌표 체계가 바뀌므로 재샘플
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    },
    { passive: true },
  );

  if (reduceMotion) return;

  /* ---------- 메인 루프 ---------- */
  let pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  const tick = () => {
    requestAnimationFrame(tick);
    if (!pageVisible || stars.length === 0) return;

    // 히어로 이탈 스크롤 진행 → 산란 정도
    const heroRect = hero.getBoundingClientRect();
    const scatter = Math.min(1, Math.max(0, -heroRect.top / (heroRect.height * 0.7)));

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';

    const spread = scatter * Math.max(W, H) * 0.9;
    const fade = 1 - scatter * 0.9;

    for (const s of stars) {
      // 산란이 섞인 목표점
      const tx = s.hx + s.dirX * spread;
      const ty = s.hy + s.dirY * spread;

      // 스프링 복원
      s.vx += (tx - s.x) * 0.045;
      s.vy += (ty - s.y) * 0.045;

      // 마우스 반발
      const dx = s.x - mouse.x;
      const dy = s.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 5200) {
        const d = Math.sqrt(d2) || 1;
        const f = ((72 - d) / 72) * 2.2;
        s.vx += (dx / d) * f;
        s.vy += (dy / d) * f;
      }

      s.vx *= 0.86;
      s.vy *= 0.86;
      s.x += s.vx;
      s.y += s.vy;

      ctx.globalAlpha = s.alpha * fade;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  };
  tick();

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__portrait = {
      get count() {
        return stars.length;
      },
      renderOnce: () => {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        for (const s of stars) {
          ctx.globalAlpha = s.alpha;
          ctx.fillRect(s.hx, s.hy, s.size, s.size);
        }
        ctx.globalAlpha = 1;
      },
    };
  }
}
