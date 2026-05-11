# 🚀 Portfolio Site | 포트폴리오

[![Deployed](https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square)](https://wjdwhddls.github.io/my-portfolio/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🎯 [Live Demo →](https://wjdwhddls.github.io/my-portfolio/)

---

## 📌 소개 | Introduction

정종인(Jeong Jong-in)의 개인 포트폴리오 웹사이트입니다. 현대적인 웹 기술과 창의적인 UI/UX 디자인으로 제작되었으며, 프로젝트와 기술 역량을 효과적으로 보여줄 수 있도록 설계되었습니다.

**Personal portfolio website featuring modern web technologies and creative UI/UX design to effectively showcase projects and technical expertise.**

### ✨ 주요 특징 | Key Features

- 🎨 **파티클 배경 애니메이션** - Canvas API를 활용한 동적 입자 효과
- ⌨️ **타이핑 효과** - 자동 순환하는 텍스트 애니메이션
- 👁️ **스크롤 애니메이션** - IntersectionObserver 기반의 페이드인 효과
- 🎭 **3D 카드 틸트** - 마우스 움직임에 반응하는 3D 카드 효과
- 🧲 **자기장 버튼 효과** - 자석처럼 따라오는 인터랙티브 버튼
- 🌫️ **글래스모피즘 UI** - 현대적인 유리 효과 디자인
- 📊 **스크롤 진행 바** - 페이지 진행 상황 시각화
- 📱 **완벽한 반응형 디자인** - 모바일, 태블릿, 데스크톱 모두 최적화
- 🍔 **모바일 네비게이션** - 터치 친화적 햄버거 메뉴

---

## 🛠️ 기술 스택 | Tech Stack

### Frontend
- **Markup**: HTML5
- **Styling**: CSS3 + TailwindCSS (CDN)
- **Programming**: Vanilla JavaScript (ES6+)
- **Fonts**: Google Fonts (Noto Sans KR)
- **Graphics**: Canvas API for Particle Animation
- **Performance**: IntersectionObserver API

### Key Libraries & APIs
- Canvas 2D Context
- Fetch API
- LocalStorage
- CSS Custom Properties

---

## 📂 프로젝트 구조 | Project Structure

```
my_portfolio_site/
├── index.html          # 메인 HTML 파일
├── styles.css          # 커스텀 CSS 스타일
├── main.js             # JavaScript 로직 및 애니메이션
└── README.md           # 프로젝트 설명서
```

---

## 🎨 사이트 구성 | Site Sections

### 🏠 Home (Hero)
- 매력적인 환영 섹션
- 파티클 배경 애니메이션
- 타이핑 효과를 통한 자기소개
- CTA(Call To Action) 버튼

### 👤 About
- 개인 소개 및 경력 정보
- 기술 스택 및 핵심 기술
- 프로파일 이미지

### 🚀 Projects
- 프로젝트 포트폴리오
- 프로젝트 카드 (3D 틸트 효과)
- 기술 스택 태그
- 외부 링크 (GitHub, Demo)

### 📞 Contact
- 연락처 정보
- 소셜 미디어 링크
- 연락 폼
- 위치 정보

---

## 🚀 빠른 시작 | Quick Start

### 1️⃣ 파일 구조 확인
모든 파일(`index.html`, `styles.css`, `main.js`)이 같은 디렉토리에 있는지 확인하세요.

### 2️⃣ 브라우저에서 열기
```bash
# 간단한 방법: 직접 HTML 파일 열기
open index.html

# 또는 로컬 서버 사용 (권장)
python3 -m http.server 8000
# 그 다음 브라우저에서 http://localhost:8000 접속
```

### 3️⃣ 커스터마이징
- `index.html`: 개인 정보, 프로젝트 내용 수정
- `styles.css`: 색상, 폰트, 레이아웃 조정
- `main.js`: 애니메이션 속도, 효과 커스터마이징

---

## 📋 브라우저 호환성 | Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ 최신 버전 |
| Firefox | ✅ 최신 버전 |
| Safari | ✅ 최신 버전 |
| Edge | ✅ 최신 버전 |
| IE 11 | ❌ 지원 불가 |

---

## 🎯 배포 | Deployment

### GitHub Pages
이 사이트는 GitHub Pages로 호스팅되고 있습니다.

**Live URL**: https://wjdwhddls.github.io/my-portfolio/

### 자신의 GitHub Pages에 배포하기
1. GitHub 저장소 생성 (`username.github.io` 또는 프로젝트 이름)
2. 파일 업로드
3. Settings → Pages에서 배포 설정
4. 자동 배포 또는 수동 푸시

---

## 📖 커스터마이징 가이드 | Customization Guide

### 색상 변경
`styles.css`에서 CSS 변수 수정:
```css
:root {
  --primary: #your-color;
  --secondary: #your-color;
  /* ... */
}
```

### 폰트 변경
`index.html`의 Google Fonts 링크 수정:
```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font" rel="stylesheet">
```

### 파티클 효과 조정
`main.js`에서 파티클 설정 수정:
```javascript
const particleCount = 100; // 입자 개수
const particleSpeed = 0.5; // 속도
```

---

## 📝 라이선스 | License

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 👨‍💻 작가 | Author

**Jeong Jong-in (정종인)**

- GitHub: [@wjdwhddls](https://github.com/wjdwhddls)
- Portfolio: [https://wjdwhddls.github.io/my-portfolio/](https://wjdwhddls.github.io/my-portfolio/)

---

## 📧 문의 | Contact

질문이나 제안이 있으신가요?
- GitHub Issues를 통해 버그 보고
- 포트폴리오 사이트의 Contact 섹션으로 연락

---

## 🙏 감사의 말 | Credits

- Canvas API & Web Animation 참고 자료
- TailwindCSS 문서
- Google Fonts

---

**Last Updated**: 2026-03-05
**Made with ❤️ by Jeong Jong-in**
