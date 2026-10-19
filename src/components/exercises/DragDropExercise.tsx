import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Circle, Square, Triangle, CheckCircle2 } from 'lucide-react';

interface DraggableItem {
  id: string;
  type: 'circle' | 'square' | 'triangle';
  color: string;
  label: string;
  currentX: number;
  currentY: number;
  originX: number;
  originY: number;
  isDragging: boolean;
  isMatched: boolean;
}

interface DropZone {
  id: string;
  type: 'circle' | 'square' | 'triangle';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  difficultyFactor: number;
  mode: 'campaign' | 'free_practice';
  onComplete: (metrics: ExerciseMetrics) => void;
  onLiveUpdate?: (stats: { current: number; total: number; score: number }) => void;
}

export const DragDropExercise: React.FC<Props> = ({
  difficultyFactor,
  mode,
  onComplete,
  onLiveUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalRoundsGoal = mode === 'campaign' ? 3 : 6;
  const [currentRound, setCurrentRound] = useState(0);
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const startTimeRef = useRef(performance.now());
  const matchedCountRef = useRef(0);

  const initRound = (roundIndex: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const zoneTypes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
    const zoneLabels = {
      circle: 'Receptor Esfera',
      square: 'Receptor Cubo',
      triangle: 'Receptor Prisma',
    };

    // Define 3 drop zones on the right side
    const zoneWidth = Math.max(90, Math.round(110 / Math.sqrt(difficultyFactor)));
    const zoneHeight = Math.max(90, Math.round(110 / Math.sqrt(difficultyFactor)));
    const rightMargin = rect.width - zoneWidth - 40;
    const spacingY = (rect.height - 100) / 3;

    const newZones: DropZone[] = zoneTypes.map((type, i) => ({
      id: `zone-${type}`,
      type,
      label: zoneLabels[type],
      x: rightMargin,
      y: 60 + i * spacingY,
      width: zoneWidth,
      height: zoneHeight,
    }));

    // Define draggable items on the left side
    const itemColors = {
      circle: 'from-emerald-400 to-teal-500 text-emerald-950',
      square: 'from-indigo-400 to-blue-500 text-indigo-950',
      triangle: 'from-amber-400 to-orange-500 text-amber-950',
    };

    // Shuffle types for items
    const shuffledTypes = [...zoneTypes].sort(() => Math.random() - 0.5);
    const itemLeftMargin = 60;
    const itemSpacingY = (rect.height - 120) / shuffledTypes.length;

    const newItems: DraggableItem[] = shuffledTypes.map((type, i) => {
      const originX = itemLeftMargin + (Math.random() * 40 - 20);
      const originY = 70 + i * itemSpacingY;
      return {
        id: `item-${roundIndex}-${i}`,
        type,
        color: itemColors[type],
        label: zoneLabels[type].replace('Receptor ', ''),
        originX,
        originY,
        currentX: originX,
        currentY: originY,
        isDragging: false,
        isMatched: false,
      };
    });

    setDropZones(newZones);
    setItems(newItems);
    matchedCountRef.current = 0;
  };

  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setCurrentRound(0);
    setScore(0);
    const t = setTimeout(() => initRound(0), 150);
    return () => clearTimeout(t);
  }, [difficultyFactor, mode]);

  // Pointer move inside container
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    tracker.addSample(e.clientX, e.clientY);

    if (activeDragId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffsetRef.current.x;
      const newY = e.clientY - rect.top - dragOffsetRef.current.y;

      setItems((prev) =>
        prev.map((item) =>
          item.id === activeDragId
            ? { ...item, currentX: newX, currentY: newY }
            : item
        )
      );
    }
  };

  // Start dragging an item
  const handlePointerDown = (item: DraggableItem, e: React.PointerEvent) => {
    e.stopPropagation();
    if (item.isMatched || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left - item.currentX,
      y: e.clientY - rect.top - item.currentY,
    };

    setActiveDragId(item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isDragging: true } : i))
    );
    sound.playClick(700);

    // Track matching target zone for overshoot telemetry
    const matchingZone = dropZones.find((z) => z.type === item.type);
    if (matchingZone) {
      tracker.setTarget(
        rect.left + matchingZone.x + matchingZone.width / 2,
        rect.top + matchingZone.y + matchingZone.height / 2
      );
    }
  };

  // Finish dragging / release
  const handlePointerUp = () => {
    if (!activeDragId || !containerRef.current) return;

    const draggedItem = items.find((i) => i.id === activeDragId);
    if (!draggedItem) {
      setActiveDragId(null);
      return;
    }

    // Check if dragged within the correct zone's boundaries
    const matchingZone = dropZones.find((z) => z.type === draggedItem.type);
    let matched = false;

    if (matchingZone) {
      const itemCenterX = draggedItem.currentX + 36;
      const itemCenterY = draggedItem.currentY + 36;

      const zoneCenterX = matchingZone.x + matchingZone.width / 2;
      const zoneCenterY = matchingZone.y + matchingZone.height / 2;

      const distance = Math.hypot(itemCenterX - zoneCenterX, itemCenterY - zoneCenterY);
      const tolerance = (matchingZone.width / 2) + 20;

      if (distance <= tolerance) {
        matched = true;
      }
    }

    if (matched && matchingZone) {
      // Successful drop!
      sound.playSnap();
      tracker.registerTargetHit();
      const points = 100;
      const nextScore = score + points;
      setScore(nextScore);

      setItems((prev) =>
        prev.map((i) =>
          i.id === activeDragId
            ? {
                ...i,
                currentX: matchingZone.x + (matchingZone.width - 72) / 2,
                currentY: matchingZone.y + (matchingZone.height - 72) / 2,
                isDragging: false,
                isMatched: true,
              }
            : i
        )
      );

      matchedCountRef.current += 1;
      const totalInRound = items.length;

      if (onLiveUpdate) {
        onLiveUpdate({
          current: currentRound * 3 + matchedCountRef.current,
          total: totalRoundsGoal * 3,
          score: nextScore,
        });
      }

      if (matchedCountRef.current >= totalInRound) {
        // Round completed
        const nextRound = currentRound + 1;
        if (nextRound >= totalRoundsGoal) {
          const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
          const summary = tracker.getSummary(
            totalRoundsGoal * 3,
            totalRoundsGoal * 3,
            durationSeconds,
            difficultyFactor
          );
          onComplete({
            moduleName: 'drag-drop',
            moduleTitle: 'Arrastrar y Soltar',
            mode,
            score: nextScore,
            ...summary,
          });
        } else {
          setCurrentRound(nextRound);
          setTimeout(() => initRound(nextRound), 400);
        }
      }
    } else {
      // Spring back to origin
      sound.playMiss();
      tracker.registerMissedClick();
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeDragId
            ? {
                ...i,
                currentX: i.originX,
                currentY: i.originY,
                isDragging: false,
              }
            : i
        )
      );
    }

    setActiveDragId(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full min-h-[480px] bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden select-none flex flex-col justify-between p-4"
    >
      {/* Top Banner */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-500 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-slate-800">Misión:</span>
          <span>
            Arrastra cada elemento a su receptor coincidente (Ronda {currentRound + 1}/{totalRoundsGoal})
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-mono tabular-nums text-slate-700">
          Puntos: <span className="font-bold text-slate-900">{score}</span>
        </div>
      </div>

      {/* Drop Zones */}
      {dropZones.map((zone) => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            left: `${zone.x}px`,
            top: `${zone.y}px`,
            width: `${zone.width}px`,
            height: `${zone.height}px`,
          }}
          className="border-2 border-dashed border-slate-300 bg-white/60 rounded-2xl flex flex-col items-center justify-center p-2 text-slate-400 transition-colors"
        >
          {zone.type === 'circle' && <Circle className="w-8 h-8 text-emerald-500 mb-1" />}
          {zone.type === 'square' && <Square className="w-8 h-8 text-indigo-500 mb-1" />}
          {zone.type === 'triangle' && <Triangle className="w-8 h-8 text-amber-500 mb-1" />}
          <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">
            {zone.label}
          </span>
        </div>
      ))}

      {/* Draggable Items */}
      {items.map((item) => (
        <div
          key={item.id}
          onPointerDown={(e) => handlePointerDown(item, e)}
          style={{
            position: 'absolute',
            left: `${item.currentX}px`,
            top: `${item.currentY}px`,
            width: '72px',
            height: '72px',
            touchAction: 'none',
          }}
          className={`cursor-grab active:cursor-grabbing rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br shadow-md transition-shadow ${item.color} ${
            item.isDragging ? 'scale-110 shadow-2xl z-40' : 'z-20 hover:scale-105'
          } ${item.isMatched ? 'opacity-85 pointer-events-none' : ''}`}
        >
          {item.type === 'circle' && <Circle className="w-7 h-7 fill-current/30" />}
          {item.type === 'square' && <Square className="w-7 h-7 fill-current/30" />}
          {item.type === 'triangle' && <Triangle className="w-7 h-7 fill-current/30" />}
          <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
          {item.isMatched && (
            <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      ))}

      {/* Helper Footer */}
      <div className="z-10 text-center text-xs text-slate-400 pointer-events-none">
        Tip: No sueltes el botón hasta que el elemento esté centrado en el receptor punteado.
      </div>
    </div>
  );
};
