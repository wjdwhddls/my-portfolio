/**
 * 책장 UI 전용 상수/유틸.
 * 카드 그리드 쪽 코드와는 격리되어 있어 책장 기능을 제거해도 카드 UI에 영향이 없다.
 */
import type { LeatherStyle, Project } from './projects';

/** 한 단(shelf)에 들어가는 책 권수. 초과하면 다음 단으로 자동 분단 */
export const BOOKS_PER_SHELF = 6;

/** 책 기본 높이(px) — 모든 책 공통 */
export const BOOK_HEIGHT = 240;

export interface LeatherPalette {
  /** 책등 중앙의 가죽 본색 */
  base: string;
  /** 양쪽 가장자리의 짙은 음영 */
  deep: string;
  /** 책등 중앙 부근 하이라이트 */
  high: string;
  /** 금박(제목·띠·구분선)에 사용하는 색 */
  gold: string;
}

/**
 * 가죽 팔레트 6종 — 사이트 톤이 흑백 모노크롬이므로 그레이스케일로 환원.
 * 키 이름은 유지하여 `Project.book.leather` 데이터 호환성 유지.
 * 각 책마다 ΔL≈8 차이로 6단계 위계를 만들어 흑백에서도 명확히 구분된다.
 * 책등의 `gold`(제목/띠)는 base와 충분한 대비를 두어 가독성을 확보.
 */
export const leatherPalettes: Record<LeatherStyle, LeatherPalette> = {
  classic: { base: '#1a1a1a', deep: '#0a0a0a', high: '#2e2e2e', gold: '#c8c8c8' },
  oxblood: { base: '#272727', deep: '#141414', high: '#3a3a3a', gold: '#d4d4d4' },
  navy:    { base: '#363636', deep: '#1f1f1f', high: '#4b4b4b', gold: '#dcdcdc' },
  forest:  { base: '#454545', deep: '#2a2a2a', high: '#5a5a5a', gold: '#e2e2e2' },
  sand:    { base: '#555555', deep: '#363636', high: '#6e6e6e', gold: '#ececec' },
  aged:    { base: '#6a6a6a', deep: '#444444', high: '#828282', gold: '#f4f4f4' },
};

/** 가죽 미지정 시 index 순서로 돌려 자연스럽게 색이 섞이도록 */
const FALLBACK_ORDER: LeatherStyle[] = ['oxblood', 'navy', 'forest', 'classic', 'sand', 'aged'];

/** 프로젝트의 가죽 색 결정 (지정 → fallback 순서) */
export function resolveLeather(p: Project, idx: number): LeatherStyle {
  return p.book?.leather ?? FALLBACK_ORDER[idx % FALLBACK_ORDER.length];
}

/** 책등 폭: stack 길이가 길수록 두꺼운 책으로. clamp 56~92px */
export function resolveSpineWidth(p: Project): number {
  if (p.book?.spineWidth) return p.book.spineWidth;
  return Math.max(56, Math.min(92, 48 + p.stack.length * 4));
}

/**
 * 책의 안정적 ID. 한글 제목/특수문자에서도 빈 문자열·충돌이 나지 않도록
 * 인덱스 기반으로 채번한다. 책장의 순서가 곧 책의 정체성이라는 점을 활용.
 */
export function bookId(index: number): string {
  return `book-${index}`;
}

/** 프로젝트 배열을 단(shelf)별로 분할 */
export function chunkIntoShelves<T>(items: T[], perShelf: number = BOOKS_PER_SHELF): T[][] {
  const shelves: T[][] = [];
  for (let i = 0; i < items.length; i += perShelf) {
    shelves.push(items.slice(i, i + perShelf));
  }
  return shelves;
}

/**
 * 더미 책 생성 — wall variant 책장에서 내 프로젝트 책 좌우를 채운다.
 * 한 책장이 진짜 책장처럼 보이도록 회색 톤의 더미 책 N개를 만든다.
 * 각 책의 폭·높이·명도가 살짝씩 달라 자연스러운 진열 효과.
 */
export interface DummyBook {
  w: number;       // 책등 폭(px)
  h: number;       // 책 높이(px)
  base: string;    // 책등 본색
  deep: string;    // 음영색
  highlight: string; // 하이라이트색
}

const DUMMY_TONES: Array<Pick<DummyBook, 'base' | 'deep' | 'highlight'>> = [
  { base: '#1a1a1a', deep: '#0a0a0a', highlight: '#2a2a2a' },
  { base: '#222222', deep: '#101010', highlight: '#333333' },
  { base: '#2a2a2a', deep: '#141414', highlight: '#3c3c3c' },
  { base: '#1f1f1f', deep: '#0c0c0c', highlight: '#2e2e2e' },
  { base: '#262626', deep: '#121212', highlight: '#353535' },
  { base: '#2e2e2e', deep: '#161616', highlight: '#404040' },
];
const DUMMY_WIDTHS = [14, 18, 22, 16, 24, 20, 12, 26, 19, 15];
const DUMMY_HEIGHTS = [70, 76, 82, 78, 72, 86, 74, 80, 68, 84];

/**
 * 결정적(랜덤 아님) 더미 책 시퀀스 — 같은 seed 면 항상 같은 결과.
 * 단(shelf) 인덱스를 seed로 써서 단마다 다른 패턴이 나오게 한다.
 */
export function generateDummyBooks(count: number, seed: number): DummyBook[] {
  const books: DummyBook[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed * 7 + i * 13) % DUMMY_TONES.length;
    const widx = (seed * 3 + i * 5) % DUMMY_WIDTHS.length;
    const hidx = (seed * 11 + i * 7) % DUMMY_HEIGHTS.length;
    books.push({
      w: DUMMY_WIDTHS[widx],
      h: DUMMY_HEIGHTS[hidx],
      ...DUMMY_TONES[idx],
    });
  }
  return books;
}

/**
 * 서재 씬용 분배 — 키가 큰 책장에 한 단에 1~3권씩 듬성듬성 놓는다.
 * - 1~3권: 단마다 1권씩 (3단)
 * - 4~6권: 단마다 2권씩
 * - 7권 이상: 단마다 3권씩
 *
 * 책장이 사이드에 좁게 들어가므로 한 단의 책 권수를 적게 유지해
 * 책등을 충분히 두껍게 보여줄 수 있다.
 */
export function distributeForStudy<T>(items: T[]): T[][] {
  const n = items.length;
  if (n === 0) return [];
  const per = n <= 3 ? 1 : n <= 6 ? 2 : 3;
  const shelves: T[][] = [];
  for (let i = 0; i < n; i += per) shelves.push(items.slice(i, i + per));
  return shelves;
}
