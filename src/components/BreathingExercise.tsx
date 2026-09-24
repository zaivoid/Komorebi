import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  ChevronRight,
  Heart,
  Wind,
} from 'lucide-react';
import { BreathingPattern, Mood, MeditationSession } from '../types/meditation';
import {
  DEFAULT_BREATHING_PATTERNS,
  loadCustomBreathingPattern,
  saveCustomBreathingPattern,
  recordSession,
} from '../utils/storage';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  onSessionComplete: (session: MeditationSession) => void;
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export const BreathingExercise: React.FC<Props> = ({ onSessionComplete }) => {
  const [patterns, setPatterns] = useState<BreathingPattern[]>(DEFAULT_BREATHING_PATTERNS);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(DEFAULT_BREATHING_PATTERNS[0]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Custom editor draft state
  const [customDraft, setCustomDraft] = useState<BreathingPattern>(() => {
    return (
      loadCustomBreathingPattern() || {
        id: 'custom',
        name: 'Custom Breath Flow',
        subtitle: 'Personalized Cadence',
        description: 'Your custom configured breath timing and cycle count.',
        inhale: 4,
        hold1: 4,
        exhale: 6,
        hold2: 2,
        defaultCycles: 8,
        category: 'custom',
      }
    );
  });

  // Session execution state
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [targetCycles, setTargetCycles] = useState(selectedPattern.defaultCycles);
  const [audioCueEnabled, setAudioCueEnabled] = useState(true);

  // Post-session reflection modal
  const [isCompletedModal, setIsCompletedModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood>('calm');
  const [sessionNotes, setSessionNotes] = useState('');

  // Animation progress (0 to 1) for smooth scale
  const [scaleFactor, setScaleFactor] = useState(1);

  const phaseTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Update target cycles when pattern changes
  const handleSelectPattern = (p: BreathingPattern) => {
    if (isActive) {
      if (!confirm('Switching patterns will end the current breathing session. Continue?')) {
        return;
      }
    }
    setSelectedPattern(p);
    setTargetCycles(p.defaultCycles);
    resetSession(p);
  };

  const resetSession = (p = selectedPattern) => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(p.inhale);
    setScaleFactor(1);
    setCurrentCycle(1);
    setTotalSecondsElapsed(0);
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  };

  const getPhaseDuration = useCallback((p: BreathPhase, pattern: BreathingPattern): number => {
    switch (p) {
      case 'inhale':
        return pattern.inhale;
      case 'hold1':
        return pattern.hold1;
      case 'exhale':
        return pattern.exhale;
      case 'hold2':
        return pattern.hold2;
    }
  }, []);

  const getNextPhase = useCallback(
    (current: BreathPhase, pattern: BreathingPattern): { next: BreathPhase; advanceCycle: boolean } => {
      if (current === 'inhale') {
        if (pattern.hold1 > 0) return { next: 'hold1', advanceCycle: false };
        return { next: 'exhale', advanceCycle: false };
      }
      if (current === 'hold1') {
        return { next: 'exhale', advanceCycle: false };
      }
      if (current === 'exhale') {
        if (pattern.hold2 > 0) return { next: 'hold2', advanceCycle: false };
        return { next: 'inhale', advanceCycle: true };
      }
      if (current === 'hold2') {
        return { next: 'inhale', advanceCycle: true };
      }
      return { next: 'inhale', advanceCycle: false };
    },
    []
  );

  const finishSession = useCallback(() => {
    setIsActive(false);
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    audioEngine.playSingingBowl(0.85);
    setIsCompletedModal(true);
  }, []);

  // Main Breathing Loop
  useEffect(() => {
    if (!isActive) return;

    startTimeRef.current = Date.now();
    const intervalTime = 50; // 50ms tick for fluid visual interpolation

    let currentPhase = phase;
    let secondsLeft = phaseSecondsLeft;
    let cycle = currentCycle;

    phaseTimerRef.current = window.setInterval(() => {
      secondsLeft -= intervalTime / 1000;
      setTotalSecondsElapsed((prev) => prev + intervalTime / 1000);

      const totalPhaseDuration = getPhaseDuration(currentPhase, selectedPattern);
      const elapsedInPhase = Math.max(0, totalPhaseDuration - secondsLeft);
      const ratio = totalPhaseDuration > 0 ? Math.min(1, elapsedInPhase / totalPhaseDuration) : 1;

      // Calculate orb scale
      if (currentPhase === 'inhale') {
        setScaleFactor(1 + ratio * 0.45); // expands from 1 to 1.45
      } else if (currentPhase === 'hold1') {
        setScaleFactor(1.45);
      } else if (currentPhase === 'exhale') {
        setScaleFactor(1.45 - ratio * 0.45); // contracts from 1.45 to 1
      } else if (currentPhase === 'hold2') {
        setScaleFactor(1.0);
      }

      if (secondsLeft <= 0) {
        const { next, advanceCycle } = getNextPhase(currentPhase, selectedPattern);

        if (advanceCycle) {
          const nextCycle = cycle + 1;
          if (nextCycle > targetCycles) {
            finishSession();
            return;
          }
          cycle = nextCycle;
          setCurrentCycle(nextCycle);
        }

        currentPhase = next;
        secondsLeft = getPhaseDuration(next, selectedPattern);
        setPhase(next);

        // Sound cue at breath transitions
        if (audioCueEnabled) {
          if (next === 'inhale') audioEngine.playBreathCue(false);
          else if (next === 'exhale') audioEngine.playBreathCue(true);
        }
      }

      setPhaseSecondsLeft(Math.max(0, secondsLeft));
    }, intervalTime);

    return () => {
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
      }
    };
  }, [isActive, selectedPattern, targetCycles, audioCueEnabled, getPhaseDuration, getNextPhase, finishSession, currentCycle, phase, phaseSecondsLeft]);

  const handleTogglePlay = () => {
    if (!isActive) {
      // Starting
      if (audioCueEnabled) {
        audioEngine.playBreathCue(false);
      }
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const handleSaveCustomPattern = () => {
    saveCustomBreathingPattern(customDraft);
    const updated = [...DEFAULT_BREATHING_PATTERNS.filter((p) => p.id !== 'custom'), customDraft];
    setPatterns(updated);
    setSelectedPattern(customDraft);
    setTargetCycles(customDraft.defaultCycles);
    resetSession(customDraft);
    setIsCustomModalOpen(false);
  };

  const handleConfirmCompletion = () => {
    const session: MeditationSession = {
      id: 'session_' + Date.now(),
      timestamp: Date.now(),
      durationSeconds: Math.max(10, Math.round(totalSecondsElapsed)),
      type: 'breathwork',
      title: `${selectedPattern.name} (${currentCycle - 1}/${targetCycles} cycles)`,
      moodAfter: selectedMood,
      notes: sessionNotes.trim() || undefined,
    };

    recordSession(session);
    onSessionComplete(session);
    setIsCompletedModal(false);
    resetSession();
  };

  // Phase description text
  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In Slowly';
      case 'hold1':
        return 'Hold & Retain';
      case 'exhale':
        return 'Release & Let Go';
      case 'hold2':
        return 'Rest in Emptiness';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return 'text-sky-300';
      case 'hold1':
        return 'text-amber-200';
      case 'exhale':
        return 'text-emerald-300';
      case 'hold2':
        return 'text-purple-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Pattern Selector Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-400 font-medium">
            <Wind className="w-3.5 h-3.5" />
            <span>Select Breathing Discipline</span>
          </div>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configure Custom</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {patterns.map((p) => {
            const isSelected = selectedPattern.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPattern(p)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-stone-800/90 border-amber-400/40 text-stone-100 shadow-sm'
                    : 'bg-stone-900/50 border-stone-800 hover:border-stone-700/60 text-stone-400 hover:text-stone-300'
                }`}
              >
                <div className="text-sm font-medium text-stone-200">{p.name}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">{p.subtitle}</div>
                <div className="text-[11px] font-mono tabular-nums text-stone-500 mt-2">
                  {p.inhale}s · {p.hold1}s · {p.exhale}s · {p.hold2}s
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Visual Breathing Orb Canvas */}
      <div className="relative py-12 px-4 rounded-3xl bg-stone-900/40 border border-stone-800/80 flex flex-col items-center justify-center overflow-hidden min-h-[380px]">
        {/* Subtle glowing ambient rings */}
        <div
          className="absolute w-72 h-72 rounded-full border border-stone-700/20 pointer-events-none transition-transform duration-700"
          style={{ transform: `scale(${scaleFactor * 1.15})`, opacity: isActive ? 0.4 : 0.15 }}
        />
        <div
          className="absolute w-96 h-96 rounded-full border border-stone-800/30 pointer-events-none transition-transform duration-700"
          style={{ transform: `scale(${scaleFactor * 1.35})`, opacity: isActive ? 0.25 : 0.08 }}
        />

        {/* Breathing Center Lotus/Orb */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div
            className="w-48 h-48 rounded-full flex items-center justify-center transition-transform duration-100 ease-out shadow-2xl shadow-stone-950/80"
            style={{
              transform: `scale(${scaleFactor})`,
              background:
                phase === 'inhale'
                  ? 'radial-gradient(circle at 35% 35%, rgba(56, 189, 248, 0.45), rgba(12, 74, 110, 0.85) 70%, rgba(3, 105, 161, 0.2) 100%)'
                  : phase === 'hold1'
                  ? 'radial-gradient(circle at 35% 35%, rgba(251, 191, 36, 0.4), rgba(120, 53, 15, 0.85) 70%, rgba(180, 83, 9, 0.2) 100%)'
                  : phase === 'exhale'
                  ? 'radial-gradient(circle at 35% 35%, rgba(52, 211, 153, 0.45), rgba(6, 78, 59, 0.85) 70%, rgba(4, 120, 87, 0.2) 100%)'
                  : 'radial-gradient(circle at 35% 35%, rgba(192, 132, 252, 0.35), rgba(88, 28, 135, 0.85) 70%, rgba(107, 33, 168, 0.2) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: isActive
                ? '0 0 50px rgba(56, 189, 248, 0.25), inset 0 0 30px rgba(255, 255, 255, 0.12)'
                : 'none',
            }}
          >
            {/* Center Phase and Countdown */}
            <div className="text-center select-none">
              <div className={`text-base font-serif font-medium tracking-wide ${getPhaseColor()} transition-colors`}>
                {isActive ? getPhaseInstruction() : 'Ready'}
              </div>
              <div className="text-3xl font-light font-mono text-stone-100 tabular-nums mt-1">
                {isActive ? `${phaseSecondsLeft.toFixed(1)}s` : `${selectedPattern.inhale}s`}
              </div>
              <div className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider">
                {isActive ? `Cycle ${currentCycle} / ${targetCycles}` : 'Tap Play to Begin'}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Session Stats & Audio Cue Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setAudioCueEnabled(!audioCueEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              audioCueEnabled
                ? 'bg-stone-800/80 border-stone-700 text-amber-300'
                : 'bg-stone-900/60 border-stone-800 text-stone-500'
            }`}
            title={audioCueEnabled ? 'Soft Harmonic Breath Cues: On' : 'Soft Breath Cues: Off'}
          >
            {audioCueEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Cycles Selector when idle */}
        {!isActive && (
          <div className="mt-8 flex items-center gap-2 text-xs text-stone-400">
            <span>Target Cycles:</span>
            <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-lg border border-stone-700/50">
              {[4, 6, 8, 12, 16].map((c) => (
                <button
                  key={c}
                  onClick={() => setTargetCycles(c)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    targetCycles === c ? 'bg-amber-400/20 text-amber-300 font-medium' : 'hover:text-stone-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Playback Controls */}
        <div className="mt-6 flex items-center gap-4 z-10">
          <button
            onClick={() => resetSession()}
            title="Reset Session"
            className="p-3 text-stone-400 hover:text-stone-200 bg-stone-800/60 hover:bg-stone-800 rounded-full transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`px-8 py-3.5 rounded-full font-medium text-sm flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
              isActive
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700'
                : 'bg-amber-300 hover:bg-amber-200 text-stone-950 font-semibold shadow-amber-400/10'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Breathwork</span>
              </>
            )}
          </button>

          {isActive && (
            <button
              onClick={finishSession}
              title="Finish & Save Early"
              className="px-3.5 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700 rounded-lg transition-colors border border-stone-700/50"
            >
              Finish Early
            </button>
          )}
        </div>
      </div>

      {/* Pattern Detailed Guide */}
      <div className="p-4 rounded-2xl bg-stone-900/30 border border-stone-800/60 flex items-start gap-3.5">
        <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-stone-400">
          <span className="text-stone-200 font-medium mr-1.5">{selectedPattern.name}:</span>
          {selectedPattern.description} Allow your shoulders to drop, relax the jaw, and inhale smoothly through the
          nose.
        </div>
      </div>

      {/* Custom Breathwork Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-serif font-medium text-stone-100 mb-1">Personalize Breath Cadence</h3>
            <p className="text-xs text-stone-400 mb-5">
              Customize duration in seconds for each phase of your respiratory cycle.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-300 flex justify-between">
                  <span>Inhale:</span>
                  <span className="font-mono text-amber-300 tabular-nums">{customDraft.inhale}s</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={customDraft.inhale}
                  onChange={(e) => setCustomDraft({ ...customDraft, inhale: parseFloat(e.target.value) })}
                  className="w-full accent-amber-300 h-1.5 bg-stone-800 rounded-lg cursor-pointer mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 flex justify-between">
                  <span>Hold (Full Lungs):</span>
                  <span className="font-mono text-amber-300 tabular-nums">{customDraft.hold1}s</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={customDraft.hold1}
                  onChange={(e) => setCustomDraft({ ...customDraft, hold1: parseFloat(e.target.value) })}
                  className="w-full accent-amber-300 h-1.5 bg-stone-800 rounded-lg cursor-pointer mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 flex justify-between">
                  <span>Exhale:</span>
                  <span className="font-mono text-amber-300 tabular-nums">{customDraft.exhale}s</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={customDraft.exhale}
                  onChange={(e) => setCustomDraft({ ...customDraft, exhale: parseFloat(e.target.value) })}
                  className="w-full accent-amber-300 h-1.5 bg-stone-800 rounded-lg cursor-pointer mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 flex justify-between">
                  <span>Hold (Empty Lungs):</span>
                  <span className="font-mono text-amber-300 tabular-nums">{customDraft.hold2}s</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={customDraft.hold2}
                  onChange={(e) => setCustomDraft({ ...customDraft, hold2: parseFloat(e.target.value) })}
                  className="w-full accent-amber-300 h-1.5 bg-stone-800 rounded-lg cursor-pointer mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-300 flex justify-between">
                  <span>Default Cycles:</span>
                  <span className="font-mono text-amber-300 tabular-nums">{customDraft.defaultCycles}</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={customDraft.defaultCycles}
                  onChange={(e) => setCustomDraft({ ...customDraft, defaultCycles: parseInt(e.target.value) })}
                  className="w-full accent-amber-300 h-1.5 bg-stone-800 rounded-lg cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomPattern}
                className="px-4 py-2 text-xs font-medium bg-amber-300 text-stone-950 hover:bg-amber-200 rounded-lg transition-colors"
              >
                Save & Use Pattern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Session Mood & Reflection Modal */}
      {isCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-serif font-medium text-stone-100">Practice Completed</h3>
            <p className="text-xs text-stone-400 mt-1 mb-6">
              {Math.max(1, Math.round(totalSecondsElapsed / 60))} minute(s) of mindful breathwork recorded. How does your
              mind feel in this present moment?
            </p>

            {/* Mood options */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(
                [
                  { id: 'peaceful', label: 'Peaceful' },
                  { id: 'calm', label: 'Calm' },
                  { id: 'grateful', label: 'Grateful' },
                  { id: 'centered', label: 'Centered' },
                  { id: 'relieved', label: 'Relieved' },
                  { id: 'clear', label: 'Clear' },
                  { id: 'sleepy', label: 'Sleepy' },
                  { id: 'restless', label: 'Restless' },
                ] as { id: Mood; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`py-2 px-1 text-xs rounded-xl border transition-all ${
                    selectedMood === m.id
                      ? 'bg-amber-300 text-stone-950 font-semibold border-amber-300'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:border-stone-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Optional note */}
            <textarea
              placeholder="Reflections or thoughts to remember (optional)..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-700 resize-none h-18 mb-4"
            />

            <button
              onClick={handleConfirmCompletion}
              className="w-full py-3 bg-amber-300 hover:bg-amber-200 text-stone-950 font-semibold text-xs rounded-xl transition-all shadow-md active:scale-98"
            >
              Save to Daily Mindfulness Journal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
