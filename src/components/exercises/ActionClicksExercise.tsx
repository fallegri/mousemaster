import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Folder, Key, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface ActionItem {
  id: number;
  type: 'double_click' | 'right_click';
  title: string;
  instruction: string;
  state: 'pending' | 'success';
  x: number;
  y: number;
}

interface Props {
  difficultyFactor: number;
  mode: 'campaign' | 'free_practice';
  onComplete: (metrics: ExerciseMetrics) => void;
  onLiveUpdate?: (stats: { current: number; total: number; score: number }) => void;
}

export const ActionClicksExercise: React.FC<Props> = ({
  difficultyFactor,
  mode,
  onComplete,
  onLiveUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalItemsGoal = mode === 'campaign' ? 8 : 16;
  const [itemsCompleted, setItemsCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [currentItem, setCurrentItem] = useState<ActionItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const lastClickTimeRef = useRef<number>(0);
  const startTimeRef = useRef(performance.now());

  // Allowed double click interval adjusted by difficulty (generous for beginners)
  const maxDoubleClickIntervalMs = Math.round(520 / Math.sqrt(difficultyFactor));

  const spawnItem = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 100;
    const x = Math.floor(padding + Math.random() * (rect.width - padding * 2));
    const y = Math.floor(padding + Math.random() * (rect.height - padding * 2));

    // Alternate between double click and right click
    const isDoubleClick = index % 2 === 0;

    const item: ActionItem = {
      id: Date.now() + Math.random(),
      type: isDoubleClick ? 'double_click' : 'right_click',
      title: isDoubleClick ? 'Cápsula Encriptada' : 'Baliza de Seguridad',
      instruction: isDoubleClick
        ? '¡Haz doble clic rápido (2 toques sin mover el ratón)!'
        : '¡Haz clic derecho sobre este elemento!',
      state: 'pending',
      x,
      y,
    };

    setCurrentItem(item);
    setContextMenu(null);
    tracker.setTarget(rect.left + x, rect.top + y);
  };

  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setItemsCompleted(0);
    setScore(0);
    setFeedbackMsg('');
    const t = setTimeout(() => spawnItem(0), 150);
    return () => clearTimeout(t);
  }, [difficultyFactor, mode]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    tracker.addSample(e.clientX, e.clientY);
  };

  // Prevent default browser context menu inside the exercise container
  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const onItemSuccess = (points: number, message: string) => {
    sound.playHit(1.1);
    tracker.registerTargetHit();
    setFeedbackMsg(message);
    const nextCompleted = itemsCompleted + 1;
    const nextScore = score + points;
    setItemsCompleted(nextCompleted);
    setScore(nextScore);

    if (onLiveUpdate) {
      onLiveUpdate({ current: nextCompleted, total: totalItemsGoal, score: nextScore });
    }

    if (nextCompleted >= totalItemsGoal) {
      setCurrentItem(null);
      setContextMenu(null);
      const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
      const summary = tracker.getSummary(nextCompleted, totalItemsGoal, durationSeconds, difficultyFactor);
      onComplete({
        moduleName: 'action-clicks',
        moduleTitle: 'Doble Clic y Clic Secuencial',
        mode,
        score: nextScore,
        ...summary,
      });
    } else {
      setTimeout(() => {
        setFeedbackMsg('');
        spawnItem(nextCompleted);
      }, 400);
    }
  };

  // Handle left click on item
  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem || currentItem.state === 'success') return;

    if (currentItem.type === 'double_click') {
      const now = performance.now();
      const interval = now - lastClickTimeRef.current;
      lastClickTimeRef.current = now;

      if (interval > 40 && interval <= maxDoubleClickIntervalMs) {
        // Successful double click!
        onItemSuccess(100, '¡Excelente cadencia de doble clic!');
      } else if (interval > maxDoubleClickIntervalMs) {
        // First click of a double click attempt
        sound.playClick(800);
        setFeedbackMsg('1er clic registrado... ¡da el segundo rápido!');
      }
    } else if (currentItem.type === 'right_click') {
      // User clicked with left button instead of right button
      sound.playMiss();
      tracker.registerMissedClick();
      setFeedbackMsg('Usa el botón derecho del ratón (botón secundario)');
    }
  };

  // Handle right click on item
  const handleItemContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentItem || currentItem.state === 'success') return;

    if (currentItem.type === 'right_click') {
      sound.playSnap();
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          visible: true,
        });
        setFeedbackMsg('Ahora selecciona "Desbloquear" en el menú');
      }
    } else {
      sound.playMiss();
      tracker.registerMissedClick();
      setFeedbackMsg('Este elemento requiere doble clic izquierdo');
    }
  };

  // Context menu item selected
  const handleSelectMenuOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
    onItemSuccess(100, '¡Menú contextual ejecutado a la perfección!');
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onContextMenu={handleContainerContextMenu}
      onClick={() => {
        if (contextMenu?.visible) setContextMenu(null);
      }}
      className="relative w-full h-full min-h-[480px] bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden select-none flex flex-col justify-between p-4"
    >
      {/* Top Banner */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-slate-800">Misión:</span>
          <span>{currentItem?.instruction || 'Cargando elemento...'} ({itemsCompleted}/{totalItemsGoal})</span>
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-mono tabular-nums text-slate-700">
          Puntos: <span className="font-bold text-slate-900">{score}</span>
        </div>
      </div>

      {/* Target Item */}
      {currentItem && (
        <div
          onClick={handleItemClick}
          onContextMenu={handleItemContextMenu}
          style={{
            position: 'absolute',
            left: `${currentItem.x}px`,
            top: `${currentItem.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <div className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 shadow-md transition-colors ${
            currentItem.type === 'double_click'
              ? 'bg-amber-50 border-amber-300 hover:border-amber-400 text-amber-900'
              : 'bg-indigo-50 border-indigo-300 hover:border-indigo-400 text-indigo-900'
          }`}>
            <div className={`p-3 rounded-xl ${
              currentItem.type === 'double_click' ? 'bg-amber-100' : 'bg-indigo-100'
            }`}>
              {currentItem.type === 'double_click' ? (
                <Folder className="w-8 h-8 text-amber-600 animate-pulse" />
              ) : (
                <Key className="w-8 h-8 text-indigo-600" />
              )}
            </div>
            <div className="text-xs font-semibold whitespace-nowrap">{currentItem.title}</div>
            <div className="text-[10px] text-slate-500 px-2 py-0.5 bg-white/70 rounded-md border border-slate-200">
              {currentItem.type === 'double_click' ? '2 toques rápidos' : 'Clic derecho'}
            </div>
          </div>
        </div>
      )}

      {/* Custom Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          className="z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Acción Contextual
          </div>
          <button
            onClick={handleSelectMenuOption}
            className="w-full text-left px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition-colors font-medium"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Desbloquear acceso</span>
          </button>
          <button
            onClick={() => setContextMenu(null)}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Live Feedback Toast */}
      {feedbackMsg && (
        <div className="z-20 self-center bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Helper Footer */}
      <div className="z-10 text-center text-xs text-slate-400 pointer-events-none">
        Tip: Para el doble clic, mantén la mano quieta sobre la mesa y presiona con la punta del dedo índice dos veces seguidas.
      </div>
    </div>
  );
};
