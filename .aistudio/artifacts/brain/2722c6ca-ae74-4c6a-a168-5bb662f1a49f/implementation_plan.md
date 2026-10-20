# Plan de Implementación Revisado: Niveles Bimanuales de 4 y 8 Teclas & Límite de 2 Minutos

## 1. Visión General
Evolucionar el juego de ritmo hacia una experiencia mecanográfica inmersiva:
1. **Niveles Iniciales (4 Teclas):** Entrenamiento focalizado de dedos clave (2 en cada mano).
2. **Niveles Avanzados (8 Teclas Bimanuales):** 4 teclas en la mano izquierda y 4 en la mano derecha, recreando la posición completa de mecanografía y el flujo natural de escribir palabras.
3. **Autopista Adaptativa de 8 Columnas:** Renderizado dividido en bloque izquierdo (Mano Izquierda) y bloque derecho (Mano Derecha) con canal central neón y colores ergonómicos para cada mano.
4. **Límite Estricto de 2 Minutos (120 s):** La ronda concluye a los 120 segundos (o antes si la canción dura menos), aplicable tanto a canciones integradas como a archivos MP3/WAV subidos.

---

## 2. Estructura de Progresión de Niveles (8 Niveles)

### Fase 1: Fundamentos Táctiles (4 Teclas Focales - 2 por mano)
* **Nivel 1: Fila Guía Inicial (Índices y Medios)**
  * **Tema:** *Lofi Digital Chill* (85 BPM)
  * **Teclas:** `['D', 'F', 'J', 'K']` (Mano Izq: D, F | Mano Der: J, K)
  * **Objetivo:** Sentir los relieves guía de F y J con ritmo relajado.
* **Nivel 2: Fila Guía Extrema (Meñiques y Anulares)**
  * **Tema:** *Groove Home Row* (102 BPM)
  * **Teclas:** `['A', 'S', 'L', 'Ñ']` (Mano Izq: A, S | Mano Der: L, Ñ)
  * **Objetivo:** Fortalecer los dedos exteriores menos usados.
* **Nivel 3: Fila Superior Interior (Extensión Natural)**
  * **Tema:** *Neon Highway 1984* (118 BPM)
  * **Teclas:** `['E', 'R', 'U', 'I']` (Mano Izq: E, R | Mano Der: U, I)
  * **Objetivo:** Subir desde la fila guía manteniendo la orientación táctil.
* **Nivel 4: Fila Inferior Interior (Flexión Táctil)**
  * **Tema:** *Pixel Quest 8-Bit* (128 BPM)
  * **Teclas:** `['C', 'V', 'M', 'N']` (Mano Izq: C, V | Mano Der: M, N)
  * **Objetivo:** Descender a la fila inferior con los dedos índices y medios.

### Fase 2: Maestría Bimanual (8 Teclas - 4 Mano Izquierda + 4 Mano Derecha)
* **Nivel 5: Fila Guía Completa Bimanual (Home Row 8K)**
  * **Tema:** *Cyber Pulse 8K* (120 BPM)
  * **Teclas:** `['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Ñ']`
  * **Mano Izquierda (4):** `A` (meñique), `S` (anular), `D` (medio), `F` (índice)
  * **Mano Derecha (4):** `J` (índice), `K` (medio), `L` (anular), `Ñ` (meñique)
  * **Dinámica:** Caída alternada y combinada simulando tipeo fluido bimanual.
* **Nivel 6: Fila Superior Completa Bimanual (QWERTY 8K)**
  * **Tema:** *Skyline Synthetics* (132 BPM)
  * **Teclas:** `['Q', 'W', 'E', 'R', 'U', 'I', 'O', 'P']`
  * **Mano Izquierda (4):** `Q`, `W`, `E`, `R`
  * **Mano Derecha (4):** `U`, `I`, `O`, `P`
  * **Dinámica:** Extensión coordinada completa de todos los dedos.
* **Nivel 7: Fluidez Natural Bimanual (Palabras y Filas Combinadas)**
  * **Tema:** *Velocity Rush 145* (145 BPM)
  * **Teclas:** `['A', 'W', 'E', 'F', 'J', 'I', 'O', 'Ñ']`
  * **Mano Izquierda (4):** `A`, `W`, `E`, `F`
  * **Mano Derecha (4):** `J`, `I`, `O`, `Ñ`
  * **Dinámica:** Patrones que forman raíces frecuentes de palabras del español/inglés ("we", "on", "ai", "safe", "fiel").
* **Nivel 8: Desafío Master Bimanual (3 Filas Integradas)**
  * **Tema:** *Hyper Cosmic Drill* (155 BPM)
  * **Teclas:** `['Z', 'X', 'D', 'F', 'J', 'K', 'M', 'P']`
  * **Mano Izquierda (4):** `Z`, `X`, `D`, `F`
  * **Mano Derecha (4):** `J`, `K`, `M`, `P`
  * **Dinámica:** Máxima independencia motriz y reflejos coordinados.

---

## 3. Arquitectura Visual de la Autopista (4 vs 8 Pistas)

1. **Soporte Dinámico de Carriles:**
   - Si `laneKeys.length === 4`: Autopista estándar espaciosa de 4 columnas.
   - Si `laneKeys.length === 8`: Autopista bimanual con dos bloques de 4 columnas:
     * **Bloque Izquierdo (Mano Izquierda):** Color azul/cyan/índigo con indicador superior *"Mano Izquierda"*.
     * **Separador Central Neón:** Línea divisoria luminosa vertical que ayuda al cerebro a separar el control de cada hemisferio/mano.
     * **Bloque Derecho (Mano Derecha):** Color magenta/fucsia/ámbar con indicador superior *"Mano Derecha"*.
2. **Dianas de Impacto y Feedback:**
   - Letra visible en tamaño grande y nítido en cada diana de impacto (`[A] [S] [D] [F] | [J] [K] [L] [Ñ]`).
   - Efecto visual de pulsación (iluminación del carril completo) cuando el usuario pulsa la tecla correspondiente.
   - Soporte para teclados en español (incluyendo `Ñ` y teclas estándar sin conflictos).

---

## 4. Regla de Tiempo: Límite Exacto de 2 Minutos (120 s)

1. **Duración de la Ronda:**
   - La duración activa se calcula como `Math.min(song.duration, 120)`.
   - Si el audio o sintetizador tiene mayor duración, la partida concluye con un fundido suave al llegar a los 120.0 segundos.
   - Para canciones MP3/WAV subidas por el usuario, el temporizador corta automáticamente a los 2 minutos (120 segundos).
2. **Generador de Notas Continuas:**
   - El generador algorítmico distribuirá notas hasta el segundo 118, asegurando que haya música y notas fluidas durante los 2 minutos completos sin lapsos vacíos.
3. **HUD y Cronómetro:**
   - Visualizador de tiempo restante en formato `MM:SS` (ej. `01:58 / 02:00`).
   - Barra de progreso que se llena progresivamente hasta el 100% al completar los 2 minutos.
4. **Pantalla de Resumen Final:**
   - Conteo de notas (Perfect, Great, Good, Miss), combo máximo y porcentaje de precisión.
   - Botón directo para "Siguiente Nivel" que avanza automáticamente al siguiente desafío desbloqueado.

---

## 5. Mantenimiento de la Tolerancia Flexible (±1.05s)
* Se mantendrá la amplia ventana de acierto de ±1.05s ya implementada, permitiendo que tanto en 4 como en 8 teclas el usuario se concentre en aprender la posición correcta de los dedos sin estrés de micro-milisegundos.

---

## 6. Pasos de Implementación y Verificación

1. **Actualizar `src/types/index.ts`:**
   - Añadir metadatos de nivel en `KeyboardSong` (`levelNumber`, `handLayout: '4-keys' | '8-keys-bimanual'`, `categoryLabel`).
2. **Actualizar `src/data/keyboardSongs.ts`:**
   - Implementar la lista de 8 niveles con la progresión de 4 y 8 teclas descrita.
   - Ajustar el generador de notas rítmicas para distribuir notas fluidamente a lo largo de los 120 segundos de duración.
3. **Actualizar `src/components/keyboard/RhythmHighwayGame.tsx`:**
   - Adaptar el renderizador de la autopista para admitir 4 u 8 carriles con división estética en dos bloques para la mano izquierda y derecha.
   - Integrar el temporizador de 120 segundos máximos con corte automático y fundido de audio.
   - Añadir soporte dinámico para todas las teclas asignadas en `keydown`.
4. **Actualizar `src/components/keyboard/SongSelectorModal.tsx`:**
   - Mostrar insignias de nivel (`Nivel 1` a `Nivel 8`), etiquetas de categoría (`Fila Guía`, `Fila Superior`, `Bimanual 8K`), y badges visuales para cada una de las teclas del nivel separadas por mano.
5. **Compilación y Pruebas:**
   - Ejecutar `compile_applet` y `npm run build` para garantizar cero errores de sintaxis y empaquetado.
