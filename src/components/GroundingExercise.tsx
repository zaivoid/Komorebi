import React, { useState } from 'react';
import { Eye, Hand, Ear, Sparkles, Heart, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { MeditationSession } from '../types/meditation';
import { recordSession } from '../utils/storage';
import { audioEngine } from '../utils/audioEngine';

interface Props {
  onSessionComplete: (session: MeditationSession) => void;
}

const STEPS = [
  {
    step: 5,
    title: '5 Things You Can See',
    instruction: 'Look around your space slowly. Notice five distinct visual details: the play of light, a wood grain pattern, a soft shadow, a color, or the horizon.',
    icon: Eye,
    prompt: 'Acknowledge each object silently, noticing its outline without labeling or judging.',
  },
  {
    step: 4,
    title: '4 Things You Can Feel',
    instruction: 'Bring awareness to physical contact. Notice the support of your seat beneath you, the fabric against your skin, the cool air on your face, or the soles of your feet.',
    icon: Hand,
    prompt: 'Feel the weight of gravity grounding your body safely in this physical room.',
  },
  {
    step: 3,
    title: '3 Things You Can Hear',
    instruction: 'Tune your ears outward and inward. Listen to three layers of sound: the ambient nature soundscape, distant ambient hum, or the soft whisper of your own breath.',
    icon: Ear,
    prompt: 'Allow sounds to wash over you like waves, without holding on to any of them.',
  },
  {
    step: 2,
    title: '2 Things You Can Smell',
    instruction: 'Inhale gently through the nose. Notice any subtle fragrance in the air—the scent of tea, fresh rain, linen, or the crisp freshness of your space.',
    icon: Sparkles,
    prompt: 'If no clear scents are present, recall the comforting scent of pine or warm earth.',
  },
  {
    step: 1,
    title: '1 Thing You Are Grateful For',
    instruction: 'Rest your awareness gently on your heart center. Bring to mind one simple truth or blessing you are thankful for right now—a breath, a friend, or this moment of quiet.',
    icon: Heart,
    prompt: 'Let a quiet sense of warmth and appreciation fill your chest.',
  },
];

export const GroundingExercise: React.FC<Props> = ({ onSessionComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const current = STEPS[currentStepIndex];
  const Icon = current.icon;

  const handleNext = () => {
    audioEngine.playBreathCue(false);
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    audioEngine.playSingingBowl(0.85);
    setIsCompleted(true);
    const durationSeconds = Math.max(60, Math.round((Date.now() - startTime) / 1000));
    const session: MeditationSession = {
      id: 'session_' + Date.now(),
      timestamp: Date.now(),
      durationSeconds,
      type: 'grounding',
      title: '5-4-3-2-1 Sensory Grounding',
      moodAfter: 'centered',
      notes: 'Returned from sensory overdrive back to the present moment.',
    };
    recordSession(session);
    onSessionComplete(session);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="p-8 rounded-3xl bg-stone-900/60 border border-stone-800 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-serif font-medium text-stone-100">You Are Fully Here</h3>
        <p className="text-xs text-stone-400 mt-2 mb-6 leading-relaxed">
          Your five senses have anchored your nervous system in the objective reality of the present moment. Carry this calm stability with you.
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition-colors"
        >
          Repeat Exercise
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span className="uppercase tracking-wider font-medium">5-4-3-2-1 Sensory Grounding</span>
        <span>
          Step {currentStepIndex + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress pill dots */}
      <div className="grid grid-cols-5 gap-1.5">
        {STEPS.map((s, idx) => (
          <div
            key={s.step}
            className={`h-1.5 rounded-full transition-all ${
              idx <= currentStepIndex ? 'bg-amber-300' : 'bg-stone-800'
            }`}
          />
        ))}
      </div>

      {/* Main Grounding Card */}
      <div className="p-8 rounded-3xl bg-stone-900/60 border border-stone-800 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-serif font-medium text-stone-100 mb-2">{current.title}</h2>
        <p className="text-sm text-stone-300 leading-relaxed mb-4">{current.instruction}</p>

        <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs text-stone-400 italic mb-6">
          "{current.prompt}"
        </div>

        <div className="flex items-center justify-between pt-2">
          {currentStepIndex > 0 ? (
            <button
              onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
              className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-amber-300 hover:bg-amber-200 text-stone-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <span>{currentStepIndex === STEPS.length - 1 ? 'Complete Grounding' : 'Next Sense'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
