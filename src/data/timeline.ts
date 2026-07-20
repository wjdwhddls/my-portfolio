/**
 * 경력 로드맵 데이터 — About(Career) 섹션의 마일스톤.
 * 순서대로 로드맵에 노출된다 (과거 → 현재).
 * description은 자유롭게 채워 넣는 자리 — 구체 내용은 본인이 보강.
 */

export interface TimelineItem {
  /** 직책/과정명 */
  title: string;
  /** 소속 */
  organization: string;
  /** 기간 ("YYYY.MM" 또는 "YYYY.MM - 현재") */
  period: string;
  /** 설명 */
  description: string;
  /** 어떤 카테고리인지 — 아이콘/색상 분기에 활용 */
  type: 'experience' | 'education' | 'program';
  /** 현재 진행 중 여부 — 로드맵에서 배지로 강조 */
  current?: boolean;
}

export const timeline: TimelineItem[] = [
  {
    title: '홍익대학교(세종) 졸업',
    organization: '홍익대학교 세종캠퍼스',
    period: '2026.02',
    description: '학사 졸업. AI와 백엔드 엔지니어링의 기반을 다진 시간.',
    type: 'education',
  },
  {
    title: '삼일PwC 인턴',
    organization: 'Samil PwC',
    period: '2026.06 - 현재',
    description: '인턴으로 근무하며 실무 현장에서 경험을 쌓는 중.',
    type: 'experience',
    current: true,
  },
];
