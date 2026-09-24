import React from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  CalendarCheck,
  Award,
  CheckCircle2,
  Calendar,
  Heart,
  Compass,
  Hourglass,
  Moon,
  Sun,
  Smile,
} from 'lucide-react';
import { UserStats, Achievement } from '../types/meditation';
import { ACHIEVEMENTS, getTodayDateString } from '../utils/storage';

interface Props {
  stats: UserStats;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Flame,
  CalendarCheck,
  Compass,
  Hourglass,
  Moon,
  Sun,
  Award,
};

export const StreakTracker: React.FC<Props> = ({ stats }) => {
  const today = getTodayDateString();
  const meditatedToday = stats.lastActiveDate === today;

  // Generate last 14 days calendar track
  const last14Days = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayNum = d.getDate();

    // Check if any session exists on this date
    const hasMeditation = stats.history.some((s) => {
      const sDate = new Date(s.timestamp);
      const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(
        sDate.getDate()
      ).padStart(2, '0')}`;
      return sDateStr === dateStr;
    });

    return {
      dateStr,
      dayName,
      dayNum,
      isToday: dateStr === today,
      hasMeditation,
    };
  });

  const unlockedIds = new Set(stats.unlockedAchievementIds || []);

  return (
    <div className="space-y-8">
      {/* Top Banner Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Streak Card */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              meditatedToday
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'bg-stone-800/80 text-stone-400'
            }`}
          >
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-light font-mono text-stone-100 tabular-nums">
                {stats.currentStreak}
              </span>
              <span className="text-xs text-stone-400">days streak</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {meditatedToday ? 'Maintained today · Keep the flame lit' : 'Practice today to extend streak'}
            </div>
          </div>
        </div>

        {/* Total Time */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-800/80 text-stone-300 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-light font-mono text-stone-100 tabular-nums">
                {stats.totalMinutes}
              </span>
              <span className="text-xs text-stone-400">mindful mins</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Across {stats.totalSessions} completed sits
            </div>
          </div>
        </div>

        {/* Longest Record */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-stone-800/80 text-amber-300/80 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-light font-mono text-stone-100 tabular-nums">
                {stats.longestStreak}
              </span>
              <span className="text-xs text-stone-400">days best record</span>
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {unlockedIds.size} of {ACHIEVEMENTS.length} milestones unlocked
            </div>
          </div>
        </div>
      </div>

      {/* 14-Day Visual Rhythm Calendar */}
      <div className="p-5 rounded-2xl bg-stone-900/40 border border-stone-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-400" />
            <h3 className="text-sm font-medium text-stone-200">14-Day Mindfulness Rhythm</h3>
          </div>
          <span className="text-xs text-stone-400">
            {stats.history.filter((s) => {
              const diff = (Date.now() - s.timestamp) / (1000 * 60 * 60 * 24);
              return diff <= 14;
            }).length}{' '}
            sessions past fortnight
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {last14Days.map((d) => (
            <div
              key={d.dateStr}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-between min-h-[68px] transition-all ${
                d.hasMeditation
                  ? 'bg-amber-400/15 border-amber-400/40 text-amber-200'
                  : d.isToday
                  ? 'bg-stone-800/80 border-stone-700 text-stone-300 ring-1 ring-amber-400/30'
                  : 'bg-stone-900/40 border-stone-800/60 text-stone-400'
              }`}
            >
              <span className="text-[10px] uppercase font-mono">{d.dayName}</span>
              <div
                className={`w-2.5 h-2.5 rounded-full my-1 ${
                  d.hasMeditation
                    ? 'bg-amber-300 shadow-sm shadow-amber-400/50'
                    : d.isToday
                    ? 'border border-amber-400/60'
                    : 'bg-stone-800'
                }`}
              />
              <span className="text-[11px] font-mono tabular-nums">{d.dayNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Achievements */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-stone-400" />
          <h3 className="text-sm font-medium text-stone-200">Mindfulness Milestones</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedIds.has(ach.id);
            const Icon = ICON_MAP[ach.icon] || Sparkles;

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isUnlocked
                    ? 'bg-stone-800/80 border-amber-400/30 text-stone-200'
                    : 'bg-stone-900/30 border-stone-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-200">{ach.title}</span>
                    {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[11px] text-stone-400 leading-snug mt-0.5">
                    {ach.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session History Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-stone-400" />
            <h3 className="text-sm font-medium text-stone-200">Mindfulness Journal & Sit History</h3>
          </div>
          <span className="text-xs text-stone-400">{stats.history.length} records</span>
        </div>

        {stats.history.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-900/30 border border-stone-800/60 text-center text-stone-400 text-xs">
            No sits logged yet. Complete a breathing exercise or meditation session to begin your journal.
          </div>
        ) : (
          <div className="space-y-2">
            {stats.history.slice(0, 10).map((s) => {
              const date = new Date(s.timestamp);
              const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-xl bg-stone-900/50 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-200">{s.title}</span>
                      {s.moodAfter && (
                        <span className="text-[11px] text-amber-300/90 font-mono">
                          · felt {s.moodAfter}
                        </span>
                      )}
                    </div>
                    {s.notes && (
                      <p className="text-xs text-stone-400 italic mt-1 leading-snug">
                        "{s.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400 font-mono shrink-0">
                    <span className="tabular-nums">
                      {Math.max(1, Math.round(s.durationSeconds / 60))} min
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-stone-400">{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
