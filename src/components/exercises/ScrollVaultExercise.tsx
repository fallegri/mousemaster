import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Crosshair, CheckCircle2, ArrowDown, ArrowUp, MousePointerClick, AlertCircle } from 'lucide-react';

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

  const totalCheckpointsGoal = mode === 'campaign' ? 5 : 8;
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [directionHint, setDirectionHint] = useState<'down' | 'up' | 'aligned'>('down');
  const [distancePixels, setDistancePixels] = useState(0);
  const [floatingFeedback, setFloatingFeedback] = useState<string | null>(null);

  const startTimeRef = useRef(performance.now());
  const scrollYRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Spacing between node centers in pixels
  const nodeHeight = 84;
  const nodeGap = 120;
  const stepDistance = nodeHeight + nodeGap; // ~204px per node

  // Alignment tolerance: tighter for higher difficulty
  const tolerance = Math.max(26, Math.round(48 / Math.sqrt(difficultyFactor)));

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
    setFloatingFeedback(null);

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

  // Alignment evaluation loop (running at 60fps)
  useEffect(() => {
    const loop = () => {
      if (currentCheckpointIndex < totalCheckpointsGoal) {
        // Target scroll position where the current node is centered in the reticle
        const targetScrollY = currentCheckpointIndex * stepDistance;
        const currentPos = scrollYRef.current;
        const diff = currentPos - targetScrollY;
        const absDistance = Math.round(Math.abs(diff));
        setDistancePixels(absDistance);

        if (absDistance <= tolerance) {
          // Inside the reticle!
          setDirectionHint('aligned');
        } else {
          // Outside the reticle
          if (diff < 0) {
            setDirectionHint('down');
          } else {
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
  }, [currentCheckpointIndex, totalCheckpointsGoal, tolerance, stepDistance]);

  // Handle click on a checkpoint box
  const handleCheckpointClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (idx !== currentCheckpointIndex) {
      // User clicked an inactive or already completed checkpoint
      sound.playMiss();
      tracker.registerMissedClick();
      showToast('Ese no es el nodo activo actual.');
      return;
    }

    // Check if current checkpoint is within alignment tolerance
    const targetScrollY = currentCheckpointIndex * stepDistance;
    const currentPos = scrollYRef.current;
    const absDistance = Math.abs(currentPos - targetScrollY);

    if (absDistance <= tolerance) {
      // SUCCESSFUL CLICK on aligned box!
      sound.playHit(1.3);
      sound.playSnap();
      tracker.registerTargetHit();

      const nextScore = score + 100;
      setScore(nextScore);

      setCheckpoints((prev) =>
        prev.map((c, i) => (i === currentCheckpointIndex ? { ...c, isLocked: true } : c))
      );

      showToast('¡Nodo capturado con éxito! +100 pts');

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
    } else {
      // Clicked while outside the reticle
      sound.playMiss();
      tracker.registerMissedClick();
      showToast('¡Alinea primero la caja dentro del visor azul central antes de hacer clic!');
    }
  };

  const showToast = (msg: string) => {
    setFloatingFeedback(msg);
    setTimeout(() => {
      setFloatingFeedback((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-h-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden select-none flex flex-col justify-between p-3 sm:p-4 text-white"
    >
      {/* Top Banner & Status */}
      <div className="z-30 flex items-center justify-between text-xs gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
          <span className="font-semibold text-slate-300">Paso 1:</span>
          <span className="text-slate-100 font-medium">
            Gira la rueda hasta centrar la caja en el visor.
          </span>
          <span className="font-semibold text-amber-400 pl-2 border-l border-slate-700">Paso 2:</span>
          <span className="text-amber-200 font-medium">
            ¡Haz clic sobre la caja! ({Math.min(currentCheckpointIndex + 1, totalCheckpointsGoal)}/{totalCheckpointsGoal})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Alignment status indicator */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              directionHint === 'aligned'
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold scale-105 shadow-md animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {directionHint === 'aligned' ? (
              <>
                <MousePointerClick className="w-4 h-4 text-slate-950" />
                <span>🎯 ¡ALINEADO! Haz clic en la caja</span>
              </>
            ) : directionHint === 'down' ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                <span>Rueda hacia ABAJO ({distancePixels}px)</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                <span>Rueda hacia ARRIBA ({distancePixels}px)</span>
              </>
            )}
          </div>

          <div className="bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 font-mono tabular-nums text-slate-200">
            Puntos: <span className="font-bold text-emerald-400">{score}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Scroll Chamber */}
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
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-28 pointer-events-none z-10 flex items-center justify-between px-4 sm:px-8 border-y-2 border-indigo-500 bg-indigo-500/10 backdrop-blur-[1px]">
          {/* Left laser marker */}
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs tracking-wider">
            <Crosshair className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">VISOR CENTRAL DE CAPTURA</span>
          </div>

          {/* Central crosshair ticks */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-indigo-400/80" />
            <div className="w-0.5 h-12 bg-indigo-400/80 absolute" />
            <div
              className={`w-10 h-10 rounded-full border border-indigo-400/60 transition-transform ${
                directionHint === 'aligned' ? 'scale-125 border-emerald-400 ring-2 ring-emerald-400/50' : ''
              }`}
            />
          </div>

          {/* Right Status */}
          <div className="text-right">
            <span className="block text-[11px] font-semibold text-indigo-300">
              {directionHint === 'aligned' ? '¡LISTO PARA CLIC!' : 'DESPLAZANDO...'}
            </span>
            <span className="block text-[10px] text-slate-400">Tolerancia: ±{tolerance}px</span>
          </div>
        </div>

        {/* Vertically Scrolling Conveyor Belt containing all Checkpoints */}
        <div
          style={{
            transform: `translateY(${-scrollY}px)`,
            transition: 'transform 0.08s ease-out',
          }}
          className="absolute inset-x-0 top-1/2 w-full max-w-lg mx-auto flex flex-col items-center z-20"
        >
          {checkpoints.map((cp, idx) => {
            const isCurrent = idx === currentCheckpointIndex;
            const isAligned = isCurrent && directionHint === 'aligned';

            return (
              <div
                key={cp.id}
                onClick={(e) => handleCheckpointClick(idx, e)}
                style={{
                  height: `${nodeHeight}px`,
                  marginBottom: idx === checkpoints.length - 1 ? '0px' : `${nodeGap}px`,
                }}
                className={`w-11/12 max-w-md rounded-2xl border-2 px-5 py-3 flex items-center justify-between shadow-lg transition-all duration-150 select-none ${
                  cp.isLocked
                    ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200 cursor-default opacity-60'
                    : isAligned
                    ? 'border-emerald-400 bg-emerald-900/90 text-white scale-105 ring-4 ring-emerald-400/50 shadow-emerald-500/30 cursor-pointer animate-pulse'
                    : isCurrent
                    ? 'border-indigo-400 bg-indigo-950/90 text-white shadow-indigo-500/20 cursor-pointer'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 opacity-40 cursor-not-allowed'
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
                      {cp.isLocked ? (
                        '✓ Capturado con éxito'
                      ) : isAligned ? (
                        <span className="text-emerald-300 font-bold flex items-center gap-1">
                          <MousePointerClick className="w-3.5 h-3.5 animate-bounce" />
                          ¡HAZ CLIC AQUÍ AHORA!
                        </span>
                      ) : isCurrent ? (
                        'Gira la rueda hasta el centro'
                      ) : (
                        'Siguiente en la lista'
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Badge inside the Card */}
                {cp.isLocked ? (
                  <div className="bg-emerald-500 text-slate-950 rounded-full p-1.5 shadow-md">
                    <CheckCircle2 className="w-5 h-5 font-bold" />
                  </div>
                ) : isAligned ? (
                  <button
                    onClick={(e) => handleCheckpointClick(idx, e)}
                    className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1 animate-bounce"
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>CAPTURAR</span>
                  </button>
                ) : isCurrent ? (
                  <div className="text-[11px] font-semibold text-indigo-400 px-2.5 py-1 bg-indigo-950/60 border border-indigo-800 rounded-lg">
                    Alinear
                  </div>
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

        {/* Floating Feedback Notice */}
        {floatingFeedback && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{floatingFeedback}</span>
          </div>
        )}
      </div>

      {/* Footer Instructions with clear guidance */}
      <div className="z-30 text-center text-xs text-slate-400 shrink-0 flex items-center justify-center gap-3">
        <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-slate-300 flex items-center gap-2">
          <span>💡</span>
          <span>
            <strong>Instrucción activa:</strong> Gira la rueda del ratón hasta que la caja quede en el centro, y luego <strong>haz clic izquierdo sobre la caja</strong> para capturarla.
          </span>
        </span>
      </div>
    </div>
  );
};
