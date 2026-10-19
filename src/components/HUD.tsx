import React, { useState, useEffect } from 'react';
import { tracker } from '../utils/motionTracker';
import { Activity, Gauge, Zap, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  moduleTitle: string;
  levelNumber?: number;
  difficultyFactor: number;
  onReset: () => void;
  onExit: () => void;
  liveStats?: { current: number; total: number; score: number };
}

export const HUD: React.FC<Props> = ({
  moduleTitle,
  levelNumber,
  difficultyFactor,
  onReset,
  onExit,
  liveStats,
}) => {
  const [metrics, setMetrics] = useState({
    speedPxMs: 0,
    jitterScore: 10,
    smoothIndex: 85,
  });

  // Poll tracker live metrics every 150ms for smooth zero-lag HUD
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(tracker.getLiveMetrics());
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Module Title and Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Volver al menú de misiones"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            {levelNumber && (
              <span className="font-semibold text-indigo-600">Nivel {levelNumber}</span>
            )}
            <span className="font-bold text-slate-900">{moduleTitle}</span>
          </div>
          {liveStats && (
            <div className="text-[11px] text-slate-500">
              Progreso: {liveStats.current} / {liveStats.total}
            </div>
          )}
        </div>
      </div>

      {/* Live Telemetry Meters */}
      <div className="flex items-center gap-5 text-slate-600">
        {/* Speed */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-500">Velocidad:</span>
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {metrics.speedPxMs.toFixed(1)} px/ms
          </span>
        </div>

        {/* Smoothness */}
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-500">Fluidez:</span>
          <span className="font-mono tabular-nums font-semibold text-slate-800">
            {metrics.smoothIndex}/100
          </span>
        </div>

        {/* Jitter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Temblor:</span>
          <span className={`font-mono tabular-nums font-semibold ${
            metrics.jitterScore > 35 ? 'text-amber-600' : 'text-slate-800'
          }`}>
            {metrics.jitterScore}/100
          </span>
        </div>

        {/* Difficulty Calibration Factor */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
          <Gauge className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-slate-500">Dificultad adaptativa:</span>
          <span className="font-mono tabular-nums font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
            {difficultyFactor.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reiniciar ejercicio</span>
        </button>
      </div>
    </div>
  );
};
