import React, { useState, useEffect, useRef } from 'react';
import { KeyboardSong, RhythmNote, KeyboardScoreSummary } from '../../types';
import { rhythmAudio } from '../../utils/rhythmAudio';
import { sound } from '../../utils/sound';
import { VirtualKeyboardGuide } from './VirtualKeyboardGuide';
import {
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  ArrowLeft,
  Trophy,
  Keyboard as KeyboardIcon,
} from 'lucide-react';

interface Props {
  song: KeyboardSong;
  onFinish: (summary: KeyboardScoreSummary) => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface ActiveJudgement {
  id: number;
  type: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
  lane: number;
}

interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  color: string;
}

const LANE_CONFIGS = [
  {
    lane: 0,
    color: '#06b6d4', // Cyan
    bgGradient: 'from-cyan-500/20 to-transparent',
    borderColor: 'border-cyan-400',
    ringColor: 'ring-cyan-400',
    glowColor: 'shadow-cyan-400/50',
    lightBeam: 'bg-cyan-500/15',
    fingerLabel: 'Dedo Medio Izq',
  },
  {
    lane: 1,
    color: '#3b82f6', // Blue
    bgGradient: 'from-blue-500/20 to-transparent',
    borderColor: 'border-blue-400',
    ringColor: 'ring-blue-400',
    glowColor: 'shadow-blue-400/50',
    lightBeam: 'bg-blue-500/15',
    fingerLabel: 'Índice Izq',
  },
  {
    lane: 2,
    color: '#a855f7', // Purple
    bgGradient: 'from-purple-500/20 to-transparent',
    borderColor: 'border-purple-400',
    ringColor: 'ring-purple-400',
    glowColor: 'shadow-purple-400/50',
    lightBeam: 'bg-purple-500/15',
    fingerLabel: 'Índice Der',
  },
  {
    lane: 3,
    color: '#ec4899', // Pink
    bgGradient: 'from-pink-500/20 to-transparent',
    borderColor: 'border-pink-400',
    ringColor: 'ring-pink-400',
    glowColor: 'shadow-pink-400/50',
    lightBeam: 'bg-pink-500/15',
    fingerLabel: 'Dedo Medio Der',
  },
];

export const RhythmHighwayGame: React.FC<Props> = ({
  song,
  onFinish,
  onExit,
  soundEnabled,
  onToggleSound,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(true);

  // Stats
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);

  // Active judgements & feedback
  const [activeJudgement, setActiveJudgement] = useState<ActiveJudgement | null>(null);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [activeLanePresses, setActiveLanePresses] = useState<boolean[]>([false, false, false, false]);
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);

  // Timing & notes state
  const notesRef = useRef<RhythmNote[]>(JSON.parse(JSON.stringify(song.notes)));
  const animFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Highway geometry constants: Ampliada y accesible (±1 segundo de tolerancia de acierto)
  const NOTE_FALL_DURATION = 2.4; // 2.4s para visualización clara y anticipada
  const HIT_WINDOW_PERFECT = 0.35; // ±350ms (Perfecto)
  const HIT_WINDOW_GREAT = 0.70;   // ±700ms (Excelente)
  const HIT_WINDOW_GOOD = 1.05;    // ±1050ms (~1 segundo antes o después es COMPLETAMENTE VÁLIDO)
  const HIT_WINDOW_MISS = 1.15;    // Solo si pasa 1.15s sin presionar se marca como fallo

  // Start countdown on mount
  useEffect(() => {
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playClick(440 + (3 - count) * 100);
      } else if (count === 0) {
        setCountdown(null);
        startGame();
        clearInterval(interval);
      }
    }, 850);

    return () => {
      clearInterval(interval);
      rhythmAudio.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    sound.playHit(1.5);
    // playSong handles both custom uploaded MP3/WAV files and procedural synthesizer tracks
    rhythmAudio.playSong(song, handleSongEnd);
  };

  const handleSongEnd = () => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Calculate final results
    const totalHits = perfectCount + greatCount + goodCount;
    const totalAttempted = totalHits + missCount;
    const accuracy = totalAttempted > 0 ? Math.round((totalHits / totalAttempted) * 100) : 100;

    let stars: 0 | 1 | 2 | 3 = 1;
    if (accuracy >= 92 && totalAttempted > 15) stars = 3;
    else if (accuracy >= 75) stars = 2;

    sound.playLevelComplete();

    onFinish({
      songId: song.id,
      songTitle: song.title,
      score,
      maxCombo,
      accuracy,
      stars,
      perfectCount,
      greatCount,
      goodCount,
      missCount,
      totalNotes: song.notes.length,
      mode: 'rhythm',
    });
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const keyUpper = e.key.toUpperCase();
      const laneIndex = song.laneKeys.findIndex((k) => k === keyUpper);

      if (laneIndex !== -1) {
        e.preventDefault();
        triggerHit(laneIndex, keyUpper);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyUpper = e.key.toUpperCase();
      const laneIndex = song.laneKeys.findIndex((k) => k === keyUpper);
      if (laneIndex !== -1) {
        setActiveLanePresses((prev) => {
          const next = [...prev];
          next[laneIndex] = false;
          return next;
        });
        setLastPressedKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, combo, score, multiplier]);

  // Main hit evaluation logic
  const triggerHit = (lane: number, keyName: string) => {
    if (!isPlaying || isPaused) return;

    // Visual press feedback
    setActiveLanePresses((prev) => {
      const next = [...prev];
      next[lane] = true;
      return next;
    });
    setLastPressedKey(keyName);

    const nowTime = currentTimeRef.current;
    const notes = notesRef.current;

    // Find closest unhit note in this lane (within ±1.05s window)
    let closestNote: RhythmNote | null = null;
    let minDelta = Infinity;

    for (let note of notes) {
      if (note.lane === lane && !note.hit) {
        const delta = Math.abs(note.time - nowTime);
        if (delta < minDelta && delta <= HIT_WINDOW_GOOD) {
          minDelta = delta;
          closestNote = note;
        }
      }
    }

    if (closestNote && minDelta <= HIT_WINDOW_GOOD) {
      closestNote.hit = true;

      let judgement: 'PERFECT' | 'GREAT' | 'GOOD' = 'GOOD';
      let points = 100;

      if (minDelta <= HIT_WINDOW_PERFECT) {
        judgement = 'PERFECT';
        points = 300;
        setPerfectCount((c) => c + 1);
      } else if (minDelta <= HIT_WINDOW_GREAT) {
        judgement = 'GREAT';
        points = 200;
        setGreatCount((c) => c + 1);
      } else {
        setGoodCount((c) => c + 1);
      }

      closestNote.judgement = judgement;
      rhythmAudio.playHitSound(judgement);

      // Score & combo
      const newCombo = combo + 1;
      const newMultiplier = newCombo >= 50 ? 4 : newCombo >= 25 ? 3 : newCombo >= 10 ? 2 : 1;

      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));
      setMultiplier(newMultiplier);
      setScore((s) => s + points * newMultiplier);

      // Visual flash
      setActiveJudgement({ id: Date.now(), type: judgement, lane });

      // Spawn celebratory particles
      spawnParticles(lane);
    } else {
      // Pressed with no note nearby or mistimed
      rhythmAudio.playHitSound('MISS');
      setActiveJudgement({ id: Date.now(), type: 'MISS', lane });
      setCombo(0);
      setMultiplier(1);
      setMissCount((m) => m + 1);
    }
  };

  const spawnParticles = (lane: number) => {
    const color = LANE_CONFIGS[lane].color;
    const newBatch = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 40,
      color,
    }));
    setParticles((prev) => [...prev.slice(-18), ...newBatch]);
  };

  // Main 60 FPS animation loop for falling notes and miss detection
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const loop = () => {
      const now = rhythmAudio.getCurrentTime();
      currentTimeRef.current = now;
      setElapsedTime(now);

      // Check for missed notes that passed beyond the hit zone (more than 1.15s past hit line)
      const notes = notesRef.current;
      for (let note of notes) {
        if (!note.hit && now - note.time > HIT_WINDOW_MISS) {
          note.hit = true;
          note.judgement = 'MISS';
          setMissCount((m) => m + 1);
          setCombo(0);
          setMultiplier(1);
          rhythmAudio.playHitSound('MISS');
          setActiveJudgement({ id: Date.now(), type: 'MISS', lane: note.lane });
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isPaused]);

  // Clean judgements and particles over time
  useEffect(() => {
    if (!activeJudgement) return;
    const t = setTimeout(() => setActiveJudgement(null), 550);
    return () => clearTimeout(t);
  }, [activeJudgement]);

  const togglePause = () => {
    sound.playClick();
    if (isPaused) {
      setIsPaused(false);
      rhythmAudio.resume();
    } else {
      setIsPaused(true);
      rhythmAudio.pause();
    }
  };

  const remainingSeconds = Math.max(0, Math.ceil(song.duration - elapsedTime));
  const progressPercent = Math.min(100, (elapsedTime / song.duration) * 100);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] max-h-[920px] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none text-white font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-radial from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Top HUD Bar */}
      <div className="relative z-20 w-full max-w-4xl px-6 py-3 flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        {/* Left: Song info & Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              rhythmAudio.stop();
              onExit();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Volver al menú de canciones"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{song.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {song.bpm} BPM
              </span>
              <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Ventana ±1s Flexible
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{song.artist}</p>
          </div>
        </div>

        {/* Center: Live Score & Multiplier */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Puntos</span>
            <span className="text-2xl font-black tabular-nums tracking-tight font-mono text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Multiplier Badge */}
          <div
            className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-all ${
              multiplier >= 4
                ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                : multiplier >= 3
                ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                : multiplier >= 2
                ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="font-extrabold text-sm tabular-nums">x{multiplier}</span>
          </div>
        </div>

        {/* Right: Controls & Time Remaining */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tiempo</span>
            <span className="text-sm font-mono font-bold text-slate-200 tabular-nums">
              -{Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={togglePause}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isPaused ? 'Reanudar' : 'Pausar'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Song Progress Track Line */}
      <div className="w-full h-1 bg-slate-900 relative">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-100 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Rhythm Highway Canvas / 3D Track */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* 3D Perspective Container */}
        <div
          className="relative w-[340px] sm:w-[420px] md:w-[480px] h-full flex flex-col justify-between"
          style={{
            perspective: '700px',
            perspectiveOrigin: '50% 15%',
          }}
        >
          {/* Slanted Highway Surface */}
          <div
            className="relative w-full h-full flex border-x-2 border-indigo-500/40 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 shadow-[0_0_50px_rgba(79,70,229,0.2)]"
            style={{
              transform: 'rotateX(30deg)',
              transformOrigin: '50% 100%',
            }}
          >
            {/* 4 Vertical Highway Lanes */}
            {LANE_CONFIGS.map((cfg, index) => {
              const isPressed = activeLanePresses[index];
              return (
                <div
                  key={cfg.lane}
                  className={`relative flex-1 h-full border-r border-slate-800/80 flex flex-col justify-end items-center transition-colors duration-75 ${
                    isPressed ? cfg.lightBeam : ''
                  }`}
                >
                  {/* Subtle lane ambient glow line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 opacity-20 pointer-events-none"
                    style={{ backgroundColor: cfg.color }}
                  />

                  {/* Lane light beam on hit */}
                  {isPressed && (
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none animate-pulse"
                      style={{ boxShadow: `inset 0 0 20px ${cfg.color}` }}
                    />
                  )}
                </div>
              );
            })}

            {/* Falling Notes Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {notesRef.current.map((note) => {
                if (note.hit) return null;

                const timeUntilHit = note.time - elapsedTime;
                // Render notes within fall duration and up to 1.1s after hit line (allowing late hits)
                if (timeUntilHit < -1.1 || timeUntilHit > NOTE_FALL_DURATION) return null;

                // Progress: 0 at top horizon, 1 at hit line (88%)
                const progress = 1 - timeUntilHit / NOTE_FALL_DURATION;
                const topPercent = Math.min(96, progress * 88);
                const laneCfg = LANE_CONFIGS[note.lane];

                // Scale notes as they get closer (3D depth feeling)
                const scale = 0.65 + Math.min(1.05, progress) * 0.45;
                const isLate = timeUntilHit < 0;
                const opacity = isLate ? Math.max(0.4, 1 - Math.abs(timeUntilHit) / 1.15) : 1;

                return (
                  <div
                    key={note.id}
                    className="absolute transition-transform duration-16 flex items-center justify-center"
                    style={{
                      left: `${note.lane * 25}%`,
                      width: '25%',
                      top: `${topPercent}%`,
                      transform: `translateY(-50%) scale(${scale})`,
                      opacity,
                    }}
                  >
                    {/* Glowing Circular Note Bar (like reference image) */}
                    <div
                      className={`w-14 sm:w-16 h-7 sm:h-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs shadow-lg transition-transform ${
                        isLate ? 'ring-2 ring-emerald-400/50' : ''
                      }`}
                      style={{
                        backgroundColor: '#0f172a',
                        borderColor: laneCfg.color,
                        boxShadow: `0 0 16px ${laneCfg.color}, inset 0 0 8px ${laneCfg.color}`,
                        color: '#ffffff',
                      }}
                    >
                      <span className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] font-mono">
                        {note.key}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hit Target Line & Receptor Rings at Bottom (88%) */}
            <div className="absolute bottom-[10%] left-0 right-0 h-16 flex items-center justify-between border-t border-b border-indigo-400/40 bg-slate-900/60 backdrop-blur-xs">
              {LANE_CONFIGS.map((cfg, index) => {
                const isPressed = activeLanePresses[index];
                const key = song.laneKeys[index];

                return (
                  <button
                    key={cfg.lane}
                    type="button"
                    onClick={() => triggerHit(index, key)}
                    className="relative flex-1 h-full flex flex-col items-center justify-center cursor-pointer group focus:outline-none"
                  >
                    {/* Glowing Hit Target Disc */}
                    <div
                      className={`relative w-14 sm:w-16 h-12 sm:h-14 rounded-full border-2 flex items-center justify-center font-black transition-all duration-75 ${
                        isPressed
                          ? 'scale-90 bg-white text-slate-950 ring-4'
                          : 'bg-slate-900/90 text-white'
                      }`}
                      style={{
                        borderColor: cfg.color,
                        boxShadow: isPressed ? `0 0 30px ${cfg.color}` : `0 0 10px ${cfg.color}33`,
                      }}
                    >
                      <span className="text-base sm:text-lg font-mono drop-shadow">{key}</span>

                      {/* Ripple Ring on press */}
                      {isPressed && (
                        <div
                          className="absolute inset-0 rounded-full border-2 animate-ping"
                          style={{ borderColor: cfg.color }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating Judgement & Combo Pops (PERFECT, GREAT, MISS) */}
          {activeJudgement && (
            <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-30 animate-in zoom-in-75 duration-100">
              <span
                className={`text-2xl sm:text-3xl font-black tracking-widest drop-shadow-[0_0_20px_currentColor] uppercase ${
                  activeJudgement.type === 'PERFECT'
                    ? 'text-amber-300'
                    : activeJudgement.type === 'GREAT'
                    ? 'text-emerald-400'
                    : activeJudgement.type === 'GOOD'
                    ? 'text-cyan-400'
                    : 'text-rose-500'
                }`}
              >
                {activeJudgement.type}
              </span>

              {combo > 1 && (
                <div className="flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md">
                  <span className="text-base font-extrabold text-white font-mono">{combo}</span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">COMBO</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
              Prepárate para pulsar las teclas
            </span>
            <span className="text-7xl font-black text-white animate-bounce font-mono drop-shadow-[0_0_30px_rgba(99,102,241,0.8)]">
              {countdown}
            </span>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-300 mt-2">
              <span>Coloca tus dedos en:</span>
              <div className="flex items-center gap-2">
                {song.laneKeys.map((k) => (
                  <span
                    key={k}
                    className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center font-mono font-bold"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-6">
            <h3 className="text-2xl font-black text-white tracking-tight">JUEGO EN PAUSA</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={togglePause}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Continuar</span>
              </button>
              <button
                onClick={() => {
                  rhythmAudio.stop();
                  onExit();
                }}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 cursor-pointer"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Virtual Keyboard Guide Drawer */}
      <div className="relative z-20 w-full px-4 pb-3 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-2xl px-2 mb-1">
          <button
            onClick={() => setShowKeyboardGuide((prev) => !prev)}
            className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyboardIcon className="w-3.5 h-3.5" />
            <span>{showKeyboardGuide ? 'Ocultar guía de dedos' : 'Mostrar guía de dedos'}</span>
          </button>

          <div className="text-[11px] text-slate-400">
            Aciertos:{' '}
            <span className="text-emerald-400 font-semibold">{perfectCount + greatCount + goodCount}</span> | Fallos:{' '}
            <span className="text-rose-400 font-semibold">{missCount}</span>
          </div>
        </div>

        {showKeyboardGuide && (
          <VirtualKeyboardGuide
            activeKeys={song.laneKeys}
            pressedKey={lastPressedKey}
            compact={true}
          />
        )}
      </div>
    </div>
  );
};
