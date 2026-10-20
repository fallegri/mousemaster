# Plan de Implementación: Módulo de Aprendizaje de Teclado y Ritmo (TypeMaster + MouseMaster)

Transformación de la aplicación en una plataforma integral de destrezas digitales dividida en dos grandes módulos accesibles desde la barra superior: **Practicar Mouse** (con los 6 ejercicios actuales, práctica libre, récords y tutor IA) y **Practicar Teclado** (con el juego de ritmo en pista descendente tipo *Beatstar / Guitar Hero* con canciones libres y subida de archivos de audio, complementado con desafíos de mecanografía activa al estilo *Mario Teaches Typing*).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario:**
> - **Estructura de Menú Principal:** Separación limpia en la cabecera entre **"Practicar Mouse"** y **"Practicar Teclado"**, permitiendo alternar sin fricción entre el ecosistema actual del ratón y el nuevo ecosistema del teclado.
> - **Prioridad de Implementación ("2 primero y luego 1"):**
>   1. **Juego de Ritmo de Teclado (Rhythm Highway / Guitar Hero style):** Pista en perspectiva con notas descendentes alineadas en columnas rítmicas hacia la línea de impacto inferior (tal como en la imagen de referencia provista). El usuario presiona las teclas físicas exactas al compás de la música.
>   2. **Desafíos Mecanográficos / Mario Teaches Typing:** Modo aventura complementario con entrenamiento guiado de filas de teclado (Home row `ASDF JKLÑ`, fila superior, fila inferior y símbolos), palabras en cascada y retroalimentación de WPM (palabras por minuto) y precisión.
> - **Música y Audio:** 
>   - **Biblioteca predeterminada:** Pistas integradas libres de derechos y sin copyright sintetizadas con Web Audio API de alta fidelidad y cadencias rítmicas (Chiptune Arcade, Synthwave 80s, Lofi Beat, EDM Rush).
>   - **Subida de canciones:** Carga de archivos locales de audio (`.mp3`, `.wav`, `.ogg`) con decodificador Web Audio y analizador espectral de picos rítmicos para generar pistas de notas al vuelo.
> - **Persistencia y Récords:** Integración directa con el sistema local y el botón "Restaurar Práctica" para limpiar o preservar récords de teclado junto con los de mouse.

---

## 1. Overview & Core Concept

La plataforma evoluciona a **MasterSkills: Mouse & Keyboard**, unificando la motricidad fina del cursor con la agilidad y precisión dactiloscópica del teclado físico.

1. **Selector de Modalidad Global:**
   - **Practicar Mouse:** Mantiene intactos los 6 niveles didácticos (Puntería, Acción/Doble Clic, Arrastre, Scroll por rueda con clics de verificación, Selección de lazo, Trazado fluido), la Práctica Libre con desafíos y el Consejero IA.
   - **Practicar Teclado:** Nueva suite completa de digitación dividida en:
     - **Ritmo & Teclas (Rhythm Highway):** Pista visual 3D/slanted con 4 carriles (D, F, J, K o configurables) o carriles dinámicos, notas luminosas cayendo al ritmo, detección de tiempo (*PERFECT*, *GREAT*, *GOOD*, *MISS*), multiplicadores de combo y efectos de partículas.
     - **Subida & Selección de Canciones:** Selector visual de pistas precargadas con preescucha, BPM y dificultad, más botón de carga de archivo de audio local con análisis de ritmo instantáneo.
     - **Mecanografía Aventura (Mario Typing Style):** Desafíos de digitación continua por palabras y caracteres con avatar reactivo, velocidad WPM y prevención de errores visual en un teclado interactivo en pantalla.
     - **Récords y Telemetría de Teclado:** Historial de mejores puntuaciones, precisión por tecla y análisis de debilidades de digitación con soporte para el tutor de IA (Nvidia Nemotron / Gemini).

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BARRA SUPERIOR GLOBAL                           │
│  [Logo MasterSkills]   [🖱️ Practicar Mouse]   [⌨️ Practicar Teclado]   │
│                        [Récords]  [Restaurar]  [Ajustes & IA]          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                          ┌──────────────────────┐
│   PRACTICAR MOUSE    │                          │  PRACTICAR TECLADO   │
│  • Misiones (1-6)    │                          │  • Ritmo & Teclas    │
│  • Práctica Libre    │                          │  • Subir Canción     │
│  • Consejero IA      │                          │  • Mecanografía      │
│  • HUD Telemetría    │                          │  • Teclado en vivo   │
└──────────────────────┘                          └──────────────────────┘
```

1. **Flujo de Juego de Ritmo (Rhythm Highway):**
   - **Pantalla de Selección de Canción:** Carátulas tipo arcade retro-moderno con información de artista, BPM, duración, nivel de dificultad (*Fácil 4 teclas*, *Medio ritmo rápido*, *Difícil polirritmia*) y botón para *Subir tu canción*.
   - **Pista de Juego (In-Game Highway):** 
     - Pista central con perspectiva y líneas de neón (cian, magenta, ámbar, esmeralda) simulando profundidad.
     - Marcadores de impacto inferiores con anillos brillantes que reaccionan al presionar la tecla física con rebote visual instantáneo.
     - Indicador flotante central de combo (`PERFECT! 12 COMBO`, `GREAT!`) y barra de vida/progreso de la canción.
     - Teclado virtual opcional en la parte inferior para que principiantes vean qué dedo corresponde a cada tecla (índice, medio, anular).
   - **Fin de Canción & Pantalla de Victoria:**
     - Calificación de estrellas (1 a 3), porcentaje de notas perfectas, puntuación máxima, racha más larga y feedback del Consejero IA (ej. "Excelente tiempo de reacción en mano izquierda, menor precisión en tecla K").

2. **Flujo de Subida de Canción Personalizada:**
   - Arrastrar o seleccionar un archivo de audio (`.mp3`, `.wav`).
   - El sistema analiza la forma de onda mediante `AudioContext.decodeAudioData` y un detector de transitorios/picos rítmicos (`OfflineAudioContext`).
   - Genera automáticamente los tiempos de las notas sincronizadas con los golpes fuertes de la canción.
   - Permite jugar inmediatamente con la música favorita del usuario sin enviar el archivo a ningún servidor (100% privado y seguro en el navegador).

3. **Flujo de Mecanografía Aventura (Mario Teaches Typing Mode):**
   - El usuario practica combinaciones de letras progresivas (fila guía, palabras completas, oraciones).
   - Las palabras avanzan por la pantalla; cada pulsación correcta destruye un obstáculo o hace avanzar al personaje.

### Visual Identity & Theme
- **Pista de Ritmo:** Inspirada en la interfaz provista (estilo *Beatstar / Guitar Hero*): fondo oscuro espacial `#0b0f19` con haces de luz de neón cian (`#06b6d4`), violeta eléctrico (`#8b5cf6`) y rosa neón (`#ec4899`).
- **Feedback Háptico Visual:** Anillos de pulso expansivos en las teclas al acertar, sacudida sutil de pantalla en fallos y destellos de partículas sintetizados en canvas ligero.
- **Tipografía:** Números de combo y puntuación en fuente monoespaciada `tabular-nums` de gran visibilidad para evitar saltos de pantalla.

---

## 3. Key Product Decisions & Trade-Offs

### A. Motor de Audio y Detección de Ritmo
- **Decisión:** Implementar un sintetizador de música procedural de alta calidad con Web Audio API para las canciones predeterminadas, junto con un analizador de envolvente espectral en cliente para las canciones subidas por el usuario.
- **Razón:** Cero problemas de copyright, tiempos de carga instantáneos (0 KB de descargas externas), latencia de audio inferior a 10 ms y compatibilidad total sin requerir almacenamiento en la nube ni servicios de terceros.

### B. Distribución de Teclas y Ergonomía
- **Decisión:** Configuración estándar en fila base (`D`, `F`, `J`, `K` o `A`, `S`, `K`, `L`) con posibilidad de modo adaptativo (2 teclas para niños/principiantes, 4 teclas para intermedios, y modo teclado completo `A-Z` para práctica de mecanografía).
- **Razón:** Cumple el principio de ergonomía universal y permite que usuarios de cualquier edad o destreza jueguen cómodamente con ambas manos.

### C. Coexistencia con el Módulo de Mouse
- **Decisión:** Barra de navegación superior con conmutador prominente de pestaña principal: `[🖱️ Practicar Mouse]` y `[⌨️ Practicar Teclado]`.
- **Razón:** Mantiene el 100% de la funcionalidad actual del mouse sin sobrecargar la pantalla, organizando la aplicación como una suite de habilidades digitales de nivel profesional.

---

## 4. Technical Architecture & Component Hierarchy

```
src/
├── components/
│   ├── Header.tsx                   # Selector global: 'mouse' | 'keyboard'
│   │
│   ├── keyboard/
│   │   ├── KeyboardHub.tsx          # Vista principal de teclado: selector de canciones y modos
│   │   ├── RhythmHighwayGame.tsx    # Pista de ritmo interactiva (Falling Notes Engine)
│   │   ├── SongSelectorModal.tsx    # Selector de canciones (Preset + Carga de MP3/WAV)
│   │   ├── TypingAdventureGame.tsx  # Modo aventura de mecanografía (estilo Mario Typing)
│   │   ├── VirtualKeyboardGuide.tsx # Guía visual de dedos y teclas presionadas
│   │   └── KeyboardScoreModal.tsx   # Resumen de partida, combo, estrellas y consejo IA
│   │
│   └── exercises/                   # Ejercicios de mouse existentes (intactos)
│
└── utils/
    ├── rhythmEngine.ts              # Generador de notas, sincronización de BPM y detección de picos
    ├── audioAnalyzer.ts             # Decodificador de MP3/WAV local a eventos rítmicos
    ├── keyboardTracker.ts           # Telemetría de pulsaciones, precisión, WPM y errores frecuentes
    └── sound.ts                     # Efectos de sonido y sintetizador de canciones libres
```

### State Mapping & Interactive Handlers
- `mainAppMode`: `'mouse' | 'keyboard'`.
- `keyboardSubMode`: `'rhythm' | 'typing_adventure' | 'records'`.
- `currentSong`: Objeto con `title`, `artist`, `bpm`, `difficulty`, `audioBuffer` o `synthPattern`, y `noteEvents`.
- `rhythmState`: `score`, `combo`, `maxCombo`, `hits: { perfect, great, good, miss }`, `streakMultiplier`.
- `keydown` Listener: Intercepta teclas en tiempo real (`e.code` / `e.key`), compara con la ventana de tiempo de la nota activa (±45ms = Perfect, ±90ms = Great, ±150ms = Good, >150ms = Miss), reproduce el golpe sonoro y actualiza el combo.

---

## 5. Verification & Testing Plan

1. **Verificación de Navegación:** Comprobar que alternar entre "Practicar Mouse" y "Practicar Teclado" conserve el estado y los récords de ambos entornos.
2. **Prueba de Pista de Ritmo:** Ejecutar una pista predeterminada, verificar caída suave a 60 FPS, respuesta instantánea de las teclas `D`, `F`, `J`, `K`, acumulación de combos y sonidos de impacto.
3. **Prueba de Carga de Canción:** Probar subir un archivo `.mp3`/`.wav`, verificar que se decodifique correctamente y genere notas sincronizadas con el compás.
4. **Prueba de Modo Mecanografía:** Validar digitación continua de letras y oraciones, cálculo de WPM y registro de teclas problemáticas.
5. **Prueba de Limpieza (Restaurar Práctica):** Confirmar que el botón de restaurar práctica reinicie adecuadamente tanto los récords de mouse como los de teclado.
6. **Compilación y Build:** Ejecutar `compile_applet` para garantizar cero errores de TypeScript y empaquetado para Vercel.
