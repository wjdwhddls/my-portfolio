# 🚀 정종인 Portfolio | Jeong Jong-in Portfolio

[![Live](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)](https://wjdwhddls.github.io/my-portfolio/)
[![Astro](https://img.shields.io/badge/Astro-4.x-FF5D01?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> AI Engineer / Backend Developer 정종인의 개인 포트폴리오 사이트
>
> **Live**: <https://wjdwhddls.github.io/my-portfolio/>

---

## 📌 About

PyTorch 기반 멀티모달 AI와 TypeScript 백엔드를 함께 다루는 개발자입니다. 실시간 딥보이스 탐지, 음향 자동 최적화, 데이터 기반 추천 시스템 등 실세계 문제를 AI와 엔지니어링으로 풉니다.

### Featured Projects

| Project | Summary | Stack |
|---|---|---|
| **[POFLIX](https://github.com/wjdwhddls/Homecinema)** | AI 홈시네마 음향 자동 최적화 (POSCO AI Academy 32nd C4) | PyTorch · ViT · ResNet · PANNs · X-CLIP |
| **[실시간 딥보이스 탐지 서비스](https://github.com/wjdwhddls/deepfake_detection_service_application)** | WebRTC 통화 중 음성 위변조를 실시간 판별하는 모바일 풀스택 서비스 | React Native · WebRTC · NestJS · PyTorch Mobile |
| **[Bigdata Ecommerce Platform](https://github.com/wjdwhddls/Bigdata)** | 새벽배송 RFM/추천/예측 + React 대시보드 | Python · pandas · React 19 · Recharts |

---

## 🛠️ Tech Stack (사이트 자체)

- **Framework**: [Astro 4](https://astro.build) — 정적 사이트 생성, 컴포넌트 분리, JS는 필요한 곳에만 hydrate
- **Styling**: Tailwind CSS 3 + CSS 변수 토큰 시스템 (`src/styles/tokens.css`)
- **Language**: TypeScript (strict)
- **Fonts**: Noto Sans KR, JetBrains Mono (Google Fonts)
- **Hosting**: GitHub Pages (자동 배포 via GitHub Actions)

### 인터랙션 특징

- 🌌 Canvas 2D 파티클 배경 (요소 60개, 120px 거리 라인 연결)
- ⌨️ 타이핑 효과 (`Multimodal AI` → `Deep Learning` → ...)
- 🎴 3D 카드 틸트 (마우스 위치 기반 perspective rotate)
- 🧲 자기장 버튼 + 리플 효과
- 🪟 글래스모피즘 UI
- 📊 스크롤 진행 바 + 패럴렉스 blob
- ♿ `prefers-reduced-motion` 완전 대응

---

## 📂 디렉토리 구조

```
my_portfolio_site/
├── src/
│   ├── pages/index.astro         # 메인 1-pager
│   ├── layouts/BaseLayout.astro  # HTML shell, meta/OG/JSON-LD
│   ├── components/               # 정적 컴포넌트
│   │   ├── Hero.astro / About.astro / Projects.astro …
│   │   └── client/               # 클라이언트 JS 컴포넌트
│   ├── data/                     # profile/skills/projects/timeline (단일 진실 출처)
│   ├── scripts/interactions.ts   # 글로벌 인터랙션 (스크롤·메뉴·옵저버)
│   └── styles/                   # tokens.css + global.css
├── public/                       # favicon, og-image, resume.pdf (예정)
├── legacy/                       # 마이그레이션 이전 vanilla 백업
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## 🚀 빠른 시작

```bash
# 1) 의존성 설치
npm install

# 2) 로컬 개발 서버 (http://localhost:4321)
npm run dev

# 3) 프로덕션 빌드
npm run build

# 4) 빌드 결과 미리보기
npm run preview
```

### 콘텐츠 수정 위치

- 인물 정보(이름, 이메일, GitHub 등): `src/data/profile.ts`
- 기술 스택: `src/data/skills.ts`
- 프로젝트: `src/data/projects.ts`
- 경력/활동: `src/data/timeline.ts`
- 색상 토큰: `src/styles/tokens.css`

### 연락 폼 활성화 (Formspree)

1. [Formspree](https://formspree.io)에서 폼 생성 → endpoint URL 발급
2. 프로젝트 루트에 `.env`를 만들고 다음 한 줄 추가:
   ```
   PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/XXXXXXXX
   ```
3. 미설정 시 폼은 `mailto:` fallback으로 동작

---

## 📦 배포 (GitHub Pages)

본 저장소는 `main` 브랜치에 push 시 GitHub Actions(`.github/workflows/deploy.yml`)가 자동으로 빌드하고 `gh-pages` 환경에 배포합니다.

설정 확인:
- `astro.config.mjs`의 `site` / `base` 값이 GitHub Pages URL과 일치하는지
- Repository Settings → Pages → Source: **GitHub Actions** 선택

---

## ♿ 접근성·SEO

- `<html lang="ko">` 명시
- `prefers-reduced-motion: reduce` 대응 — 파티클·타이핑·자기장 효과 자동 비활성
- `:focus-visible` 키보드 포커스 링
- 모바일 메뉴 `aria-expanded` 동기화
- JSON-LD `@type: Person` 구조화 데이터
- Open Graph / Twitter Card meta 일괄 주입
- favicon.svg + og-image.svg (1200×630)

---

## 📧 Contact

- **Email**: bfpark99@naver.com
- **GitHub**: [@wjdwhddls](https://github.com/wjdwhddls)
- **Blog**: [jjong0425.tistory.com](https://jjong0425.tistory.com)

---

## 📝 License

MIT License — 자유롭게 참고하셔도 좋습니다.

---

**Made with ❤️ by Jeong Jong-in** · _Last refreshed_: 2026-05-11
