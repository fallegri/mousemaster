import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Crosshair, CheckCircle2, ArrowDown, ArrowUp, Zap, PauseCircle } from 'lucide-react';

interface Checkpoint {
  id: number;
  label: string;
  color: string;
  isLocked: boolean;
}

interface Props {
  difficultyFactor: number;
  mode: 'campaign' | 'free_practice';
  onComplete: (metrics: ExerciseMetrics) => void;
  onLiveUpdate?: (stats: { current: number; total: number; score: number }) => void;
}

export const ScrollVaultExercise: React.FC<Props> = ({
  difficultyFactor,
  mode,
  onComplete,
  onLiveUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalCheckpointsGoal = mode === 'campaign' ? 5 : 8;
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [lockProgress, setLockProgress] = useState(0); // 0 - 100%
  const [isStationary, setIsStationary] = useState(false);
  const [directionHint, setDirectionHint] = useState<'down' | 'up' | 'aligned'>('down');
  const [distancePixels, setDistancePixels] = useState(0);

  const startTimeRef = useRef(performance.now());
  const lastWheelTimeRef = useRef(0);
  const scrollYRef = useRef(0);
  const holdTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Spacing between node centers in pixels
  const nodeHeight = 84;
  const nodeGap = 110;
  const stepDistance = nodeHeight + nodeGap; // ~194px per node

  // Alignment tolerance: tighter for higher difficulty
  const tolerance = Math.max(22, Math.round(44 / Math.sqrt(difficultyFactor)));
  // Required pause hold time: ~700ms - 900ms
  const requiredHoldTimeMs = Math.round(750 * Math.sqrt(difficultyFactor));

  // Generate checkpoints list
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => {
    const colors = [
      'from-indigo-500 to-blue-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-purple-500 to-pink-600',
      'from-sky-500 to-cyan-600',
    ];
    return Array.from({ length: totalCheckpointsGoal }, (_, i) => ({
      id: i + 1,
      label: `Nodo de Frecuencia #${i + 1}`,
      color: colors[i % colors.length],
      isLocked: false,
    }));
  });

  // Maximum scroll range
  const maxScroll = (totalCheckpointsGoal - 1) * stepDistance;

  // Initialize and reset
  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setCurrentCheckpointIndex(0);
    setScore(0);
    setScrollY(0);
    scrollYRef.current = 0;
    setLockProgress(0);
    holdTimeRef.current = 0;
    lastWheelTimeRef.current = 0;

    setCheckpoints((prev) => prev.map((c) => ({ ...c, isLocked: false })));
  }, [difficultyFactor, mode]);

  // Native Wheel Event listener to ensure ZERO whole-page scrolling and 100% reliable wheel interception
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Prevent browser from scrolling the window or document
      e.preventDefault();
      e.stopPropagation();

      lastWheelTimeRef.current = performance.now();

      // Normalize delta across browsers/trackpads
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 28; // lines mode
      if (e.deltaMode === 2) delta *= 300; // pages mode

      const speedFactor = 0.85;
      const nextY = Math.max(0, Math.min(maxScroll, scrollYRef.current + delta * speedFactor));
      scrollYRef.current = nextY;
      setScrollY(nextY);

      // Track sample for motion analytics
      tracker.addSample(e.clientX, e.clientY);
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelNative);
    };
  }, [maxScroll]);

  // Main evaluation and pause detection loop (running at 60fps)
  useEffect(() => {
    let lastLoopTime = performance.now();

    const loop = (now: number) => {
      const dt = now - lastLoopTime;
      lastLoopTime = now;

      if (currentCheckpointIndex < totalCheckpointsGoal) {
        // Target scroll position where the current node is exactly centered in the reticle
        const targetScrollY = currentCheckpointIndex * stepDistance;
        const currentPos = scrollYRef.current;
        const diff = currentPos - targetScrollY;
        const absDistance = Math.round(Math.abs(diff));
        setDistancePixels(absDistance);

        // Check if cursor wheel is stationary (no wheel event within last 130ms)
        const stationary = now - lastWheelTimeRef.current > 130;
        setIsStationary(stationary);

        if (absDistance <= tolerance) {
          // Inside the reticle!
          setDirectionHint('aligned');

          if (stationary) {
            // User is holding still inside the target! Increment hold progress
            holdTimeRef.current += dt;
            const progress = Math.min(100, Math.round((holdTimeRef.current / requiredHoldTimeMs) * 100));
            setLockProgress(progress);

            if (progress >= 100) {
              // Successfully locked!
              handleLockSuccess();
            }
          } else {
            // User is moving within the reticle, slow down or hold still
            holdTimeRef.current = Math.max(0, holdTimeRef.current - dt * 0.5);
            setLockProgress(Math.round((holdTimeRef.current / requiredHoldTimeMs) * 100));
          }
        } else {
          // Outside the reticle
          holdTimeRef.current = 0;
          setLockProgress(0);

          if (diff < 0) {
            // Current scroll is less than target: need to scroll DOWN
            setDirectionHint('down');
          } else {
            // Current scroll is greater than target: need to scroll UP
            setDirectionHint('up');
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentCheckpointIndex, totalCheckpointsGoal, tolerance, requiredHoldTimeMs, stepDistance]);

  const handleLockSuccess = () => {
    sound.playHit(1.2);
    sound.playSnap();
    tracker.registerTargetHit();

    const nextScore = score + 100;
    setScore(nextScore);
    holdTimeRef.current = 0;
    setLockProgress(0);

    setCheckpoints((prev) =>
      prev.map((c, idx) => (idx === currentCheckpointIndex ? { ...c, isLocked: true } : c))
    );

    const nextIdx = currentCheckpointIndex + 1;
    setCurrentCheckpointIndex(nextIdx);

    if (onLiveUpdate) {
      onLiveUpdate({ current: nextIdx, total: totalCheckpointsGoal, score: nextScore });
    }

    if (nextIdx >= totalCheckpointsGoal) {
      const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
      const summary = tracker.getSummary(
        totalCheckpointsGoal,
        totalCheckpointsGoal,
        durationSeconds,
        difficultyFactor
      );
      onComplete({
        moduleName: 'scroll-vault',
        moduleTitle: 'Navegación y Scroll',
        mode,
        score: nextScore,
        ...summary,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-h-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden select-none flex flex-col justify-between p-3 sm:p-4 text-white"
    >
      {/* Top Banner & Telemetry */}
      <div className="z-30 flex items-center justify-between text-xs gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
          <span className="font-semibold text-slate-300">Misión:</span>
          <span className="text-slate-100 font-medium">
            Gira la rueda del ratón y mantén quieto 1 segundo en el visor ({Math.min(currentCheckpointIndex + 1, totalCheckpointsGoal)}/{totalCheckpointsGoal})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Target distance indicator */}
          <div className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
            directionHint === 'aligned'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            {directionHint === 'aligned' ? (
              <>
                <PauseCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡EN EL VISOR! Mantén quieto</span>
              </>
            ) : directionHint === 'down' ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                <span>Gira hacia ABAJO ({distancePixels}px)</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                <span>Gira hacia ARRIBA ({distancePixels}px)</span>
              </>
            )}
          </div>

          <div className="bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 font-mono tabular-nums text-slate-200">
            Puntos: <span className="font-bold text-emerald-400">{score}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Scroll Chamber Area */}
      <div className="relative flex-1 w-full min-h-0 my-2 rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden flex items-center justify-center">
        {/* Subtle grid backdrop */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Fixed Center Alignment Viewfinder (Reticle) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-28 pointer-events-none z-20 flex items-center justify-between px-4 sm:px-8 border-y-2 border-indigo-500 bg-indigo-500/10 backdrop-blur-[2px]">
          {/* Left laser marker */}
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs tracking-wider">
            <Crosshair className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">VISOR CENTRAL DE ALINEACIÓN</span>
          </div>

          {/* Central crosshair ticks */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-indigo-400/80" />
            <div className="w-0.5 h-12 bg-indigo-400/80 absolute" />
            <div className={`w-8 h-8 rounded-full border border-indigo-400/60 transition-transform ${
              directionHint === 'aligned' ? 'scale-125 border-emerald-400' : ''
            }`} />
          </div>

          {/* Right Pause / Hold-in Progress Ring */}
          <div className="flex items-center gap-3">
            {directionHint === 'aligned' ? (
              <div className="flex items-center gap-2 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/50">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      stroke="#065f46"
                      strokeWidth="3"
                      fill="transparent"
                    />
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      stroke="#10b981"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={69.1}
                      strokeDashoffset={69.1 - (69.1 * lockProgress) / 100}
                      className="transition-all duration-75"
                    />
                  </svg>
                  <span className="absolute text-[9px] font-bold text-emerald-300">{lockProgress}%</span>
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-semibold text-emerald-400 leading-tight">
                    {isStationary ? 'Fijando nodo...' : '¡No muevas la rueda!'}
                  </span>
                  <span className="block text-[9px] text-emerald-200/70">
                    {isStationary ? 'Mantén quieto' : 'Detén el giro'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Usa la rueda</span>
              </div>
            )}
          </div>
        </div>

        {/* Vertically Scrolling Conveyor Belt containing all Checkpoints */}
        <div
          ref={trackRef}
          style={{
            transform: `translateY(${-scrollY}px)`,
            transition: 'transform 0.08s ease-out',
          }}
          className="absolute inset-x-0 top-1/2 w-full max-w-lg mx-auto flex flex-col items-center pointer-events-none"
        >
          {checkpoints.map((cp, idx) => {
            const isCurrent = idx === currentCheckpointIndex;
            return (
              <div
                key={cp.id}
                style={{
                  height: `${nodeHeight}px`,
                  marginBottom: idx === checkpoints.length - 1 ? '0px' : `${nodeGap}px`,
                }}
                className={`w-11/12 max-w-md rounded-2xl border-2 px-5 py-3 flex items-center justify-between shadow-lg transition-all duration-150 ${
                  cp.isLocked
                    ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200'
                    : isCurrent
                    ? 'border-indigo-400 bg-indigo-950/90 text-white scale-105 ring-4 ring-indigo-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-sm text-white shadow-md ${cp.color}`}
                  >
                    #{cp.id}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-wide">{cp.label}</div>
                    <div className="text-[11px] text-slate-400">
                      {cp.isLocked
                        ? '✓ Alineado y confirmado'
                        : isCurrent
                        ? '<< OBJETIVO ACTIVO - ALINEAR EN VISOR >>'
                        : 'En espera en la secuencia'}
                    </div>
                  </div>
                </div>

                {cp.isLocked ? (
                  <div className="bg-emerald-500 text-slate-950 rounded-full p-1.5 shadow-md">
                    <CheckCircle2 className="w-5 h-5 font-bold" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Visual Track Minimap on Right Border */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-44 w-3.5 bg-slate-900/90 border border-slate-800 rounded-full flex flex-col items-center justify-between py-2 z-30 pointer-events-none">
          {checkpoints.map((cp, idx) => {
            const isCurrent = idx === currentCheckpointIndex;
            return (
              <div
                key={cp.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  cp.isLocked
                    ? 'bg-emerald-400'
                    : isCurrent
                    ? 'bg-indigo-400 scale-150 ring-2 ring-indigo-300'
                    : 'bg-slate-700'
                }`}
                title={`Nodo ${cp.id}`}
              />
            );
          })}
        </div>
      </div>

      {/* Footer Instructions with clear guidance */}
      <div className="z-30 text-center text-xs text-slate-400 shrink-0 flex items-center justify-center gap-3">
        <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-slate-300">
          💡 <strong>Cómo jugar:</strong> Gira la rueda hacia arriba o abajo hasta que el nodo quede en el visor azul central, luego <strong>detén la mano por 1 segundo</strong> para fijar.
        </span>
      </div>
    </div>
  );
};
