import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Bell,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { Mood, MeditationSession } from '../types/meditation';
import { recordSession } from '../utils/storage';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  onSessionComplete: (session: MeditationSession) => void;
}

const PRESET_MINUTES = [3, 5, 10, 15, 20, 30];

const ZEN_PROMPTS = [
  'Observe the breath without judgment, like watching clouds cross an open sky.',
  'You are not the wave; you are the ocean beneath it.',
  'Nowhere to go, nothing to do, simply resting in pure presence.',
  'Notice where tension gathers in the body, and breathe softness into it.',
  'Thoughts arise like ripples in water; let them settle naturally.',
  'The stillness you seek is already here within you.',
];

export const MeditationTimer: React.FC<Props> = ({ onSessionComplete }) => {
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [prepSeconds, setPrepSeconds] = useState(10);
  const [intervalBell, setIntervalBell] = useState<'none' | 'halfway' | '5min'>('halfway');
  const [showConfig, setShowConfig] = useState(false);

  // Runtime states
  const [status, setStatus] = useState<'idle' | 'prep' | 'running' | 'paused'>('idle');
  const [prepRemaining, setPrepRemaining] = useState(10);
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [zenQuoteIndex, setZenQuoteIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reflection modal
  const [isCompletedModal, setIsCompletedModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood>('peaceful');
  const [reflectionNotes, setReflectionNotes] = useState('');

  const timerRef = useRef<number | null>(null);

  // Sync remaining seconds when minutes change in idle
  useEffect(() => {
    if (status === 'idle') {
      setSecondsRemaining(durationMinutes * 60);
    }
  }, [durationMinutes, status]);

  const totalDurationSeconds = durationMinutes * 60;

  const handleStart = () => {
    if (status === 'idle') {
      if (prepSeconds > 0) {
        setStatus('prep');
        setPrepRemaining(prepSeconds);
      } else {
        startMeditation();
      }
    } else if (status === 'paused') {
      setStatus('running');
    }
  };

  const startMeditation = () => {
    setStatus('running');
    audioEngine.playSingingBowl(0.85); // Opening gong
    setZenQuoteIndex(Math.floor(Math.random() * ZEN_PROMPTS.length));
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleReset = () => {
    setStatus('idle');
    setSecondsRemaining(durationMinutes * 60);
    setPrepRemaining(prepSeconds);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleFinish = useCallback(() => {
    setStatus('idle');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    audioEngine.playSingingBowl(0.9); // Completion gong
    setIsCompletedModal(true);
  }, []);

  // Main countdown loop
  useEffect(() => {
    if (status === 'prep') {
      timerRef.current = window.setInterval(() => {
        setPrepRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            startMeditation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (status === 'running') {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          const next = prev - 1;

          // Check interval bells
          if (intervalBell === 'halfway' && next === Math.floor(totalDurationSeconds / 2)) {
            audioEngine.playSingingBowl(0.6);
          } else if (intervalBell === '5min' && next > 0 && next % 300 === 0) {
            audioEngine.playSingingBowl(0.6);
          }

          if (next <= 0) {
            handleFinish();
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, intervalBell, totalDurationSeconds, handleFinish]);

  const handleConfirmCompletion = () => {
    const elapsed = totalDurationSeconds - secondsRemaining;
    const session: MeditationSession = {
      id: 'session_' + Date.now(),
      timestamp: Date.now(),
      durationSeconds: Math.max(30, elapsed > 0 ? elapsed : totalDurationSeconds),
      type: 'meditation',
      title: `${durationMinutes}-Minute Meditation`,
      moodAfter: selectedMood,
      notes: reflectionNotes.trim() || undefined,
    };

    recordSession(session);
    onSessionComplete(session);
    setIsCompletedModal(false);
    handleReset();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressRatio =
    status === 'idle'
      ? 1
      : status === 'prep'
      ? prepRemaining / (prepSeconds || 1)
      : secondsRemaining / totalDurationSeconds;

  const circumference = 2 * Math.PI * 135;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className={`space-y-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-stone-950 p-6 flex flex-col justify-between' : ''}`}>
      {/* Top Header & Immersion Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Mindful Meditation Timer</span>
        </div>

        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-300 hover:text-stone-100 bg-stone-800/60 rounded-lg border border-stone-700/40 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Intervals & Bells</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-stone-400 hover:text-stone-200 bg-stone-800/60 rounded-lg border border-stone-700/40 transition-colors"
            title={isFullscreen ? 'Exit Immersion Mode' : 'Enter Immersion Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preset Duration Selector */}
      {status === 'idle' && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESET_MINUTES.map((m) => (
            <button
              key={m}
              onClick={() => setDurationMinutes(m)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                durationMinutes === m
                  ? 'bg-amber-300 text-stone-950 border-amber-300 font-semibold shadow-sm'
                  : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:border-stone-700'
              }`}
            >
              {m} Min
            </button>
          ))}
        </div>
      )}

      {/* Settings Panel */}
      {showConfig && status === 'idle' && (
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-stone-300 font-medium">Preparation Countdown:</span>
            <div className="flex items-center gap-1.5">
              {[0, 5, 10, 15].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrepSeconds(s)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    prepSeconds === s ? 'bg-amber-400/20 text-amber-300 font-medium' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s === 0 ? 'None' : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-stone-800">
            <span className="text-stone-300 font-medium">Mindfulness Bell Interval:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'none', label: 'Start & End only' },
                { id: 'halfway', label: 'Halfway Gong' },
                { id: '5min', label: 'Every 5 Min' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setIntervalBell(opt.id as any)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    intervalBell === opt.id
                      ? 'bg-amber-400/20 text-amber-300 font-medium'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Timer Display Ring */}
      <div className="relative py-10 flex flex-col items-center justify-center min-h-[340px]">
        <svg className="w-80 h-80 -rotate-90" viewBox="0 0 300 300">
          {/* Background circle track */}
          <circle
            cx="150"
            cy="150"
            r="135"
            className="stroke-stone-800/80 fill-none"
            strokeWidth="3.5"
          />
          {/* Animated progress circle */}
          <circle
            cx="150"
            cy="150"
            r="135"
            className="stroke-amber-300 fill-none transition-all duration-1000 ease-linear"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Clock & Status */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          {status === 'prep' ? (
            <>
              <div className="text-xs uppercase tracking-widest text-amber-300 font-medium mb-1">
                Settle Into Posture
              </div>
              <div className="text-5xl font-light font-mono text-stone-100 tabular-nums">
                {prepRemaining}s
              </div>
              <div className="text-xs text-stone-400 mt-2">Softening the breath...</div>
            </>
          ) : (
            <>
              <div className="text-5xl md:text-6xl font-extralight font-mono text-stone-100 tabular-nums tracking-tight">
                {formatTime(secondsRemaining)}
              </div>
              <div className="text-xs uppercase tracking-widest text-stone-400 mt-2">
                {status === 'running' ? 'Resting in Stillness' : status === 'paused' ? 'Paused' : `${durationMinutes} Minutes`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zen Focal Prompt */}
      {status === 'running' && (
        <div className="max-w-md mx-auto text-center px-4 animate-in fade-in duration-700">
          <p className="text-sm font-serif italic text-stone-300 leading-relaxed">
            "{ZEN_PROMPTS[zenQuoteIndex]}"
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        {status !== 'idle' && (
          <button
            onClick={handleReset}
            title="Reset"
            className="p-3.5 text-stone-400 hover:text-stone-200 bg-stone-800/60 rounded-full transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {status === 'running' ? (
          <button
            onClick={handlePause}
            className="px-8 py-3.5 rounded-full font-medium text-sm flex items-center gap-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 shadow-md active:scale-95 transition-all"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause Meditation</span>
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="px-8 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2.5 bg-amber-300 hover:bg-amber-200 text-stone-950 shadow-lg shadow-amber-400/10 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{status === 'paused' ? 'Resume Session' : 'Begin Meditation'}</span>
          </button>
        )}

        {status === 'running' && (
          <button
            onClick={handleFinish}
            title="End Session"
            className="px-4 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-800/80 rounded-lg border border-stone-700/50 transition-colors"
          >
            End Now
          </button>
        )}
      </div>

      {/* Reflection Modal */}
      {isCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-serif font-medium text-stone-100">Meditation Concluded</h3>
            <p className="text-xs text-stone-400 mt-1 mb-6">
              You dedicated {durationMinutes} mindful minutes to quiet stillness. How are you feeling right now?
            </p>

            {/* Mood selector */}
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

            {/* Journal note */}
            <textarea
              placeholder="Record any insight or gentle feeling from this sit..."
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-800 rounded-xl p-3 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-700 resize-none h-18 mb-4"
            />

            <button
              onClick={handleConfirmCompletion}
              className="w-full py-3 bg-amber-300 hover:bg-amber-200 text-stone-950 font-semibold text-xs rounded-xl transition-all shadow-md active:scale-98"
            >
              Log to Daily Streak
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
