/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wind,
  Clock,
  Waves,
  Compass,
  Flame,
  Palette,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  ChevronDown,
} from 'lucide-react';
import { AmbientThemeId, MeditationSession, UserStats } from './types/meditation';
import { AmbientBackdrop, THEMES_CONFIG } from './components/AmbientBackdrop';
import { BreathingExercise } from './components/BreathingExercise';
import { MeditationTimer } from './components/MeditationTimer';
import { SoundscapeMixer } from './components/SoundscapeMixer';
import { StreakTracker } from './components/StreakTracker';
import { GroundingExercise } from './components/GroundingExercise';
import { DailyWisdom } from './components/DailyWisdom';
import { loadUserStats, getTodayDateString } from './utils/storage';
import { audioEngine } from './utils/audioEngine';

type NavTab = 'breathe' | 'meditate' | 'sounds' | 'ground' | 'streak';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('breathe');
  const [theme, setTheme] = useState<AmbientThemeId>('forest');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [isMuted, setIsMuted] = useState(false);
  const [showCelebrationToast, setShowCelebrationToast] = useState<string | null>(null);

  // Sync stats when user interacts or completes sessions
  const handleSessionComplete = (session: MeditationSession) => {
    const updated = loadUserStats();
    setStats(updated);

    setShowCelebrationToast(`Completed: ${session.title}`);
    setTimeout(() => {
      setShowCelebrationToast(null);
    }, 4500);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const today = getTodayDateString();
  const meditatedToday = stats.lastActiveDate === today;

  return (
    <div className="min-h-screen text-stone-100 flex flex-col justify-between selection:bg-amber-400/30 selection:text-amber-200">
      {/* Dynamic Ambient Nature Backdrop */}
      <AmbientBackdrop theme={theme} dimLevel="soft" />

      {/* Header complying with Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 bg-stone-950/75 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-serif font-medium tracking-wide text-stone-100">
              Komorebi
            </span>
            <span className="hidden md:inline-block text-xs text-stone-400">
              · Sunlight Filtering Through Still Trees
            </span>
          </div>

          {/* Zone 2: 4-6 clean text navigation links (Desktop) */}
          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-stone-300">
            <button
              onClick={() => setActiveTab('breathe')}
              className={`hover:text-stone-100 transition-colors whitespace-nowrap ${
                activeTab === 'breathe' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              Breathwork
            </button>
            <button
              onClick={() => setActiveTab('meditate')}
              className={`hover:text-stone-100 transition-colors whitespace-nowrap ${
                activeTab === 'meditate' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              Meditation
            </button>
            <button
              onClick={() => setActiveTab('sounds')}
              className={`hover:text-stone-100 transition-colors whitespace-nowrap ${
                activeTab === 'sounds' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              Soundscapes
            </button>
            <button
              onClick={() => setActiveTab('ground')}
              className={`hover:text-stone-100 transition-colors whitespace-nowrap ${
                activeTab === 'ground' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              Grounding
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={`hover:text-stone-100 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'streak' ? 'text-amber-300 font-semibold' : ''
              }`}
            >
              <span>Daily Streak</span>
              <span className="font-mono tabular-nums text-amber-400">({stats.currentStreak}d)</span>
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2">
            {/* Ambient Nature Atmosphere Selector */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-300 bg-stone-900/80 hover:bg-stone-800 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors whitespace-nowrap"
                title="Change Ambient Scene"
              >
                <Palette className="w-3.5 h-3.5 text-amber-300/80" />
                <span className="hidden sm:inline">{THEMES_CONFIG[theme].name}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 p-1.5 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-400 font-mono">
                    Ambient Sanctuary
                  </div>
                  {(Object.keys(THEMES_CONFIG) as AmbientThemeId[]).map((tKey) => (
                    <button
                      key={tKey}
                      onClick={() => {
                        setTheme(tKey);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                        theme === tKey
                          ? 'bg-amber-400/15 text-amber-200 font-medium'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div>
                        <div>{THEMES_CONFIG[tKey].name}</div>
                        <div className="text-[10px] text-stone-400 line-clamp-1">
                          {THEMES_CONFIG[tKey].subtitle}
                        </div>
                      </div>
                      {theme === tKey && <Check className="w-3.5 h-3.5 text-amber-300" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Global Audio Mute */}
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                  : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:text-stone-100 hover:border-stone-700'
              }`}
              title={isMuted ? 'Audio Muted — Tap to Unmute' : 'Audio Active'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-12">
        {/* Daily Streak Kicker */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800/60">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="flex items-center gap-1.5 text-stone-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <strong className="font-semibold text-stone-200">
                {stats.currentStreak}-Day Streak
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>{meditatedToday ? 'Practiced today' : 'Awaiting today’s breath'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{stats.totalMinutes} total minutes</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 font-serif italic">
              "Breathe in calm, exhale release."
            </span>
          </div>
        </div>

        {/* Tab Viewport */}
        {activeTab === 'breathe' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <BreathingExercise onSessionComplete={handleSessionComplete} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-800/80">
              <DailyWisdom />
              <div className="p-5 rounded-2xl bg-stone-900/40 border border-stone-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">
                    <Waves className="w-3.5 h-3.5 text-stone-400" />
                    <span>Nature Soundscapes</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Elevate your breath with procedural rain, ocean surf, or Tibetan singing bowl overtones in the Soundscapes mixer.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setActiveTab('sounds')}
                    className="text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    Open Soundscape Soundboard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meditate' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <MeditationTimer onSessionComplete={handleSessionComplete} />
            <DailyWisdom />
          </div>
        )}

        {activeTab === 'sounds' && (
          <div className="animate-in fade-in duration-300">
            <SoundscapeMixer />
          </div>
        )}

        {activeTab === 'ground' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <GroundingExercise onSessionComplete={handleSessionComplete} />
            <DailyWisdom />
          </div>
        )}

        {activeTab === 'streak' && (
          <div className="animate-in fade-in duration-300">
            <StreakTracker stats={stats} />
          </div>
        )}
      </main>

      {/* Floating Celebration Toast */}
      {showCelebrationToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-amber-400/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs text-amber-200 animate-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{showCelebrationToast}</span>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1 from mobile touch guidelines) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/90 backdrop-blur-lg border-t border-stone-800/80 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('breathe')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'breathe' ? 'text-amber-300 font-semibold' : 'text-stone-400'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span className="text-[10px] mt-1">Breathe</span>
        </button>

        <button
          onClick={() => setActiveTab('meditate')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'meditate' ? 'text-amber-300 font-semibold' : 'text-stone-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px] mt-1">Timer</span>
        </button>

        <button
          onClick={() => setActiveTab('sounds')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'sounds' ? 'text-amber-300 font-semibold' : 'text-stone-400'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span className="text-[10px] mt-1">Sounds</span>
        </button>

        <button
          onClick={() => setActiveTab('ground')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'ground' ? 'text-amber-300 font-semibold' : 'text-stone-400'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[10px] mt-1">Ground</span>
        </button>

        <button
          onClick={() => setActiveTab('streak')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'streak' ? 'text-amber-300 font-semibold' : 'text-stone-400'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px] mt-1">Streak</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="hidden sm:block border-t border-stone-800/80 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Komorebi Meditation & Soundscapes</span>
            <span aria-hidden="true">·</span>
            <span>Crafted for daily inner peace</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Web Audio Synthesized</span>
            <span aria-hidden="true">·</span>
            <span>Privacy-first Offline Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
