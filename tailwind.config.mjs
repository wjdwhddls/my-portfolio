/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class', // 고정 다크 톤이지만 추후 토글 확장 여지
  theme: {
    extend: {
      colors: {
        // 시맨틱 컬러 토큰 — CSS 변수로 연결되어 tokens.css에서 실제 값을 관리
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        'ink-subtle': 'rgb(var(--color-ink-subtle) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      letterSpacing: {
        tightish: '-0.02em',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'border-gradient': 'borderGradient 3s ease infinite',
        blink: 'blink 0.8s ease-in-out infinite',
        'code-fade-in': 'codeFadeIn 0.5s ease-out forwards',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
};
