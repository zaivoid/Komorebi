import React from 'react';
import { AmbientThemeId } from '../types/meditation';

import forestImg from '../assets/images/ambient_forest_mist_1790255470566.jpg';
import oceanImg from '../assets/images/ambient_ocean_dawn_1790255482146.jpg';
import zenImg from '../assets/images/ambient_zen_garden_1790255495414.jpg';
import hearthImg from '../assets/images/ambient_campfire_night_1790255509548.jpg';

interface Props {
  theme: AmbientThemeId;
  dimLevel?: 'soft' | 'deep' | 'minimal';
}

export const THEMES_CONFIG: Record<
  AmbientThemeId,
  { name: string; subtitle: string; img?: string; gradient: string }
> = {
  forest: {
    name: 'Misty Cedar Forest',
    subtitle: 'Dawn rays through emerald pines',
    img: forestImg,
    gradient: 'from-emerald-950/90 via-stone-950/95 to-stone-950',
  },
  ocean: {
    name: 'Twilight Tide',
    subtitle: 'Gentle swell over dark basalt stones',
    img: oceanImg,
    gradient: 'from-slate-950/90 via-sky-950/90 to-stone-950',
  },
  zen: {
    name: 'Raked Zen Garden',
    subtitle: 'Quiet ripple patterns around stone',
    img: zenImg,
    gradient: 'from-stone-900/90 via-stone-950/95 to-neutral-950',
  },
  hearth: {
    name: 'Twilight Hearth',
    subtitle: 'Warm embers beneath the night sky',
    img: hearthImg,
    gradient: 'from-amber-950/80 via-stone-950/95 to-stone-950',
  },
  minimal: {
    name: 'Deep Monolith',
    subtitle: 'Zero distraction pure black stone',
    gradient: 'from-stone-950 via-stone-900 to-stone-950',
  },
};

export const AmbientBackdrop: React.FC<Props> = ({ theme, dimLevel = 'soft' }) => {
  const current = THEMES_CONFIG[theme];

  const getOpacity = () => {
    if (theme === 'minimal') return 'opacity-0';
    switch (dimLevel) {
      case 'soft':
        return 'opacity-35';
      case 'deep':
        return 'opacity-20';
      case 'minimal':
        return 'opacity-10';
      default:
        return 'opacity-30';
    }
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-stone-950">
      {/* Background Image Layer */}
      {current.img && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out transform scale-105 motion-safe:animate-pulse ${getOpacity()}`}
          style={{
            backgroundImage: `url(${current.img})`,
            filter: 'blur(1px)',
            animationDuration: '14s',
          }}
        />
      )}

      {/* Atmospheric measured contrast gradient overlay to guarantee WCAG text legibility */}
      <div className={`absolute inset-0 bg-gradient-to-b ${current.gradient} transition-colors duration-1000`} />

      {/* Subtle organic vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(12,10,9,0.85)_100%)] pointer-events-none" />

      {/* Subtle subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};
