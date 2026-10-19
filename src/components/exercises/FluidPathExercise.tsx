import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Flag, Play, CheckCircle2, AlertOctagon } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Props {
  difficultyFactor: number;
  mode: 'campaign' | 'free_practice';
  onComplete: (metrics: ExerciseMetrics) => void;
  onLiveUpdate?: (stats: { current: number; total: number; score: number }) => void;
}

export const FluidPathExercise: React.FC<Props> = ({
  difficultyFactor,
  mode,
  onComplete,
  onLiveUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalLapsGoal = mode === 'campaign' ? 3 : 6;
  const [currentLap, setCurrentLap] = useState(0);
  const [hasStartedPath, setHasStartedPath] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [wallCollisions, setWallCollisions] = useState(0);
  const [isColliding, setIsColliding] = useState(false);
  const [score, setScore] = useState(0);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const startTimeRef = useRef(performance.now());
  const pathDRef = useRef('');

  // Path channel width: narrower for higher difficulty
  const channelWidth = Math.max(28, Math.round(52 / Math.sqrt(difficultyFactor)));

  // Generate smooth winding Bezier waypoint track
  const generateTrack = (lap: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const startX = 60;
    const startY = h / 2;
    const endX = w - 60;
    const endY = h / 2;

    // Generate undulating waypoints
    const points: Point[] = [
      { x: startX, y: startY },
      { x: w * 0.25, y: lap % 2 === 0 ? h * 0.25 : h * 0.75 },
      { x: w * 0.5, y: lap % 2 === 0 ? h * 0.75 : h * 0.25 },
      { x: w * 0.75, y: lap % 2 === 0 ? h * 0.3 : h * 0.7 },
      { x: endX, y: endY },
    ];

    setPathPoints(points);

    // Build SVG path data with Catmull-Rom or cubic Bezier
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1X = prev.x + (curr.x - prev.x) / 2;
      const cp1Y = prev.y;
      const cp2X = prev.x + (curr.x - prev.x) / 2;
      const cp2Y = curr.y;
      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${curr.x} ${curr.y}`;
    }

    pathDRef.current = d;
    setHasStartedPath(false);
    setIsColliding(false);
  };

  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setCurrentLap(0);
    setScore(0);
    setWallCollisions(0);

    const t = setTimeout(() => generateTrack(0), 150);
    return () => clearTimeout(t);
  }, [difficultyFactor, mode]);

  // Distance from a point to cubic Bezier curve sampling
  const checkDistanceToPath = (px: number, py: number): number => {
    if (pathPoints.length < 2) return 0;
    // Fast approximation: minimum distance to polyline segments
    let minDist = Infinity;
    const steps = 30;

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const sx = p1.x + (p2.x - p1.x) * t;
        const sy = p1.y + (p2.y - p1.y) * t;
        const dist = Math.hypot(px - sx, py - sy);
        if (dist < minDist) minDist = dist;
      }
    }
    return minDist;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    tracker.addSample(e.clientX, e.clientY);
    if (!containerRef.current || pathPoints.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    const startPt = pathPoints[0];
    const endPt = pathPoints[pathPoints.length - 1];

    // Check if cursor entered Start Gate
    if (!hasStartedPath) {
      const distToStart = Math.hypot(x - startPt.x, y - startPt.y);
      if (distToStart <= channelWidth) {
        setHasStartedPath(true);
        sound.playClick(600);
        tracker.setTarget(rect.left + endPt.x, rect.top + endPt.y);
      }
      return;
    }

    // While traversing the path
    const distToCenter = checkDistanceToPath(x, y);
    const maxAllowedDist = channelWidth / 2 + 10;

    if (distToCenter > maxAllowedDist) {
      if (!isColliding) {
        setIsColliding(true);
        setWallCollisions((prev) => prev + 1);
        sound.playMiss();
        tracker.registerMissedClick();
      }
    } else {
      if (isColliding) {
        setIsColliding(false);
      }
    }

    // Check if cursor reached Finish Gate
    const distToEnd = Math.hypot(x - endPt.x, y - endPt.y);
    if (distToEnd <= channelWidth * 0.9) {
      // Reached finish!
      sound.playHit(1.3);
      tracker.registerTargetHit();

      const lapPoints = Math.max(40, 100 - wallCollisions * 15);
      const nextScore = score + lapPoints;
      setScore(nextScore);

      const nextLap = currentLap + 1;
      setCurrentLap(nextLap);

      if (onLiveUpdate) {
        onLiveUpdate({ current: nextLap, total: totalLapsGoal, score: nextScore });
      }

      if (nextLap >= totalLapsGoal) {
        const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
        const summary = tracker.getSummary(
          totalLapsGoal,
          totalLapsGoal,
          durationSeconds,
          difficultyFactor
        );
        onComplete({
          moduleName: 'fluid-path',
          moduleTitle: 'Movimiento Fluido y Trazo',
          mode,
          score: nextScore,
          ...summary,
        });
      } else {
        generateTrack(nextLap);
      }
    }
  };

  const startPt = pathPoints[0] || { x: 0, y: 0 };
  const endPt = pathPoints[pathPoints.length - 1] || { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`relative w-full h-full max-h-full border border-slate-200 rounded-2xl overflow-hidden select-none flex flex-col justify-between p-3 sm:p-4 cursor-none transition-colors ${
        isColliding ? 'bg-red-50/60' : 'bg-slate-100/70'
      }`}
    >
      {/* Top Banner */}
      <div className="z-20 flex items-center justify-between text-xs text-slate-500 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-slate-800">Misión:</span>
          <span>
            {hasStartedPath
              ? 'Conduce suavemente hasta la meta verde sin tocar los márgenes'
              : 'Pasa por el círculo AZUL (INICIO) para comenzar el trayecto'}{' '}
            (Vuelta {currentLap + 1}/{totalLapsGoal})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs font-medium text-slate-600">
            Rozaduras: <span className="text-red-600 font-bold">{wallCollisions}</span>
          </div>
          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-mono tabular-nums text-slate-700">
            Puntos: <span className="font-bold text-slate-900">{score}</span>
          </div>
        </div>
      </div>

      {/* SVG Path River Canal */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Outer boundary buffer */}
        {pathDRef.current && (
          <path
            d={pathDRef.current}
            fill="none"
            stroke={isColliding ? '#fca5a5' : '#cbd5e1'}
            strokeWidth={channelWidth + 8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Safe channel track */}
        {pathDRef.current && (
          <path
            d={pathDRef.current}
            fill="none"
            stroke="#ffffff"
            strokeWidth={channelWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-xs"
          />
        )}
        {/* Central guide filament */}
        {pathDRef.current && (
          <path
            d={pathDRef.current}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeOpacity="0.4"
          />
        )}
      </svg>

      {/* Start Gate */}
      {pathPoints.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${startPt.x}px`,
            top: `${startPt.y}px`,
            width: `${channelWidth * 1.2}px`,
            height: `${channelWidth * 1.2}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`rounded-full border-2 border-indigo-500 flex items-center justify-center shadow-md transition-all ${
            hasStartedPath ? 'bg-indigo-100 opacity-60' : 'bg-indigo-500 text-white animate-pulse'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
        </div>
      )}

      {/* Finish Gate */}
      {pathPoints.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${endPt.x}px`,
            top: `${endPt.y}px`,
            width: `${channelWidth * 1.2}px`,
            height: `${channelWidth * 1.2}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="rounded-full border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center shadow-md"
        >
          <Flag className="w-5 h-5 fill-current" />
        </div>
      )}

      {/* Dynamic Cursor Orb */}
      <div
        style={{
          position: 'absolute',
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
        className={`w-5 h-5 rounded-full pointer-events-none transition-transform duration-75 shadow-lg flex items-center justify-center ${
          isColliding
            ? 'bg-red-500 ring-4 ring-red-300 scale-125'
            : hasStartedPath
            ? 'bg-indigo-600 ring-4 ring-indigo-200'
            : 'bg-slate-700 ring-2 ring-white'
        }`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>

      {/* Colliding Alert Toast */}
      {isColliding && (
        <div className="z-20 self-center bg-red-600 text-white px-4 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 animate-bounce">
          <AlertOctagon className="w-4 h-4" />
          <span>¡Fuera de pista! Vuelve al centro del carril blanco</span>
        </div>
      )}

      {/* Helper Footer */}
      <div className="z-20 text-center text-xs text-slate-400 pointer-events-none">
        Tip: Mantén un ritmo de deslizamiento constante; no te apresures en los giros.
      </div>
    </div>
  );
};
