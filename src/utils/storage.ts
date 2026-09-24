import { UserStats, MeditationSession, Achievement, BreathingPattern } from '../types/meditation';

const STORAGE_KEY = 'komorebi_mindfulness_data_v1';
const CUSTOM_BREATH_KEY = 'komorebi_custom_breathing_v1';

export const DEFAULT_BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    subtitle: 'Navy SEAL Stress Reset',
    description: 'Equal 4-count breathing to reset cortisol, steady heart rate, and clear mental fog.',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    defaultCycles: 6,
    category: 'focus',
  },
  {
    id: '478',
    name: '4-7-8 Relaxing Breath',
    subtitle: 'Dr. Andrew Weil Sleep Method',
    description: 'Extended exhalation technique activating the parasympathetic vagus nerve for restful calm.',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    defaultCycles: 4,
    category: 'sleep',
  },
  {
    id: 'coherence',
    name: 'Heart Coherence',
    subtitle: 'HRV Synchronization',
    description: 'Resonant 5.5-second rhythm matching cardiac frequency to achieve profound emotional balance.',
    inhale: 5.5,
    hold1: 0,
    exhale: 5.5,
    hold2: 0,
    defaultCycles: 10,
    category: 'calm',
  },
  {
    id: 'awaken',
    name: 'Awaken & Energize',
    subtitle: 'Morning Clarity Boost',
    description: 'Rapid energizing cadence that oxygenates the blood and sharpens alertness without caffeine.',
    inhale: 2,
    hold1: 1,
    exhale: 4,
    hold2: 1,
    defaultCycles: 12,
    category: 'energy',
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_breath',
    title: 'First Presence',
    description: 'Completed your very first mindfulness session.',
    icon: 'Sparkles',
    condition: (stats) => stats.totalSessions >= 1,
  },
  {
    id: 'streak_3',
    title: 'Flow of Three',
    description: 'Maintained a 3-day continuous daily streak.',
    icon: 'Flame',
    condition: (stats) => stats.currentStreak >= 3 || stats.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'One Week of Serenity',
    description: 'Completed mindfulness practices for 7 consecutive days.',
    icon: 'CalendarCheck',
    condition: (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7,
  },
  {
    id: 'streak_21',
    title: 'Mindful Habit',
    description: 'Practiced for 21 days—true neural rewiring.',
    icon: 'Compass',
    condition: (stats) => stats.currentStreak >= 21 || stats.longestStreak >= 21,
  },
  {
    id: 'century_club',
    title: '100 Mindful Minutes',
    description: 'Accumulated over 100 minutes of quiet awareness.',
    icon: 'Hourglass',
    condition: (stats) => stats.totalMinutes >= 100,
  },
  {
    id: 'deep_stillness',
    title: 'Deep Stillness',
    description: 'Completed a single session lasting 20 minutes or longer.',
    icon: 'Moon',
    condition: (stats) => stats.history.some((s) => s.durationSeconds >= 1200),
  },
  {
    id: 'dawn_seeker',
    title: 'Morning Dew',
    description: 'Meditated in the quiet dawn hours before 9:00 AM.',
    icon: 'Sun',
    condition: (stats) =>
      stats.history.some((s) => {
        const hour = new Date(s.timestamp).getHours();
        return hour >= 5 && hour < 9;
      }),
  },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_STATS: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalMinutes: 0,
  totalSessions: 0,
  lastActiveDate: '',
  history: [],
  unlockedAchievementIds: [],
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const data = JSON.parse(raw) as UserStats;

    // Verify streak validity based on today/yesterday
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (data.lastActiveDate && data.lastActiveDate !== today && data.lastActiveDate !== yesterday) {
      // Streak lapsed
      data.currentStreak = 0;
    }

    return data;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save user stats', err);
  }
}

export function recordSession(session: MeditationSession): {
  newStats: UserStats;
  newAchievements: Achievement[];
} {
  const stats = loadUserStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let currentStreak = stats.currentStreak;

  if (stats.lastActiveDate === today) {
    // Already meditated today, streak maintained
  } else if (stats.lastActiveDate === yesterday) {
    // Meditated yesterday, advance streak
    currentStreak += 1;
  } else {
    // First day or streak lapsed
    currentStreak = 1;
  }

  const longestStreak = Math.max(stats.longestStreak, currentStreak);
  const addedMinutes = Math.max(1, Math.round(session.durationSeconds / 60));
  const totalMinutes = stats.totalMinutes + addedMinutes;
  const totalSessions = stats.totalSessions + 1;

  const history = [session, ...stats.history].slice(0, 100); // keep last 100

  const draftStats: UserStats = {
    ...stats,
    currentStreak,
    longestStreak,
    totalMinutes,
    totalSessions,
    lastActiveDate: today,
    history,
  };

  // Check achievements
  const newlyUnlocked: Achievement[] = [];
  const currentUnlocked = new Set(stats.unlockedAchievementIds || []);

  for (const ach of ACHIEVEMENTS) {
    if (!currentUnlocked.has(ach.id) && ach.condition(draftStats)) {
      newlyUnlocked.push(ach);
      currentUnlocked.add(ach.id);
    }
  }

  const finalStats: UserStats = {
    ...draftStats,
    unlockedAchievementIds: Array.from(currentUnlocked),
  };

  saveUserStats(finalStats);

  return {
    newStats: finalStats,
    newAchievements: newlyUnlocked,
  };
}

export function loadCustomBreathingPattern(): BreathingPattern | null {
  try {
    const raw = localStorage.getItem(CUSTOM_BREATH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomBreathingPattern(pattern: BreathingPattern): void {
  try {
    localStorage.setItem(CUSTOM_BREATH_KEY, JSON.stringify(pattern));
  } catch {
    // ignore
  }
}
