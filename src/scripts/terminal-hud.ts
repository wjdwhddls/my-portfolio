/**
 * 터미널 내러티브 HUD — 섹션 진입마다 좌하단에 명령어가 타이핑된다.
 * 다이브의 부팅 터미널에서 시작한 "컴퓨터를 조작하는 경험"을 페이지 끝까지 잇는 장치.
 *
 * - ScrollTrigger로 섹션 진입(정/역방향) 감지 → 해당 명령 타이핑
 * - 첫 명령이 타이핑되기 전에는 HUD 자체를 숨김
 * - 데스크톱 전용(<768px 숨김), reduced-motion 시 타이핑 없이 즉시 표시
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const COMMANDS: Array<{ sel: string; cmd: string }> = [
  { sel: '#home', cmd: './portfolio --start' },
  { sel: '#about', cmd: 'cd career/' },
  { sel: '#projects', cmd: 'ls projects/' },
  { sel: '#awards', cmd: 'cat awards.log' },
  { sel: '#contact', cmd: 'ping jongin --contact' },
];

const TYPE_INTERVAL_MS = 34;

export function init(): void {
  const hud = document.getElementById('terminal-hud');
  const line = hud?.querySelector<HTMLElement>('.hud-cmd');
  if (!hud || !line) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let timer: ReturnType<typeof setInterval> | null = null;
  let current = '';

  const show = () => hud.classList.add('is-visible');

  const type = (cmd: string) => {
    if (cmd === current) return;
    current = cmd;
    show();
    if (timer) clearInterval(timer);

    if (reduceMotion) {
      line.textContent = cmd;
      return;
    }

    let n = 0;
    line.textContent = '';
    timer = setInterval(() => {
      n++;
      line.textContent = cmd.slice(0, n);
      if (n >= cmd.length && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, TYPE_INTERVAL_MS);
  };

  COMMANDS.forEach(({ sel, cmd }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => type(cmd),
      onEnterBack: () => type(cmd),
    });
  });

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__terminalHud = { type };
  }
}
