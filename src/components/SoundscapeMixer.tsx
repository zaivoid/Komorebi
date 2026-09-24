import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Waves,
  Trees,
  Flame,
  Bell,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Moon,
  Music,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface TrackDef {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
}

const TRACKS: TrackDef[] = [
  { id: 'rain', name: 'Gentle Rain', desc: 'Soft drops falling on bamboo & leaves', icon: CloudRain },
  { id: 'ocean', name: 'Ocean Tide', desc: 'Rhythmic deep swell receding over stones', icon: Waves },
  { id: 'forest', name: 'Forest Breeze', desc: 'Wind through pines with distant birdsong', icon: Trees },
  { id: 'campfire', name: 'Twilight Hearth', desc: 'Warm glowing embers & timber crackles', icon: Flame },
  { id: 'singing_bowl', name: 'Singing Bowl', desc: 'Tibetan harmonic overtone drone', icon: Bell },
  { id: 'om_drone', name: '432Hz Om Tone', desc: 'Resonant solfeggio grounding vibration', icon: Sparkles },
  { id: 'night', name: 'Night Meadow', desc: 'Quiet twilight breeze & soft crickets', icon: Moon },
];

interface PresetDef {
  name: string;
  tracks: Record<string, number>;
}

const PRESETS: PresetDef[] = [
  {
    name: 'Rainy Monastery',
    tracks: { rain: 0.7, singing_bowl: 0.35, om_drone: 0 },
  },
  {
    name: 'Ocean Dusk',
    tracks: { ocean: 0.75, om_drone: 0.25, rain: 0 },
  },
  {
    name: 'Pine Haven',
    tracks: { forest: 0.7, campfire: 0.3, ocean: 0 },
  },
  {
    name: 'Midnight Hearth',
    tracks: { campfire: 0.75, night: 0.4, rain: 0 },
  },
  {
    name: 'Deep Resonance',
    tracks: { singing_bowl: 0.65, om_drone: 0.45, ocean: 0 },
  },
];

interface Props {
  onClose?: () => void;
}

export const SoundscapeMixer: React.FC<Props> = ({ onClose }) => {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [masterVolume, setMasterVol] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playingBell, setPlayingBell] = useState<boolean>(false);

  useEffect(() => {
    // Read initial volumes
    const initial: Record<string, number> = {};
    TRACKS.forEach((t) => {
      initial[t.id] = audioEngine.getTrackVolume(t.id);
    });
    setVolumes(initial);
    setIsMuted(audioEngine.getIsMuted());
  }, []);

  const handleTrackChange = (trackId: string, val: number) => {
    audioEngine.setTrackVolume(trackId, val);
    setVolumes((prev) => ({ ...prev, [trackId]: val }));
  };

  const handleToggleTrack = (trackId: string) => {
    const current = volumes[trackId] || 0;
    const next = current > 0 ? 0 : 0.5;
    handleTrackChange(trackId, next);
  };

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    audioEngine.setMasterVolume(val);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleApplyPreset = (presetTracks: Record<string, number>) => {
    // Zero out other active tracks
    TRACKS.forEach((t) => {
      const vol = presetTracks[t.id] || 0;
      audioEngine.setTrackVolume(t.id, vol);
    });
    const nextVols: Record<string, number> = {};
    TRACKS.forEach((t) => {
      nextVols[t.id] = presetTracks[t.id] || 0;
    });
    setVolumes(nextVols);
  };

  const handleReset = () => {
    audioEngine.stopAllTracks();
    const zero: Record<string, number> = {};
    TRACKS.forEach((t) => {
      zero[t.id] = 0;
    });
    setVolumes(zero);
  };

  const handleRingBell = () => {
    setPlayingBell(true);
    audioEngine.playSingingBowl(0.85);
    setTimeout(() => setPlayingBell(false), 2000);
  };

  const activeCount = Object.values(volumes).filter((v) => v > 0).length;

  return (
    <div className="space-y-6">
      {/* Soundscape Header & Global Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-medium text-stone-100">Ambient Soundscapes</h2>
            <span className="text-xs text-stone-400">· Synthesized Nature Soundboard</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Layer procedural natural elements to craft your personal acoustic sanctuary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRingBell}
            disabled={playingBell}
            title="Strike Tibetan Singing Bowl"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-300 bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/50 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
          >
            <Bell className={`w-3.5 h-3.5 text-amber-300 ${playingBell ? 'animate-bounce' : ''}`} />
            <span>Strike Bowl</span>
          </button>

          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-950/60 border-rose-800/50 text-rose-300'
                : 'bg-stone-800/80 border-stone-700/50 text-stone-300 hover:text-stone-100'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 bg-stone-800/40 rounded-lg transition-colors"
              title="Silence all tracks"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Silence</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Soundscapes */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Music className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-xs uppercase tracking-wider text-stone-400 font-medium">Curated Soundscapes</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset.tracks)}
              className="px-3 py-1.5 text-xs font-medium bg-stone-800/60 hover:bg-stone-700/60 text-stone-300 hover:text-stone-100 border border-stone-700/40 rounded-lg transition-colors active:scale-95"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Master Volume Bar */}
      <div className="p-3.5 bg-stone-900/70 border border-stone-800 rounded-xl flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-300 whitespace-nowrap min-w-[100px]">
          <Volume2 className="w-3.5 h-3.5 text-stone-400" />
          <span>Master Volume</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={masterVolume}
          onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
          className="w-full accent-amber-400/90 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
        />
        <span className="text-xs font-mono text-stone-400 tabular-nums w-8 text-right">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TRACKS.map((t) => {
          const Icon = t.icon;
          const vol = volumes[t.id] || 0;
          const isPlaying = vol > 0;

          return (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isPlaying
                  ? 'bg-stone-800/70 border-stone-700/80 shadow-sm'
                  : 'bg-stone-900/40 border-stone-800/60 hover:border-stone-700/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <button
                  onClick={() => handleToggleTrack(t.id)}
                  className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isPlaying
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-stone-800/80 text-stone-400 group-hover:text-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-stone-200 group-hover:text-white transition-colors">
                      {t.name}
                    </div>
                    <div className="text-xs text-stone-500 line-clamp-1">{t.desc}</div>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleTrack(t.id)}
                  className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'text-stone-500 hover:text-stone-300 bg-stone-800/50'
                  }`}
                >
                  {isPlaying ? 'Active' : 'Play'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={vol}
                  onChange={(e) => handleTrackChange(t.id, parseFloat(e.target.value))}
                  className="w-full accent-amber-300 h-1 bg-stone-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-stone-400 tabular-nums w-7 text-right">
                  {Math.round(vol * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {onClose && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
