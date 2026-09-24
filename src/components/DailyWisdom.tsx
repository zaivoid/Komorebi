import React, { useState } from 'react';
import { Quote, RefreshCw, Sparkles, Check } from 'lucide-react';

const WISDOM_COLLECTION = [
  {
    quote: 'Smile, breathe and go slowly. There is no need to hurry. The only destination is this present moment.',
    author: 'Thich Nhat Hanh',
    tradition: 'Zen Mindfulness',
  },
  {
    quote: 'To study the self is to forget the self. To forget the self is to be actualized by myriad things.',
    author: 'Eihei Dogen',
    tradition: 'Soto Zen',
  },
  {
    quote: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.',
    author: 'Thich Nhat Hanh',
    tradition: 'Mindful Breathing',
  },
  {
    quote: 'Silence is not the absence of sound, but the stillness of the mind receiving whatever is.',
    author: 'Adyashanti',
    tradition: 'Direct Inquiry',
  },
  {
    quote: 'The mind is like water. When it is agitated, it is difficult to see. But if you allow it to settle, the answer becomes clear.',
    author: 'Lao Tzu',
    tradition: 'Tao Te Ching',
  },
  {
    quote: 'You do not have to control your thoughts. You just have to stop letting them control you.',
    author: 'Dan Millman',
    tradition: 'Inner Peace',
  },
  {
    quote: 'In the beginner’s mind there are many possibilities, but in the expert’s there are few.',
    author: 'Shunryu Suzuki',
    tradition: 'Zen Mind, Beginner’s Mind',
  },
];

export const DailyWisdom: React.FC = () => {
  const [index, setIndex] = useState(() => {
    // Deterministic quote based on day of year, but refreshable
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return day % WISDOM_COLLECTION.length;
  });

  const [copied, setCopied] = useState(false);

  const current = WISDOM_COLLECTION[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % WISDOM_COLLECTION.length);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${current.quote}" — ${current.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-2xl bg-stone-900/40 border border-stone-800/80 relative group">
      <div className="flex items-center justify-between mb-3 text-xs text-stone-400">
        <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Daily Zen Contemplation</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-[11px] text-stone-400 hover:text-stone-200 transition-colors"
            title="Copy reflection"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : 'Copy'}
          </button>
          <button
            onClick={handleNext}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors"
            title="Next reflection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm font-serif italic text-stone-200 leading-relaxed mb-3">
        "{current.quote}"
      </p>

      <div className="flex items-center gap-2 text-xs text-stone-400">
        <span className="font-medium text-stone-300">{current.author}</span>
        <span aria-hidden="true">·</span>
        <span className="text-[11px]">{current.tradition}</span>
      </div>
    </div>
  );
};
