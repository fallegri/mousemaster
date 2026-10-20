import { KeyboardSong, RhythmNote, TypingLesson } from '../types';

// Helper to generate rhythmic notes for a song based on BPM, rhythm patterns, and hand layout
function generateSongNotes(
  bpm: number,
  durationSec: number,
  laneKeys: string[],
  density: 'low' | 'medium' | 'high',
  handLayout: '4-keys' | '8-keys-bimanual' = '4-keys'
): RhythmNote[] {
  const notes: RhythmNote[] = [];
  const maxDuration = Math.min(durationSec, 120); // 2 minutes maximum
  const beat = 60 / bpm;
  const step = density === 'low' ? beat : density === 'medium' ? beat * 0.75 : beat * 0.5;

  let idCounter = 0;
  let lastHand: 'left' | 'right' = 'left';
  let previousLane = -1;

  for (let t = 2.0; t < maxDuration - 1.5; t += step) {
    let lane = 0;

    if (handLayout === '8-keys-bimanual') {
      // Natural typing cadence:
      // Alternating hands (Left -> Right -> Left) or occasional short combo in same hand
      const switchHand = Math.random() > 0.35;
      const currentHand: 'left' | 'right' = switchHand ? (lastHand === 'left' ? 'right' : 'left') : lastHand;
      lastHand = currentHand;

      if (currentHand === 'left') {
        // Lanes 0, 1, 2, 3 (A, S, D, F)
        let candidate = Math.floor(Math.random() * 4);
        if (candidate === previousLane && Math.random() > 0.4) {
          candidate = (candidate + 1) % 4;
        }
        lane = candidate;
      } else {
        // Lanes 4, 5, 6, 7 (J, K, L, Ñ)
        let candidate = 4 + Math.floor(Math.random() * 4);
        if (candidate === previousLane && Math.random() > 0.4) {
          candidate = 4 + ((candidate - 4 + 1) % 4);
        }
        lane = candidate;
      }
    } else {
      // 4 lanes: pick smooth transitions
      let candidate = Math.floor(Math.random() * laneKeys.length);
      if (candidate === previousLane && Math.random() > 0.3) {
        candidate = (candidate + 1) % laneKeys.length;
      }
      lane = candidate;
    }

    previousLane = lane;

    notes.push({
      id: `n_${idCounter++}`,
      time: Number(t.toFixed(2)),
      lane,
      key: laneKeys[lane],
    });

    // Occasional alternating fast tap simulating word syllables
    if ((density === 'medium' || density === 'high') && Math.random() > 0.72 && t + step * 0.5 < maxDuration - 1.5) {
      let secondLane = 0;
      if (handLayout === '8-keys-bimanual') {
        // Fast reply from opposite hand (e.g. left hand vowel then right hand consonant)
        secondLane = lane < 4 ? 4 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 4);
      } else {
        secondLane = (lane + 2) % laneKeys.length;
      }

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
  // --- FASE 1: 4 TECLAS FOCALES (Niveles 1 a 4) ---
  {
    id: 'song_lvl_1_home_index',
    levelNumber: 1,
    title: 'Lofi Digital Chill',
    artist: 'MasterSkills Studio (Libre de Derechos)',
    bpm: 85,
    duration: 120, // 2 minutos exactos
    difficulty: 'easy',
    genre: 'lofi',
    coverGradient: 'from-blue-600 via-indigo-600 to-purple-700',
    laneKeys: ['D', 'F', 'J', 'K'],
    handLayout: '4-keys',
    leftHandKeys: ['D', 'F'],
    rightHandKeys: ['J', 'K'],
    categoryLabel: 'Fila Guía Básica',
    descriptionTip: 'Dedos índices y medios sobre los relieves F y J. Ritmo sereno para dominar el reposo base.',
    audioSynthType: 'lofi',
    notes: generateSongNotes(85, 120, ['D', 'F', 'J', 'K'], 'low', '4-keys'),
  },
  {
    id: 'song_lvl_2_home_outer',
    levelNumber: 2,
    title: 'Groove Home Row',
    artist: 'Soul Rhythmics (Libre de Derechos)',
    bpm: 102,
    duration: 120,
    difficulty: 'easy',
    genre: 'synthwave',
    coverGradient: 'from-teal-600 via-emerald-600 to-indigo-700',
    laneKeys: ['A', 'S', 'L', 'Ñ'],
    handLayout: '4-keys',
    leftHandKeys: ['A', 'S'],
    rightHandKeys: ['L', 'Ñ'],
    categoryLabel: 'Fila Guía Extrema',
    descriptionTip: 'Entrena los dedos anulares y meñiques en los límites de la fila guía sin mover las muñecas.',
    audioSynthType: 'synthwave',
    notes: generateSongNotes(102, 120, ['A', 'S', 'L', 'Ñ'], 'low', '4-keys'),
  },
  {
    id: 'song_lvl_3_top_inner',
    levelNumber: 3,
    title: 'Neon Highway 1984',
    artist: 'Cyber Runner (Libre de Derechos)',
    bpm: 118,
    duration: 120,
    difficulty: 'normal',
    genre: 'synthwave',
    coverGradient: 'from-fuchsia-600 via-pink-600 to-amber-500',
    laneKeys: ['E', 'R', 'U', 'I'],
    handLayout: '4-keys',
    leftHandKeys: ['E', 'R'],
    rightHandKeys: ['U', 'I'],
    categoryLabel: 'Fila Superior Central',
    descriptionTip: 'Extensión natural hacia arriba (fila QWERTY) regresando de inmediato a la base.',
    audioSynthType: 'synthwave',
    notes: generateSongNotes(118, 120, ['E', 'R', 'U', 'I'], 'medium', '4-keys'),
  },
  {
    id: 'song_lvl_4_bottom_inner',
    levelNumber: 4,
    title: 'Pixel Quest 8-Bit',
    artist: 'Chiptune Hero (Libre de Derechos)',
    bpm: 128,
    duration: 120,
    difficulty: 'normal',
    genre: 'chiptune',
    coverGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    laneKeys: ['C', 'V', 'M', 'N'],
    handLayout: '4-keys',
    leftHandKeys: ['C', 'V'],
    rightHandKeys: ['M', 'N'],
    categoryLabel: 'Fila Inferior Central',
    descriptionTip: 'Flexión descendente táctil hacia las consonantes centrales inferiores.',
    audioSynthType: 'chiptune',
    notes: generateSongNotes(128, 120, ['C', 'V', 'M', 'N'], 'medium', '4-keys'),
  },

  // --- FASE 2: 8 TECLAS BIMANUALES COMPLETAS (Niveles 5 a 8) ---
  {
    id: 'song_lvl_5_home_8k',
    levelNumber: 5,
    title: 'Cyber Pulse 8K',
    artist: 'Hexa Beats (Libre de Derechos)',
    bpm: 120,
    duration: 120,
    difficulty: 'normal',
    genre: 'synthwave',
    coverGradient: 'from-cyan-600 via-blue-600 to-purple-800',
    laneKeys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Ñ'],
    handLayout: '8-keys-bimanual',
    leftHandKeys: ['A', 'S', 'D', 'F'],
    rightHandKeys: ['J', 'K', 'L', 'Ñ'],
    categoryLabel: 'Bimanual: Fila Guía Completa',
    descriptionTip: '8 dedos en acción simultánea (4 por mano). Autopista dividida en bloque izquierdo y derecho.',
    audioSynthType: 'synthwave',
    notes: generateSongNotes(120, 120, ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Ñ'], 'medium', '8-keys-bimanual'),
  },
  {
    id: 'song_lvl_6_top_8k',
    levelNumber: 6,
    title: 'Skyline Synthetics',
    artist: 'Aero Drive (Libre de Derechos)',
    bpm: 132,
    duration: 120,
    difficulty: 'hard',
    genre: 'chiptune',
    coverGradient: 'from-violet-600 via-indigo-600 to-cyan-500',
    laneKeys: ['Q', 'W', 'E', 'R', 'U', 'I', 'O', 'P'],
    handLayout: '8-keys-bimanual',
    leftHandKeys: ['Q', 'W', 'E', 'R'],
    rightHandKeys: ['U', 'I', 'O', 'P'],
    categoryLabel: 'Bimanual: Fila Superior QWERTY',
    descriptionTip: 'Dominio completo de las teclas superiores. Coordinación bimanual a 132 BPM.',
    audioSynthType: 'chiptune',
    notes: generateSongNotes(132, 120, ['Q', 'W', 'E', 'R', 'U', 'I', 'O', 'P'], 'medium', '8-keys-bimanual'),
  },
  {
    id: 'song_lvl_7_cross_words',
    levelNumber: 7,
    title: 'Velocity Rush 145',
    artist: 'Overdrive Beats (Libre de Derechos)',
    bpm: 145,
    duration: 120,
    difficulty: 'hard',
    genre: 'techno',
    coverGradient: 'from-violet-700 via-red-600 to-orange-500',
    laneKeys: ['A', 'W', 'E', 'F', 'J', 'I', 'O', 'Ñ'],
    handLayout: '8-keys-bimanual',
    leftHandKeys: ['A', 'W', 'E', 'F'],
    rightHandKeys: ['J', 'I', 'O', 'Ñ'],
    categoryLabel: 'Bimanual: Fluidez de Palabras',
    descriptionTip: 'Combina Fila Guía y Superior emulando raíces y sílabas reales de escritura fluida.',
    audioSynthType: 'techno',
    notes: generateSongNotes(145, 120, ['A', 'W', 'E', 'F', 'J', 'I', 'O', 'Ñ'], 'high', '8-keys-bimanual'),
  },
  {
    id: 'song_lvl_8_master_3rows',
    levelNumber: 8,
    title: 'Hyper Cosmic Drill',
    artist: 'Speed Core Labs (Libre de Derechos)',
    bpm: 155,
    duration: 120,
    difficulty: 'hard',
    genre: 'techno',
    coverGradient: 'from-rose-600 via-purple-700 to-amber-500',
    laneKeys: ['Z', 'X', 'D', 'F', 'J', 'K', 'M', 'P'],
    handLayout: '8-keys-bimanual',
    leftHandKeys: ['Z', 'X', 'D', 'F'],
    rightHandKeys: ['J', 'K', 'M', 'P'],
    categoryLabel: 'Bimanual: Desafío Master Total',
    descriptionTip: 'Coordinación tridimensional a través de las 3 filas del teclado con las dos manos.',
    audioSynthType: 'techno',
    notes: generateSongNotes(155, 120, ['Z', 'X', 'D', 'F', 'J', 'K', 'M', 'P'], 'high', '8-keys-bimanual'),
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
