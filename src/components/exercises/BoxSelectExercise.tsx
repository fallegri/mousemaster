import React, { useState, useEffect, useRef } from 'react';
import { tracker } from '../../utils/motionTracker';
import { sound } from '../../utils/sound';
import { ExerciseMetrics } from '../../types';
import { Gem, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SelectableNode {
  id: string;
  type: 'target' | 'hazard';
  x: number;
  y: number;
  radius: number;
  isSelected: boolean;
}

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface Props {
  difficultyFactor: number;
  mode: 'campaign' | 'free_practice';
  onComplete: (metrics: ExerciseMetrics) => void;
  onLiveUpdate?: (stats: { current: number; total: number; score: number }) => void;
}

export const BoxSelectExercise: React.FC<Props> = ({
  difficultyFactor,
  mode,
  onComplete,
  onLiveUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalRoundsGoal = mode === 'campaign' ? 4 : 8;
  const [currentRound, setCurrentRound] = useState(0);
  const [nodes, setNodes] = useState<SelectableNode[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  const startTimeRef = useRef(performance.now());

  // Generate cluster of target gems and obstacle hazards
  const initRound = (roundIdx: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const margin = 80;

    const targetCount = 3 + Math.min(3, Math.floor(difficultyFactor));
    const hazardCount = 2 + Math.min(3, Math.floor(difficultyFactor * 1.5));

    const newNodes: SelectableNode[] = [];

    // Cluster targets loosely in one subregion
    const clusterCenterX = margin + Math.random() * (rect.width - margin * 2);
    const clusterCenterY = margin + Math.random() * (rect.height - margin * 2);

    for (let i = 0; i < targetCount; i++) {
      const offsetX = (Math.random() - 0.5) * 160;
      const offsetY = (Math.random() - 0.5) * 160;
      newNodes.push({
        id: `target-${roundIdx}-${i}`,
        type: 'target',
        x: Math.max(margin, Math.min(rect.width - margin, clusterCenterX + offsetX)),
        y: Math.max(margin, Math.min(rect.height - margin, clusterCenterY + offsetY)),
        radius: 20,
        isSelected: false,
      });
    }

    // Place hazards around the cluster
    for (let i = 0; i < hazardCount; i++) {
      const angle = (i / hazardCount) * Math.PI * 2;
      const distance = 130 + Math.random() * 40;
      newNodes.push({
        id: `hazard-${roundIdx}-${i}`,
        type: 'hazard',
        x: Math.max(margin, Math.min(rect.width - margin, clusterCenterX + Math.cos(angle) * distance)),
        y: Math.max(margin, Math.min(rect.height - margin, clusterCenterY + Math.sin(angle) * distance)),
        radius: 18,
        isSelected: false,
      });
    }

    setNodes(newNodes);
    setFeedback('Haz clic y arrastra para dibujar un recuadro que atrape solo las gemas azules');
  };

  useEffect(() => {
    tracker.reset();
    startTimeRef.current = performance.now();
    setCurrentRound(0);
    setScore(0);
    const t = setTimeout(() => initRound(0), 150);
    return () => clearTimeout(t);
  }, [difficultyFactor, mode]);

  // Pointer down initiates selection box
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelectionBox({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
    sound.playClick(600);
  };

  // Pointer move expands selection box and updates highlighted nodes
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    tracker.addSample(e.clientX, e.clientY);

    if (selectionBox && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const minX = Math.min(selectionBox.startX, currentX);
      const maxX = Math.max(selectionBox.startX, currentX);
      const minY = Math.min(selectionBox.startY, currentY);
      const maxY = Math.max(selectionBox.startY, currentY);

      // Check which nodes are enclosed in selection rectangle
      setNodes((prev) =>
        prev.map((node) => {
          const isInside =
            node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY;
          return { ...node, isSelected: isInside };
        })
      );

      setSelectionBox({
        ...selectionBox,
        currentX,
        currentY,
      });
    }
  };

  // Pointer up confirms selection
  const handlePointerUp = () => {
    if (!selectionBox) return;

    const selectedTargets = nodes.filter((n) => n.type === 'target' && n.isSelected);
    const totalTargets = nodes.filter((n) => n.type === 'target').length;
    const selectedHazards = nodes.filter((n) => n.type === 'hazard' && n.isSelected);

    // Evaluate capture result
    if (selectedTargets.length === totalTargets && selectedHazards.length === 0) {
      // Perfect selection!
      sound.playHit(1.2);
      tracker.registerTargetHit();
      const points = 100;
      const nextScore = score + points;
      setScore(nextScore);
      setFeedback('¡Excelente selección por caja limpia!');

      const nextRound = currentRound + 1;
      if (onLiveUpdate) {
        onLiveUpdate({ current: nextRound, total: totalRoundsGoal, score: nextScore });
      }

      if (nextRound >= totalRoundsGoal) {
        setSelectionBox(null);
        const durationSeconds = (performance.now() - startTimeRef.current) / 1000;
        const summary = tracker.getSummary(
          totalRoundsGoal,
          totalRoundsGoal,
          durationSeconds,
          difficultyFactor
        );
        onComplete({
          moduleName: 'box-select',
          moduleTitle: 'Selección por Caja y Lazo',
          mode,
          score: nextScore,
          ...summary,
        });
      } else {
        setCurrentRound(nextRound);
        setSelectionBox(null);
        setTimeout(() => initRound(nextRound), 450);
      }
    } else if (selectedHazards.length > 0) {
      // Included an obstacle
      sound.playMiss();
      tracker.registerMissedClick();
      setFeedback('¡Cuidado! Tu recuadro atrapó obstáculos rojos. Dibuja un marco más ajustado.');
      setSelectionBox(null);
      // Reset selected states
      setNodes((prev) => prev.map((n) => ({ ...n, isSelected: false })));
    } else {
      // Incomplete target capture
      sound.playMiss();
      tracker.registerMissedClick();
      setFeedback(`Atrapaste ${selectedTargets.length} de ${totalTargets} gemas. ¡Amplía el recuadro!`);
      setSelectionBox(null);
      setNodes((prev) => prev.map((n) => ({ ...n, isSelected: false })));
    }
  };

  // Calculate box dimensions for rendering
  const boxLeft = selectionBox ? Math.min(selectionBox.startX, selectionBox.currentX) : 0;
  const boxTop = selectionBox ? Math.min(selectionBox.startY, selectionBox.currentY) : 0;
  const boxWidth = selectionBox ? Math.abs(selectionBox.currentX - selectionBox.startX) : 0;
  const boxHeight = selectionBox ? Math.abs(selectionBox.currentY - selectionBox.startY) : 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full max-h-full bg-slate-100/70 border border-slate-200 rounded-2xl overflow-hidden cursor-crosshair select-none flex flex-col justify-between p-3 sm:p-4"
    >
      {/* Top Banner */}
      <div className="z-20 flex items-center justify-between text-xs text-slate-500 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-slate-800">Misión:</span>
          <span>
            Rodea las gemas con la caja de selección (Ronda {currentRound + 1}/{totalRoundsGoal})
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-mono tabular-nums text-slate-700">
          Puntos: <span className="font-bold text-slate-900">{score}</span>
        </div>
      </div>

      {/* Render Selectable Nodes */}
      {nodes.map((node) => {
        const isTarget = node.type === 'target';
        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${node.radius * 2}px`,
              height: `${node.radius * 2}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`rounded-full flex items-center justify-center transition-all ${
              isTarget
                ? node.isSelected
                  ? 'bg-blue-600 text-white scale-120 ring-4 ring-blue-300 shadow-md'
                  : 'bg-blue-100 border-2 border-blue-400 text-blue-600'
                : node.isSelected
                ? 'bg-red-600 text-white scale-110 ring-4 ring-red-300 shadow-md'
                : 'bg-red-50 border-2 border-red-300 text-red-500'
            }`}
          >
            {isTarget ? (
              <Gem className="w-5 h-5 fill-current/30" />
            ) : (
              <AlertTriangle className="w-4 h-4 fill-current/30" />
            )}
          </div>
        );
      })}

      {/* Selection Marquee Box */}
      {selectionBox && boxWidth > 3 && boxHeight > 3 && (
        <div
          style={{
            position: 'absolute',
            left: `${boxLeft}px`,
            top: `${boxTop}px`,
            width: `${boxWidth}px`,
            height: `${boxHeight}px`,
          }}
          className="border-2 border-indigo-500 bg-indigo-500/15 pointer-events-none rounded-md z-30"
        />
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="z-20 self-center bg-slate-900/90 text-white px-4 py-1.5 rounded-lg text-xs shadow-md backdrop-blur pointer-events-none">
          {feedback}
        </div>
      )}

      {/* Helper Footer */}
      <div className="z-20 text-center text-xs text-slate-400 pointer-events-none">
        Tip: Haz clic en una esquina despejada, mantén pulsado y arrastra hacia la esquina opuesta.
      </div>
    </div>
  );
};
