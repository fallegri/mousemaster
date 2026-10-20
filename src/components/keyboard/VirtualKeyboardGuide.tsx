import React from 'react';

interface Props {
  activeKeys?: string[];
  pressedKey?: string | null;
  compact?: boolean;
}

interface KeyConfig {
  label: string;
  code: string;
  finger: 'L_pinky' | 'L_ring' | 'L_middle' | 'L_index' | 'R_index' | 'R_middle' | 'R_ring' | 'R_pinky' | 'thumb';
  width?: string;
}

const FINGER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  L_pinky: { bg: 'bg-rose-500/15', text: 'text-rose-600', border: 'border-rose-400/40', glow: 'shadow-rose-500/30' },
  L_ring: { bg: 'bg-amber-500/15', text: 'text-amber-600', border: 'border-amber-400/40', glow: 'shadow-amber-500/30' },
  L_middle: { bg: 'bg-emerald-500/15', text: 'text-emerald-600', border: 'border-emerald-400/40', glow: 'shadow-emerald-500/30' },
  L_index: { bg: 'bg-cyan-500/15', text: 'text-cyan-600', border: 'border-cyan-400/40', glow: 'shadow-cyan-500/30' },
  R_index: { bg: 'bg-blue-500/15', text: 'text-blue-600', border: 'border-blue-400/40', glow: 'shadow-blue-500/30' },
  R_middle: { bg: 'bg-indigo-500/15', text: 'text-indigo-600', border: 'border-indigo-400/40', glow: 'shadow-indigo-500/30' },
  R_ring: { bg: 'bg-purple-500/15', text: 'text-purple-600', border: 'border-purple-400/40', glow: 'shadow-purple-500/30' },
  R_pinky: { bg: 'bg-pink-500/15', text: 'text-pink-600', border: 'border-pink-400/40', glow: 'shadow-pink-500/30' },
  thumb: { bg: 'bg-slate-500/15', text: 'text-slate-600', border: 'border-slate-400/40', glow: 'shadow-slate-500/30' },
};

const KEYBOARD_ROWS: KeyConfig[][] = [
  // Row 1: Numbers
  [
    { label: '1', code: 'Digit1', finger: 'L_pinky' },
    { label: '2', code: 'Digit2', finger: 'L_ring' },
    { label: '3', code: 'Digit3', finger: 'L_middle' },
    { label: '4', code: 'Digit4', finger: 'L_index' },
    { label: '5', code: 'Digit5', finger: 'L_index' },
    { label: '6', code: 'Digit6', finger: 'R_index' },
    { label: '7', code: 'Digit7', finger: 'R_index' },
    { label: '8', code: 'Digit8', finger: 'R_middle' },
    { label: '9', code: 'Digit9', finger: 'R_ring' },
    { label: '0', code: 'Digit0', finger: 'R_pinky' },
  ],
  // Row 2: Top Row
  [
    { label: 'Q', code: 'KeyQ', finger: 'L_pinky' },
    { label: 'W', code: 'KeyW', finger: 'L_ring' },
    { label: 'E', code: 'KeyE', finger: 'L_middle' },
    { label: 'R', code: 'KeyR', finger: 'L_index' },
    { label: 'T', code: 'KeyT', finger: 'L_index' },
    { label: 'Y', code: 'KeyY', finger: 'R_index' },
    { label: 'U', code: 'KeyU', finger: 'R_index' },
    { label: 'I', code: 'KeyI', finger: 'R_middle' },
    { label: 'O', code: 'KeyO', finger: 'R_ring' },
    { label: 'P', code: 'KeyP', finger: 'R_pinky' },
  ],
  // Row 3: Home Row
  [
    { label: 'A', code: 'KeyA', finger: 'L_pinky' },
    { label: 'S', code: 'KeyS', finger: 'L_ring' },
    { label: 'D', code: 'KeyD', finger: 'L_middle' },
    { label: 'F', code: 'KeyF', finger: 'L_index' },
    { label: 'G', code: 'KeyG', finger: 'L_index' },
    { label: 'H', code: 'KeyH', finger: 'R_index' },
    { label: 'J', code: 'KeyJ', finger: 'R_index' },
    { label: 'K', code: 'KeyK', finger: 'R_middle' },
    { label: 'L', code: 'KeyL', finger: 'R_ring' },
    { label: 'Ñ', code: 'KeyÑ', finger: 'R_pinky' },
  ],
  // Row 4: Bottom Row
  [
    { label: 'Z', code: 'KeyZ', finger: 'L_pinky' },
    { label: 'X', code: 'KeyX', finger: 'L_ring' },
    { label: 'C', code: 'KeyC', finger: 'L_middle' },
    { label: 'V', code: 'KeyV', finger: 'L_index' },
    { label: 'B', code: 'KeyB', finger: 'L_index' },
    { label: 'N', code: 'KeyN', finger: 'R_index' },
    { label: 'M', code: 'KeyM', finger: 'R_middle' },
  ],
];

export const VirtualKeyboardGuide: React.FC<Props> = ({
  activeKeys = [],
  pressedKey = null,
  compact = false,
}) => {
  const normActive = activeKeys.map((k) => k.toUpperCase());
  const normPressed = pressedKey ? pressedKey.toUpperCase() : null;

  return (
    <div className={`w-full max-w-2xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 p-3 shadow-xl backdrop-blur-md select-none ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Legend of Fingers */}
      <div className="flex items-center justify-between gap-2 px-2 pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Mano Izquierda: Dedo Medio (D), Índice (F)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Mano Derecha: Índice (J), Medio (K)</span>
        </div>
      </div>

      {/* Keyboard Grid */}
      <div className="flex flex-col gap-1.5 items-center">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-1 sm:gap-1.5">
            {row.map((k) => {
              const isActive = normActive.includes(k.label);
              const isPressed = normPressed === k.label || normPressed === k.code;
              const fColor = FINGER_COLORS[k.finger];
              const isHomeBump = k.label === 'F' || k.label === 'J';

              return (
                <div
                  key={k.label}
                  className={`relative flex items-center justify-center font-bold rounded-lg transition-all duration-75 select-none ${
                    compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 sm:w-11 sm:h-11 text-xs sm:text-sm'
                  } ${
                    isPressed
                      ? 'bg-amber-400 text-slate-950 scale-95 shadow-lg shadow-amber-400/50 ring-2 ring-amber-300'
                      : isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40 border border-indigo-400 scale-105'
                      : `${fColor.bg} ${fColor.text} border ${fColor.border} opacity-85 hover:opacity-100`
                  }`}
                >
                  <span>{k.label}</span>
                  {/* Relief indicator for F and J */}
                  {isHomeBump && (
                    <span className="absolute bottom-1 w-2.5 h-0.5 bg-slate-300/80 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Spacebar */}
        <div className="flex items-center justify-center mt-1">
          <div
            className={`h-7 sm:h-8 w-48 sm:w-64 rounded-lg border border-slate-700/80 bg-slate-800/60 flex items-center justify-center text-[10px] text-slate-400 font-mono tracking-widest ${
              normPressed === ' ' || normPressed === 'SPACE' ? 'bg-amber-400 text-slate-950 scale-98 ring-2 ring-amber-300' : ''
            }`}
          >
            ESPACIO (PULGARES)
          </div>
        </div>
      </div>
    </div>
  );
};
