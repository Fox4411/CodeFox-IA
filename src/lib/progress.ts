export type RankId = 'novato' | 'builder' | 'shipper' | 'founder' | 'legend';

export interface Rank {
  id: RankId;
  name: string;
  minXp: number;
  color: string;
}

export const RANKS: Rank[] = [
  { id: 'novato', name: 'Novato', minXp: 0, color: 'text-zinc-400' },
  { id: 'builder', name: 'Builder', minXp: 100, color: 'text-blue-400' },
  { id: 'shipper', name: 'Shipper', minXp: 300, color: 'text-violet-400' },
  { id: 'founder', name: 'Founder', minXp: 700, color: 'text-amber-400' },
  { id: 'legend', name: 'Legend', minXp: 1500, color: 'text-emerald-400' },
];

export const XP = {
  createProject: 20,
  defineGoal: 15,
  createFile: 10,
  applyCode: 12,
  completeCheckItem: 18,
  runPreview: 8,
  exportProject: 25,
  dailyOpen: 10,
  finishOnboarding: 30,
  chatMessage: 2,
} as const;

export interface UserProgress {
  xp: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  onboardingDone: boolean;
  achievements: string[];
  totalProjects: number;
  totalFilesCreated: number;
  totalChecksDone: number;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getRank(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r;
  }
  return current;
}

export function getNextRank(xp: number): Rank | null {
  const rank = getRank(xp);
  const idx = RANKS.findIndex(r => r.id === rank.id);
  return RANKS[idx + 1] || null;
}

export function progressToNext(xp: number) {
  const rank = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return { pct: 100, current: xp, needed: rank.minXp, next: null as Rank | null };
  const span = next.minXp - rank.minXp;
  const into = xp - rank.minXp;
  return {
    pct: Math.min(100, Math.round((into / span) * 100)),
    current: xp,
    needed: next.minXp,
    next,
  };
}

export function defaultProgress(): UserProgress {
  return {
    xp: 0,
    streak: 0,
    lastActiveDate: '',
    onboardingDone: false,
    achievements: [],
    totalProjects: 0,
    totalFilesCreated: 0,
    totalChecksDone: 0,
  };
}

export function applyDailyStreak(p: UserProgress): UserProgress {
  const today = todayKey();
  if (p.lastActiveDate === today) return p;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  const streak = p.lastActiveDate === yKey ? p.streak + 1 : 1;
  return {
    ...p,
    streak,
    lastActiveDate: today,
    xp: p.xp + XP.dailyOpen,
  };
}

export function addXp(p: UserProgress, amount: number): UserProgress {
  return { ...p, xp: p.xp + amount };
}

export const ACHIEVEMENTS: Record<string, { title: string; desc: string }> = {
  first_goal: { title: 'Dirección clara', desc: 'Definiste el objetivo de un proyecto' },
  first_file: { title: 'Primer archivo', desc: 'Creaste tu primer archivo' },
  first_check: { title: 'Avance real', desc: 'Completaste un item del checklist' },
  first_export: { title: 'Listo para salir', desc: 'Exportaste un proyecto' },
  streak_3: { title: 'Constancia x3', desc: '3 días seguidos construyendo' },
  level_builder: { title: 'Builder', desc: 'Alcanzaste el rango Builder' },
  onboarding: { title: 'Listo para construir', desc: 'Completaste el onboarding' },
};
