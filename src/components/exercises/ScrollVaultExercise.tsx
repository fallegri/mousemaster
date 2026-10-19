import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Crosshair, CheckCircle2, ArrowDown } from 'lucide-react';

interface Checkpoint {
  id: number;
  label: string;
  targetY: number; // in pixels from top
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalCheckpointsGoal = mode === 'campaign' ? 5 : 10;
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lockProgress, setLockProgress] = useState(0); // 0 to 100%
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const lockIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef(performance.now());

  // Tolerance in pixels: harder = narrower
  const alignmentTolerance = Math.max(16, Math.round(36 / Math.sqrt(difficultyFactor)));

  // Generate checkpoints spaced along a long scrollable chamber
  const initCheckpoints = () => {
    const list: Checkpoint[] = [];
    const spacing = 380;
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-500'];

    for (let i = 0; i < totalCheckpointsGoal; i++) {
      list.push({
        id: i + 1,
        label: `Nodo de Frecuencia #${i + 1}`,
        targetY: 280 + i * spacing,
        color: colors[i % colors.length],
        isLocked: false,
      });
    }
    setCheckpoints(list);
  };

  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setCurrentCheckpointIndex(0);
    setScore(0);
    setLockProgress(0);
    initCheckpoints();

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [difficultyFactor, mode]);

  // Check alignment continuously on scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current || currentCheckpointIndex >= checkpoints.length) return;

    const container = scrollContainerRef.current;
    const viewportCenterY = container.scrollTop + container.clientHeight / 2;
    const currentTarget = checkpoints[currentCheckpointIndex];

    const distance = Math.abs(viewportCenterY - currentTarget.targetY);

    if (distance <= alignmentTolerance) {
      // Within alignment zone! Start locking
      if (!lockIntervalRef.current) {
        sound.playClick(500);
        lockIntervalRef.current = window.setInterval(() => {
          setLockProgress((prev) => {
            if (prev >= 100) {
              // Successfully locked!
              if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
              lockIntervalRef.current = null;
              handleLockSuccess();
              return 0;
            }
            return prev + 12;
          });
        }, 50);
      }
    } else {
      // Fell out of alignment zone
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
        lockIntervalRef.current = null;
      }
      setLockProgress(0);
    }
  };

  const handleLockSuccess = () => {
    sound.playHit(1.2);
    tracker.registerTargetHit();
    const nextScore = score + 100;
    setScore(nextScore);

    setCheckpoints((prev) =>
      prev.map((c, idx) => (idx === currentCheckpointIndex ? { ...c, isLocked: true } : c))
    );

    const nextIndex = currentCheckpointIndex + 1;
    setCurrentCheckpointIndex(nextIndex);

    if (onLiveUpdate) {
      onLiveUpdate({ current: nextIndex, total: totalCheckpointsGoal, score: nextScore });
    }

    if (nextIndex >= totalCheckpointsGoal) {
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

  useEffect(() => {
    return () => {
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden select-none flex flex-col justify-between p-4">
      {/* Top Banner */}
      <div className="z-20 flex items-center justify-between text-xs text-slate-500 pointer-events-none mb-2">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-slate-800">Misión:</span>
          <span>
            Gira la rueda del ratón y alinea cada nodo en el visor ({Math.min(currentCheckpointIndex + 1, totalCheckpointsGoal)}/{totalCheckpointsGoal})
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-mono tabular-nums text-slate-700">
          Puntos: <span className="font-bold text-slate-900">{score}</span>
        </div>
      </div>

      {/* Main Scroll Chamber */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Fixed Center Alignment Viewfinder (Reticle) */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center">
          <div className="relative w-full max-w-md h-24 border-y-2 border-indigo-400 bg-indigo-50/40 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
              <Crosshair className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '8s' }} />
              <span>ZONA DE ALINEACIÓN</span>
            </div>

            {/* Lock-in ring meter */}
            {lockProgress > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700">{lockProgress}%</span>
                <div className="w-16 h-2 bg-indigo-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-75"
                    style={{ width: `${lockProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable track */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-auto custom-scrollbar p-6 space-y-12 relative"
        >
          {/* Scroll hint at top */}
          <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1">
            <ArrowDown className="w-4 h-4 animate-bounce text-indigo-500" />
            <span>Gira la rueda hacia abajo para iniciar la calibración</span>
          </div>

          {/* Render Checkpoints along the runway */}
          {checkpoints.map((cp, idx) => {
            const isCurrent = idx === currentCheckpointIndex;
            return (
              <div
                key={cp.id}
                style={{ height: '140px' }}
                className={`w-full max-w-sm mx-auto rounded-2xl border-2 p-5 flex items-center justify-between shadow-xs transition-all ${
                  cp.isLocked
                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900 opacity-80'
                    : isCurrent
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-md scale-102'
                    : 'border-slate-200 bg-slate-50 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${cp.color}`}>
                    {cp.id}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{cp.label}</div>
                    <div className="text-[11px] text-slate-500">
                      {cp.isLocked ? '¡Alineado y confirmado!' : isCurrent ? '<< ALINEAR EN EL VISOR >>' : 'En espera'}
                    </div>
                  </div>
                </div>

                {cp.isLocked && (
                  <div className="bg-emerald-600 text-white rounded-full p-1 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Extra bottom padding to allow last item to reach center */}
          <div className="h-64" />
        </div>
      </div>

      {/* Helper Footer */}
      <div className="z-20 text-center text-xs text-slate-400 pointer-events-none mt-2">
        Tip: Mueve la rueda con el dedo índice en toques controlados; cuando el nodo esté en el visor, mantén el mouse quieto 1 segundo.
      </div>
    </div>
  );
};
