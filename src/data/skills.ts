/**
 * 기술 스택 — 4개 카테고리로 분류해 백엔드 + AI 정체성을 시각적으로 강조한다.
 * GitHub 프로필 + 실 프로젝트에서 사용된 기술만 노출 (가짜 데이터 없음).
 */

export type SkillCategory = 'languages' | 'frameworks' | 'ml-data' | 'tools';

export interface Skill {
  name: string;
  icon: string; // emoji 또는 short label
  category: SkillCategory;
}

export interface SkillGroup {
  category: SkillCategory;
  label: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    category: 'languages',
    label: 'Languages',
    skills: [
      { name: 'Python', icon: '🐍', category: 'languages' },
      { name: 'TypeScript', icon: '📘', category: 'languages' },
      { name: 'JavaScript', icon: '⚡', category: 'languages' },
      { name: 'Java', icon: '☕', category: 'languages' },
      { name: 'HTML5', icon: '🌐', category: 'languages' },
      { name: 'CSS3', icon: '🎨', category: 'languages' },
    ],
  },
  {
    category: 'frameworks',
    label: 'Frameworks & Web',
    skills: [
      { name: 'NestJS', icon: '🪺', category: 'frameworks' },
      { name: 'Node.js', icon: '🟢', category: 'frameworks' },
      { name: 'React', icon: '⚛️', category: 'frameworks' },
      { name: 'Vite', icon: '⚡', category: 'frameworks' },
      { name: 'Tailwind CSS', icon: '🎯', category: 'frameworks' },
    ],
  },
  {
    category: 'ml-data',
    label: 'ML & Data',
    skills: [
      { name: 'PyTorch', icon: '🔥', category: 'ml-data' },
      { name: 'scikit-learn', icon: '🧪', category: 'ml-data' },
      { name: 'pandas', icon: '🐼', category: 'ml-data' },
      { name: 'NumPy', icon: '🔢', category: 'ml-data' },
      { name: 'Jupyter', icon: '📓', category: 'ml-data' },
      { name: 'Computer Vision', icon: '👁️', category: 'ml-data' },
    ],
  },
  {
    category: 'tools',
    label: 'Tools',
    skills: [
      { name: 'Git', icon: '🌿', category: 'tools' },
      { name: 'VSCode', icon: '🧩', category: 'tools' },
      { name: 'GitHub', icon: '🐙', category: 'tools' },
    ],
  },
];

/** 평면화된 전체 스킬 — 단순 카드 그리드용 */
export const allSkills: Skill[] = skillGroups.flatMap((g) => g.skills);
