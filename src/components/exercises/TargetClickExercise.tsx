import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  isMoving: boolean;
  vx: number;
  vy: number;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface Props {
  difficultyFactor: number;
  mode: 'campaign' | 'free_practice';
  onComplete: (metrics: ExerciseMetrics) => void;
  onLiveUpdate?: (stats: { current: number; total: number; score: number }) => void;
}

export const TargetClickExercise: React.FC<Props> = ({
  difficultyFactor,
  mode,
  onComplete,
  onLiveUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalTargetsGoal = mode === 'campaign' ? 10 : 25;
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
  const [targetsHit, setTargetsHit] = useState(0);
  const [score, setScore] = useState(0);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const startTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Spawn new target inside container bounds
  const spawnTarget = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const baseRadius = 46;
    const radius = Math.max(22, Math.round(baseRadius / Math.sqrt(difficultyFactor)));
    const padding = radius + 24;

    const minX = padding;
    const maxX = rect.width - padding;
    const minY = padding + 10;
    const maxY = rect.height - padding;

    const x = Math.floor(minX + Math.random() * (maxX - minX));
    const y = Math.floor(minY + Math.random() * (maxY - minY));

    // In higher difficulty, targets float gently
    const isMoving = difficultyFactor > 1.2 && index > 2;
    const speed = 0.8 * difficultyFactor;
    const angle = Math.random() * Math.PI * 2;

    const newTarget: Target = {
      id: Date.now() + Math.random(),
      x,
      y,
      radius,
      isMoving,
      vx: isMoving ? Math.cos(angle) * speed : 0,
      vy: isMoving ? Math.sin(angle) * speed : 0,
    };

    setCurrentTarget(newTarget);
    tracker.setTarget(rect.left + x, rect.top + y);
  };

  // Initial spawn
  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setTargetsHit(0);
    setScore(0);
    setFloatingScores([]);

    const timer = setTimeout(() => {
      spawnTarget(0);
    }, 150);

    return () => clearTimeout(timer);
  }, [difficultyFactor, mode]);

  // Movement animation for drifting targets
  useEffect(() => {
    const updateMotion = () => {
      if (currentTarget && currentTarget.isMoving && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const padding = currentTarget.radius + 12;

        let nextX = currentTarget.x + currentTarget.vx;
        let nextY = currentTarget.y + currentTarget.vy;
        let nextVx = currentTarget.vx;
        let nextVy = currentTarget.vy;

        if (nextX <= padding || nextX >= rect.width - padding) {
          nextVx = -nextVx;
          nextX = Math.max(padding, Math.min(rect.width - padding, nextX));
        }
        if (nextY <= padding || nextY >= rect.height - padding) {
          nextVy = -nextVy;
          nextY = Math.max(padding, Math.min(rect.height - padding, nextY));
        }

        setCurrentTarget((prev) =>
          prev ? { ...prev, x: nextX, y: nextY, vx: nextVx, vy: nextVy } : null
        );
        tracker.setTarget(rect.left + nextX, rect.top + nextY);
      }
      animationFrameRef.current = requestAnimationFrame(updateMotion);
    };

    animationFrameRef.current = requestAnimationFrame(updateMotion);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentTarget]);

  // Pointer tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    tracker.addSample(e.clientX, e.clientY);
  };

  // Canvas click (missed click if target wasn't hit directly)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      sound.playMiss();
      tracker.registerMissedClick();
    }
  };

  // Target clicked
  const handleTargetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!currentTarget || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const distToCenter = Math.hypot(clickX - currentTarget.x, clickY - currentTarget.y);

    const isBullseye = distToCenter <= currentTarget.radius * 0.45;
    const pointsGained = isBullseye ? 100 : 60;
    const nextScore = score + pointsGained;

    sound.playHit(isBullseye ? 1.2 : 1.0);
    tracker.registerTargetHit();

    // Floating score animation
    const scoreId = Date.now();
    setFloatingScores((prev) => [
      ...prev,
      {
        id: scoreId,
        x: currentTarget.x,
        y: currentTarget.y - 10,
        text: isBullseye ? '¡Centro! +100' : '+60',
        color: isBullseye ? 'text-emerald-600 font-bold' : 'text-indigo-600 font-medium',
      },
    ]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId));
    }, 700);

    const nextHits = targetsHit + 1;
    setTargetsHit(nextHits);
    setScore(nextScore);

    if (onLiveUpdate) {
      onLiveUpdate({ current: nextHits, total: totalTargetsGoal, score: nextScore });
    }

    if (nextHits >= totalTargetsGoal) {
      setCurrentTarget(null);
      const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
      const summary = tracker.getSummary(nextHits, totalTargetsGoal, durationSeconds, difficultyFactor);
      onComplete({
        moduleName: 'target-click',
        moduleTitle: 'Movimiento y Puntería',
        mode,
        score: nextScore,
        ...summary,
      });
    } else {
      spawnTarget(nextHits);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onClick={handleContainerClick}
      className="relative w-full h-full max-h-full bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden cursor-crosshair select-none flex flex-col justify-between p-3 sm:p-4"
    >
      {/* Exercise Instructions banner */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-slate-800">Objetivo:</span>
          <span>Haz clic en el centro de las dianas ({targetsHit}/{totalTargetsGoal})</span>
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-mono tabular-nums text-slate-700">
          Puntos: <span className="font-bold text-slate-900">{score}</span>
        </div>
      </div>

      {/* Target element */}
      {currentTarget && (
        <div
          onClick={handleTargetClick}
          style={{
            position: 'absolute',
            left: `${currentTarget.x}px`,
            top: `${currentTarget.y}px`,
            width: `${currentTarget.radius * 2}px`,
            height: `${currentTarget.radius * 2}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          title="Haz clic aquí"
        >
          {/* Outer ring */}
          <div className="w-full h-full rounded-full border-4 border-indigo-500/80 bg-indigo-50/90 shadow-md flex items-center justify-center transition-all group-hover:border-indigo-600">
            {/* Middle ring */}
            <div className="w-3/4 h-3/4 rounded-full border-2 border-indigo-300 bg-white flex items-center justify-center">
              {/* Bullseye center */}
              <div className="w-1/2 h-1/2 rounded-full bg-indigo-600 flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating score notices */}
      {floatingScores.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.x}px`,
            top: `${item.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className={`text-sm pointer-events-none animate-bounce transition-all ${item.color}`}
        >
          {item.text}
        </div>
      ))}

      {/* Helper footer */}
      <div className="z-10 text-center text-xs text-slate-400 pointer-events-none">
        Tip: Mueve la mano de forma fluida. Si notas fatiga, apoya bien el antebrazo.
      </div>
    </div>
  );
};
