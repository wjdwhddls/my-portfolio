/**
 * 수상 내역 — About 섹션의 타임라인 자리에 노출.
 * 프로젝트와 중복 정보 없이 "팀 단위로 평가받은 외부 성과"만 정리.
 */

export type AwardRank = 'grand' | 'excellence' | 'best-project';

export interface Award {
  /** 상의 이름 (예: "대상", "우수상", "프로젝트 최우수상") */
  rank: string;
  /** 등급 카테고리 — 색상·이모지 분기에 사용 */
  rankKey: AwardRank;
  /** 부문이나 부가 라벨 */
  category?: string;
  /** 대회 / 사업 이름 */
  competition: string;
  /** 주관 기관 */
  organizer: string;
  /** 수상일 (YYYY.MM.DD) */
  date: string;
  /** 팀명 (있을 때) */
  teamName?: string;
  /** 팀원 (정종인 포함) */
  members: string[];
  /** 한 줄 설명 — 어떤 점을 인정받았는지 */
  note: string;
}

export const awards: Award[] = [
  {
    rank: '프로젝트 최우수상',
    rankKey: 'best-project',
    competition: '청년 AI·BigData 아카데미 32기 교육과정',
    organizer: '포스코인재창조원 · 포항공과대학교',
    date: '2026.04.30',
    teamName: 'C분반 4조',
    members: ['김가은', '박도현', '안법인', '정종인', '최진원'],
    note: '교육과정 전체에서 "가장 우수한 프로젝트 성적"으로 표창 (POFLIX — AI 홈시네마 음향 자동 최적화).',
  },
  {
    rank: '대상',
    rankKey: 'grand',
    competition: '2025 디지털 바이오헬스 종합설계 경진대회',
    organizer: '홍익대학교 바이오헬스 혁신융합대학사업단',
    date: '2025.12.05',
    teamName: 'T.S',
    members: ['황규범', '정종인', '고성운', '김동현'],
    note: '"탁월한 창의성과 우수한 기술역량"을 인정받아 대상 수상.',
  },
  {
    rank: '대상',
    rankKey: 'grand',
    competition: '2025 충청권 ICT이노베이션스퀘어 확산 사업 (개발 역량 강화 멘토링)',
    organizer: '(재)세종테크노파크',
    date: '2025.11.26',
    teamName: 'T.S.',
    members: ['정종인'],
    note: '멘토링 사업 전 과정에서 우수한 성적을 거두어 대상 수상.',
  },
  {
    rank: '우수상',
    rankKey: 'excellence',
    category: '데이터 분석 및 보안 부문',
    competition: '2025년도 "지역혁신 인재양성" 연합 페스티벌 공모전',
    organizer: '한국정보통신보안윤리학회(KSSE)',
    date: '2025.11.14',
    members: ['고성운', '정종인', '황규범', '김동현'],
    note: '데이터 분석 및 보안 부문에서 "창의적이고 탁월한 아이디어"로 우수상 수상.',
  },
];
