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

/** 가죽 팔레트 6종 — 다양한 양장본 느낌을 한 책장에 섞기 위함 */
export const leatherPalettes: Record<LeatherStyle, LeatherPalette> = {
  classic: { base: '#3b2418', deep: '#1d1108', high: '#5a3a26', gold: '#d9b66b' },
  aged:    { base: '#5a3a22', deep: '#2c1c10', high: '#7a5638', gold: '#e5c479' },
  oxblood: { base: '#4a1620', deep: '#220a0e', high: '#6e2230', gold: '#dbb163' },
  forest:  { base: '#1f3a2b', deep: '#0d1d15', high: '#365948', gold: '#c9a766' },
  navy:    { base: '#1a2842', deep: '#0a121f', high: '#2c4068', gold: '#cba75e' },
  sand:    { base: '#7a6042', deep: '#3d2e1f', high: '#9c805d', gold: '#f0d28a' },
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
