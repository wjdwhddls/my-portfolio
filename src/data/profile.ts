/**
 * 인물 프로필 데이터 — 사이트 전역에서 참조하는 단일 진실 출처.
 * 변경 시 메타 태그(JSON-LD), Hero, Contact, Footer 모두 자동 반영.
 */

export interface Profile {
  /** 한글 이름 */
  name: string;
  /** 영문 이름 */
  nameEn: string;
  /** 짧은 한 줄 정체성 — Hero 부제로 노출 */
  tagline: string;
  /** 타이핑 효과로 순환할 문구들 — Hero에서 사용 */
  typingPhrases: string[];
  /** Hero 본문 (3~4줄 정도) */
  intro: string;
  /** 메인 이메일 */
  email: string;
  /** GitHub username */
  githubHandle: string;
  /** GitHub display 별칭 */
  githubDisplay: string;
  /** GitHub bio */
  bio: string;
  /** Tistory 블로그 username */
  blogTistory: string;
  /** 사이트 캐노니컬 URL */
  siteUrl: string;
  /** OG 이미지 경로 (BASE_URL 기준 절대 경로) */
  ogImage: string;
  /** OG 이미지 MIME 타입 */
  ogImageType: string;
}

export const profile: Profile = {
  name: '정종인',
  nameEn: 'Jeong Jong-in',
  tagline: 'AI Engineer / Backend Developer',
  typingPhrases: [
    'Multimodal AI',
    'Deep Learning',
    'Backend Architecture',
    'Data-driven Products',
  ],
  intro:
    'PyTorch 기반 멀티모달 AI와 TypeScript 백엔드를 함께 다루는 개발자입니다. 실시간 딥보이스 탐지, 음향 자동 최적화, 데이터 기반 추천 시스템 등 실세계 문제를 AI와 엔지니어링으로 풉니다.',
  email: 'bfpark99@naver.com',
  githubHandle: 'wjdwhddls',
  githubDisplay: 'jjong_0425',
  bio: '저는 개발자 정종인입니다! 🌱',
  blogTistory: 'jjong0425',
  siteUrl: 'https://wjdwhddls.github.io/my-portfolio',
  ogImage: '/my-portfolio/og-image.svg',
  ogImageType: 'image/svg+xml',
};

/** 자주 쓰는 파생 링크들 */
export const links = {
  github: `https://github.com/${profile.githubHandle}`,
  mailto: `mailto:${profile.email}`,
  tistory: `https://${profile.blogTistory}.tistory.com`,
} as const;
