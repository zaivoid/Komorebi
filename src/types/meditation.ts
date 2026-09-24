export type Mood = 'peaceful' | 'calm' | 'grateful' | 'centered' | 'relieved' | 'clear' | 'restless' | 'sleepy';

export interface MeditationSession {
  id: string;
  timestamp: number;
  durationSeconds: number;
  type: 'breathwork' | 'meditation' | 'grounding';
  title: string;
  moodBefore?: Mood;
  moodAfter?: Mood;
  notes?: string;
}

export interface BreathingPattern {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  inhale: number; // in seconds
  hold1: number;
  exhale: number;
  hold2: number;
  defaultCycles: number;
  category: 'calm' | 'sleep' | 'focus' | 'energy' | 'custom';
}

export interface SoundTrack {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultVolume: number; // 0 to 1
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  totalSessions: number;
  lastActiveDate: string; // YYYY-MM-DD
  history: MeditationSession[];
  unlockedAchievementIds: string[];
}

export type AmbientThemeId = 'forest' | 'ocean' | 'zen' | 'hearth' | 'minimal';

export interface AmbientTheme {
  id: AmbientThemeId;
  name: string;
  accent: string;
  imageSrc?: string;
  description: string;
}
