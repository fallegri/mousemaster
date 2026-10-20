import { KeyboardSong, RhythmNote, TypingLesson } from '../types';

// Helper to generate rhythmic notes for a song based on BPM and rhythm patterns
function generateSongNotes(
  bpm: number,
  durationSec: number,
  laneKeys: string[],
  density: 'low' | 'medium' | 'high'
): RhythmNote[] {
  const notes: RhythmNote[] = [];
  const beat = 60 / bpm;
  const step = density === 'low' ? beat : density === 'medium' ? beat * 0.75 : beat * 0.5;

  let currentLane = 0;
  let idCounter = 0;

  for (let t = 2.0; t < durationSec - 1.5; t += step) {
    // Add variations: occasional double-lane chord or alternations
    const lane = (currentLane + Math.floor(Math.random() * 3) + 1) % laneKeys.length;
    currentLane = lane;

    notes.push({
      id: `n_${idCounter++}`,
      time: Number(t.toFixed(2)),
      lane,
      key: laneKeys[lane],
    });

    // On high density, occasionally add alternating quick tap
    if (density === 'high' && Math.random() > 0.65 && t + step * 0.5 < durationSec - 1.5) {
      const secondLane = (lane + 2) % laneKeys.length;
      notes.push({
        id: `n_${idCounter++}`,
        time: Number((t + step * 0.5).toFixed(2)),
        lane: secondLane,
        key: laneKeys[secondLane],
      });
    }
  }

  return notes;
}

export const PRESET_SONGS: KeyboardSong[] = [
  {
    id: 'song_lofi_intro',
    title: 'Lofi Digital Chill',
    artist: 'MasterSkills Studio (Libre de Derechos)',
    bpm: 85,
    duration: 38,
    difficulty: 'easy',
    genre: 'lofi',
    coverGradient: 'from-blue-600 via-indigo-600 to-purple-700',
    laneKeys: ['D', 'F', 'J', 'K'],
    audioSynthType: 'lofi',
    notes: generateSongNotes(85, 38, ['D', 'F', 'J', 'K'], 'low'),
  },
  {
    id: 'song_synth_highway',
    title: 'Neon Highway 1984',
    artist: 'Cyber Runner (Libre de Derechos)',
    bpm: 118,
    duration: 44,
    difficulty: 'normal',
    genre: 'synthwave',
    coverGradient: 'from-fuchsia-600 via-pink-600 to-amber-500',
    laneKeys: ['D', 'F', 'J', 'K'],
    audioSynthType: 'synthwave',
    notes: generateSongNotes(118, 44, ['D', 'F', 'J', 'K'], 'medium'),
  },
  {
    id: 'song_8bit_arcade',
    title: 'Pixel Quest 8-Bit',
    artist: 'Chiptune Hero (Libre de Derechos)',
    bpm: 132,
    duration: 42,
    difficulty: 'normal',
    genre: 'chiptune',
    coverGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    laneKeys: ['D', 'F', 'J', 'K'],
    audioSynthType: 'chiptune',
    notes: generateSongNotes(132, 42, ['D', 'F', 'J', 'K'], 'medium'),
  },
  {
    id: 'song_techno_rush',
    title: 'Velocity Rush 145',
    artist: 'Overdrive Beats (Libre de Derechos)',
    bpm: 145,
    duration: 50,
    difficulty: 'hard',
    genre: 'techno',
    coverGradient: 'from-violet-700 via-red-600 to-orange-500',
    laneKeys: ['D', 'F', 'J', 'K'],
    audioSynthType: 'techno',
    notes: generateSongNotes(145, 50, ['D', 'F', 'J', 'K'], 'high'),
  },
];

export const TYPING_LESSONS: TypingLesson[] = [
  {
    id: 'lesson_home_row',
    level: 1,
    title: 'Fila Guía (Home Row)',
    subtitle: 'La base de tus dedos: A S D F - J K L Ñ',
    description: 'Aprende a posicionar los dedos índices sobre los relieves de F y J sin mirar el teclado.',
    keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Ñ'],
    words: [
      'fada', 'jala', 'soda', 'sala', 'alfa', 'faja', 'daña', 'lado', 'sello', 'falda',
      'falla', 'ajada', 'sofa', 'jaspe', 'foco', 'aldea', 'hoja', 'dado', 'silla', 'laja'
    ],
    targetWpm: 22,
    minAccuracy: 90,
  },
  {
    id: 'lesson_top_row',
    level: 2,
    title: 'Fila Superior (QWERTY)',
    subtitle: 'Alcanza las letras superiores manteniendo la posición',
    description: 'Extiende los dedos hacia arriba (Q, W, E, R, T, Y, U, I, O, P) y regresa siempre a la fila guía.',
    keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    words: [
      'puerto', 'torre', 'reloj', 'queso', 'patio', 'tierra', 'hierro', 'raton', 'teclado', 'operar',
      'tiempo', 'pique', 'riqueza', 'equipo', 'trofeo', 'quieto', 'ritmo', 'truco', 'triunfo', 'puesto'
    ],
    targetWpm: 28,
    minAccuracy: 92,
  },
  {
    id: 'lesson_bottom_row',
    level: 3,
    title: 'Fila Inferior & Coordinación',
    subtitle: 'Dominio de Z, X, C, V, B, N, M',
    description: 'Desplaza los dedos hacia abajo con precisión y suavidad para completar todas las letras.',
    keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    words: [
      'cabra', 'zorro', 'barco', 'viento', 'camino', 'bosque', 'nube', 'motor', 'conexion', 'maximo',
      'bravo', 'vecino', 'accion', 'combate', 'musica', 'vibra', 'cambio', 'brillo', 'centro', 'nuevo'
    ],
    targetWpm: 34,
    minAccuracy: 94,
  },
  {
    id: 'lesson_full_speed',
    level: 4,
    title: 'Mecanografía Aventura (Full Speed)',
    subtitle: 'Palabras completas a alta cadencia',
    description: 'Desafío estilo Mario Typing: destruye los bloques escribiendo palabras completas a máxima velocidad.',
    keys: ['A-Z'],
    words: [
      'estrella', 'velocidad', 'universo', 'destreza', 'precisión', 'aprendizaje', 'tecnologia', 'movimiento',
      'reflejos', 'coordinacion', 'entrenamiento', 'constancia', 'perfeccion', 'sincronia', 'campeon', 'desafio'
    ],
    targetWpm: 42,
    minAccuracy: 95,
  },
];
