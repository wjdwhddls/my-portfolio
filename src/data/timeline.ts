/**
 * 경력 & 교육 타임라인 — About 섹션에서 사용.
 * 실데이터화 단계로 더미(Tech Company Inc. 등) 제거. 사용자가 추가 채우는 자리로
 * 현재 확실히 검증된 POSCO 아카데미 + 향후 추가 가능한 placeholder만 노출.
 */

export interface TimelineItem {
  /** 직책/과정명 */
  title: string;
  /** 소속 */
  organization: string;
  /** 기간 ("YYYY - YYYY" 또는 "YYYY - Present") */
  period: string;
  /** 설명 */
  description: string;
  /** 어떤 카테고리인지 — 아이콘/색상 분기에 활용 */
  type: 'experience' | 'education' | 'program';
}

export const timeline: TimelineItem[] = [
  {
    title: 'POSCO AI·BigData Academy 32nd',
    organization: 'POSCO 교육재단',
    period: '2026',
    description:
      'C4 팀(POFLIX): AI 기반 홈시네마 음향 자동 최적화 시스템 개발. 멀티모달 AI(ViT, ResNet-18, PANNs, X-CLIP, Cross-Attention) 적용.',
    type: 'program',
  },
  {
    title: '실시간 딥보이스 탐지 서비스',
    organization: '개인 / 팀 프로젝트',
    period: '2025',
    description:
      'WebRTC·Socket.IO 기반 실시간 통화 중 음성 위변조를 판별하는 모바일 서비스. NestJS WebSocket Gateway + WeSpeaker ResNet-221 기반 딥보이스 탐지 모델(PyTorch Mobile 변환 포함) 주담당.',
    type: 'experience',
  },
  {
    title: 'Backend & Data Engineering 학습',
    organization: 'NestJS · Node.js · Big Data',
    period: '2025',
    description:
      'NestJS 기반 게시판 애플리케이션, Node.js 백엔드 샘플, Jupyter 기반 데이터 분석 등 다양한 사이드 프로젝트로 백엔드·데이터 역량 강화.',
    type: 'experience',
  },
];
