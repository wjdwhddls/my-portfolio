/**
 * 프로젝트 데이터 — 실제 GitHub repo 기반.
 * 카드 UI는 ProjectCard.astro가 이 데이터를 .map()으로 렌더링.
 */

export interface ProjectLink {
  label: string;
  url: string;
}

/** 가죽 팔레트 키 — bookshelf.ts의 leatherPalettes에 정의 */
export type LeatherStyle = 'classic' | 'aged' | 'oxblood' | 'forest' | 'navy' | 'sand';

/** 책장 UI에서 책의 시각 표현을 결정하는 메타. 카드 UI에는 영향 없음. */
export interface ProjectBookMeta {
  /** 가죽 팔레트 키. 미지정 시 index 기반 fallback */
  leather?: LeatherStyle;
  /** 책등 폭(px). 미지정 시 stack.length 기반 자동 계산 (clamp 56~92) */
  spineWidth?: number;
  /** 책등 짧은 제목. 미지정 시 title 사용 */
  spineTitle?: string;
  /** 책등 서브라벨. 미지정 시 context 사용 */
  spineSubtitle?: string;
  /** 표지에 양각으로 새길 짧은 모노그램. 미지정 시 emoji 사용 */
  monogram?: string;
}

export interface Project {
  /** 카드 제목 */
  title: string;
  /** 카드 우상단/배경 이모지 (이미지 추가되면 교체) */
  emoji: string;
  /** 한 줄 요약 — 카드 본문 */
  summary: string;
  /** 굵직한 하이라이트 2~4줄 */
  highlights: string[];
  /** 기술 스택 칩 */
  stack: string[];
  /** 프로젝트 주요 역할 */
  role: string;
  /** 부가 라벨 (소속, 연도 등) */
  context?: string;
  /** 링크 묶음 (GitHub, Demo 등) */
  links: ProjectLink[];
  /** 카테고리 태그 */
  tags: string[];
  /** 책장 표현용 메타. 책장 컴포넌트에서만 사용, 카드 UI엔 영향 없음 */
  book?: ProjectBookMeta;
}

export const projects: Project[] = [
  {
    title: 'POFLIX — AI 홈시네마 음향 자동 최적화',
    emoji: '🎬',
    summary:
      '공간 구조와 영상의 감정을 AI가 동시 분석해 최적의 홈시네마 음향을 자동 세팅하는 멀티모달 AI 시스템.',
    highlights: [
      '스마트폰 LiDAR/RoomPlan으로 3D 공간 지도 생성',
      '멀티모달 음향 예측 xRIR — 1024차원 공간 음향 지문',
      '실시간 Valence-Arousal 감정 분석 + Ducking으로 대사 명료도 보호',
      'ViT · ResNet-18 · PANNs · X-CLIP · Cross-Attention 결합',
    ],
    stack: ['Python', 'PyTorch', 'TypeScript', 'Swift', 'Kotlin', 'Pyroomacoustics'],
    role: 'AI 모델 · Backend',
    context: 'POSCO AI·BigData Academy 32nd C4 (2026)',
    links: [
      { label: 'GitHub', url: 'https://github.com/wjdwhddls/Homecinema' },
    ],
    tags: ['Multimodal AI', 'PyTorch', 'Computer Vision', 'Audio ML'],
    book: {
      leather: 'oxblood',
      spineTitle: 'POFLIX',
      spineSubtitle: '2026 · C4',
      monogram: '🎬',
    },
  },
  {
    title: '실시간 딥보이스 탐지 서비스',
    emoji: '🔒',
    summary:
      'WebRTC 기반 실시간 통화 중에 상대방 음성이 딥보이스(음성 위변조)인지 AI로 판별해 보이스피싱·사칭을 방지하는 모바일 풀스택 서비스. 백엔드 + AI 모델 주담당.',
    highlights: [
      'React Native 0.78 + WebRTC + Socket.IO로 실시간 통화 클라이언트 구현',
      'NestJS 11 WebSocket Gateway로 실시간 시그널링 및 분석 파이프라인 서빙 (JWT 인증 · TypeORM/MySQL)',
      'WeSpeaker ResNet-221 + Siamese 네트워크 기반 화자/위변조 임베딩 추출',
      'Multi-model Ensemble 추론 + PyTorch Mobile(.ptl) 변환으로 디바이스 온디바이스 추론까지 지원',
    ],
    stack: [
      'React Native',
      'WebRTC',
      'Socket.IO',
      'NestJS',
      'TypeScript',
      'PyTorch',
      'PyTorch Mobile',
      'Python',
      'MySQL',
    ],
    role: 'Backend · AI 모델 주담당',
    context: '실시간 DeepVoice Detection (2025)',
    links: [
      { label: 'Mobile App', url: 'https://github.com/wjdwhddls/deepfake_detection_service_application' },
      { label: 'Backend', url: 'https://github.com/wjdwhddls/deepfake_detection_service_backend' },
      { label: 'AI Model', url: 'https://github.com/wjdwhddls/deepfake_detection_service_deepvoice' },
    ],
    tags: ['Real-time AI', 'Voice Anti-spoofing', 'WebRTC', 'NestJS', 'PyTorch'],
    book: {
      leather: 'navy',
      spineTitle: 'DeepVoice',
      spineSubtitle: '2025',
      monogram: '🔒',
    },
  },
  {
    title: '새벽배송 고객 분석 & 추천 플랫폼',
    emoji: '🛒',
    summary:
      '3,000명 고객 구매 데이터로 RFM 세분화·협업 필터링·연관규칙·매출 예측을 수행하고 React 대시보드로 시각화한 이커머스 분석 플랫폼.',
    highlights: [
      'RFM (PCA 가중치 R 71.0% / F 14.5% / M 14.4%) → VIP/Gold/Silver/Bronze 등급화',
      '3,000 × 58 구매 바이너리 행렬 + 연령대별 Top-5 협업 필터링 추천',
      'Apriori 알고리즘으로 1,000개 연관 규칙 도출',
      '8개 파생변수 엔지니어링 + OLS / Random Forest로 주간 ARPPU 예측',
    ],
    stack: ['Python', 'pandas', 'scikit-learn', 'mlxtend', 'React 19', 'TypeScript', 'Vite', 'Recharts'],
    role: 'Data Science · Full-stack',
    context: 'Ecommerce Analytics Platform',
    links: [
      { label: 'GitHub', url: 'https://github.com/wjdwhddls/Bigdata' },
    ],
    tags: ['Data Science', 'Recommendation', 'RFM', 'React', 'Python'],
    book: {
      leather: 'forest',
      spineTitle: 'Bigdata',
      spineSubtitle: 'Analytics',
      monogram: '🛒',
    },
  },
];
