# MouseMaster: Entrenador Interactivo de Habilidades del Ratón con IA

Plataforma web gamificada y accesible para aprender y perfeccionar el control del ratón (puntería, clic/doble clic, arrastrar y soltar, desplazamiento por scroll, selección múltiple y trayectorias fluidas continuas), complementada con telemetría biomecánica en tiempo real, calibración adaptativa automática de dificultad y un tutor inteligente con soporte multi-proveedor (Nvidia NIM con Nemotron, Gemini y motor local fuera de línea).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario:**
> - **Público y Estilo:** Universal y accesible para todas las edades, con diseño limpio, interactivo y ludificado (sin elementos infantiles condescendientes ni interfaces excesivamente técnicas).
> - **Integración de IA:** Soporte principal para la API de Nvidia NIM (`https://integrate.api.nvidia.com/v1`) con modelos como `nvidia/nemotron-3.5-lightning-30b-a3b`, configuración por defecto de API key mediante backend seguro, más un selector interactivo donde el usuario puede ingresar su propia clave o alternar entre Nvidia NIM, Google Gemini y el motor heurístico local instantáneo.
> - **Estructura de Progresión:** Misiones guiadas por niveles con estrellas (1 a 3 estrellas por precisión, velocidad y fluidez) más un Modo Práctica Libre con desafíos configurables y registro de marcas personales (Personal Best Scores).

---

## 1. Overview & Core Concept

**MouseMaster** transforma el aprendizaje digital y la coordinación motriz fina en una experiencia gratificante y dinámica. La aplicación aborda los seis pilares fundamentales de la interacción con el ratón:
1. **Movimiento General y Puntería (Target Clicking):** Coordinación ojo-mano, estimación de distancias y clics simples con objetivos estáticos y móviles.
2. **Doble Clic y Clic Secuencial (Action Clicks):** Velocidad de cadencia entre clics y activación de menús contextuales contextualizados en el juego.
3. **Arrastrar y Soltar (Drag & Drop):** Mantener el botón presionado mientras se desplaza el cursor a zonas de destino específicas (clasificación de elementos, encaje de piezas y rompecabezas).
4. **Scroll y Rueda (Wheel Navigation):** Navegación controlada en ejes verticales y horizontales, control de zoom y parada precisa en puntos de interés.
5. **Selección y Lazo (Box & Multi-Select):** Selección de áreas rectangulares (rubber-band selection), selección con tecla modificadora (Shift/Ctrl) y selección rápida de grupos.
6. **Movimiento Fluido y Trazado (Fluid Path Tracking):** Navegación en curvas suaves sin salirse de márgenes estrechos, control de temblor (jitter) y velocidad constante.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Página de Inicio / Hub de Entrenamiento:**
   - Vista general del progreso del usuario: estrellas acumuladas, precisión global promedio y radar de competencias (Puntería, Velocidad, Arrastre, Scroll, Selección, Fluidez).
   - Acceso inmediato a la "Ruta de Misiones" (niveles secuenciales) o al "Laboratorio Libre" (retos con récords personales).
   - Barra superior limpia con selector de módulo, acceso a ajustes de IA y reinicio rápido.
2. **Entorno de Ejercicio Interactivo:**
   - **Canvas de interacción de gran escala (70% de pantalla):** Espacio activo con cursores visuales reactivos, dianas y guías de trayectoria.
   - **HUD de Rendimiento en Tiempo Real (30% de pantalla):** Indicadores en vivo de precisión (%), tiempo de reacción (ms), temblor detectado (jitter score) y suavidad del trazo.
   - **Sonido sutil y gratificante (Web Audio API):** Clics táctiles suaves, sonido de acierto progresivo y fanfarria breve al superar un nivel, con botón de silenciar siempre accesible.
3. **Resumen de Misión y Calibración Adaptativa:**
   - Evaluación de 1 a 3 estrellas basada en los umbrales de precisión y tiempo.
   - **Ajuste automático de dificultad:** Si el usuario falla o muestra temblor repetido, el sistema amplía las áreas de impacto y reduce la velocidad; si domina el ejercicio, aumenta el desafío (menor tolerancia, objetivos más pequeños o dinámicos).
   - **Consejero de IA (AI Coach):** Diagnóstico instantáneo con consejos ergonómicos de postura, sensibilidad del ratón (DPI) y técnica motriz recomendada, impulsado por Nvidia Nemotron, Gemini o el motor local.

### Visual Identity & Theme
- **Dirección Estética:** Moderno, accesible y pulcro. Evita la saturación artificial y las tarjetas genéricas; utiliza superficies suaves y tipografía de alta legibilidad inspirada en interfaces educativas escandinavas y de entrenamiento atlético.
- **Paleta de Color (Regla 60-30-10):**
  - **60% Fondo y Lienzo:** `#F8FAFC` (Slate 50 limpio en modo claro) / `#0F172A` (Slate 900 en modo oscuro).
  - **30% Estructura y Paneles:** Superficies neutras `#FFFFFF` / `#1E293B`, bordes finos `#E2E8F0` / `#334155`.
  - **10% Acentos Focales:**
    - Primario (Acción y Éxito): Verde Esmeralda `#059669` (Acierto y avance seguro).
    - Guías y Enfoque: Azul Índigo `#4F46E5` (Rutas de trazado y zonas de selección).
    - Alertas de corrección: Ámbar cálido `#D97706` (Ajustes de dificultad y avisos pedagógicos).
- **Tipografía:**
  - Títulos y destacados: `Plus Jakarta Sans` (peso 600-700, balance tipográfico).
  - Texto corporal: `Plus Jakarta Sans` (peso 400-500, espaciado cómodo).
  - Métricas e índices numéricos: `tabular-nums` con monoespaciado para telemetría en tiempo real sin saltos visuales.

---

## 3. Key Product Decisions & Trade-Offs

- **Arquitectura de IA Híbrida (Nvidia NIM + Local Heuristic + Gemini):**
  - *Enfoque:* Implementar un endpoint proxy en el backend de Node/Express (`/api/ai-feedback`) que interactúe de forma segura con `https://integrate.api.nvidia.com/v1/chat/completions` utilizando el modelo `nvidia/nemotron-3.5-lightning-30b-a3b` (y modelos alternativos de Nvidia). Si el usuario no tiene conexión o no suministra una clave, se activa automáticamente el *Motor Biomecánico Local* (cálculo de vectores de Fitts' Law, jerk/derivada tercera de posición y varianza de desplazamiento), garantizando que la app funcione al 100% en todo momento.
  - *Seguridad:* Las claves no se exponen al cliente en el código; el usuario puede introducir su clave propia en la interfaz de Ajustes (guardada en su `localStorage` privado) o usar la clave inyectada por el servidor.
- **Motor Adaptativo Dinámico (Dynamic Difficulty Adjustment - DDA):**
  - Calcula un factor de dificultad $\lambda \in [0.5, 2.0]$. Tras cada serie de 3 intentos o final de nivel, el algoritmo de suavizado exponencial actualiza el radio de los blancos ($R = R_0 / \lambda$), la velocidad de movimiento ($V = V_0 \cdot \lambda$) y el margen de error de trazado.
- **Persistencia Local y Récords Personales:**
  - Guardado en `localStorage` del progreso por niveles, estrellas ganadas, mejores puntuaciones en práctica libre y preferencias de IA. Sin dependencias externas pesadas para arranque inmediato.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                          │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Navigation / HUD    │  │       Exercise Canvas Engine          │  │
│  │  - Level & Stars Bar  │  │  - Target Clicker (Precision)         │  │
│  │  - Metric Telemetry   │  │  - Action Clicker (Double/Right Click)│  │
│  │  - Personal Best High │  │  - Drag & Drop Sorting Arena          │  │
│  │  - AI Settings Modal  │  │  - Wheel & Infinite Scroll Chamber    │  │
│  └───────────┬───────────┘  │  - Marquee / Lasso Selection Grid     │  │
│              │              │  - Fluid Trajectory Path Follower     │  │
│              │              └───────────────────┬───────────────────┘  │
│              ▼                                  ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │             Telemetry & Motion Analytics Engine                  │  │
│  │   - Real-time Cursor Coordinates, Velocity (px/ms), Jitter Vector│  │
│  │   - Overshoot Detection, Dwell Time, Fitts' Law Index            │  │
│  │   - Dynamic Difficulty Calibrator (DDA)                          │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                 ┌───────────────────┴───────────────────┐              │
│                 ▼                                       ▼              │
│     ┌───────────────────────┐               ┌───────────────────────┐  │
│     │ Local Rule Evaluator  │               │ Backend Proxy Service │  │
│     │ (Zero-latency offline)│               │   /api/ai-feedback    │  │
│     └───────────────────────┘               └───────────┬───────────┘  │
└─────────────────────────────────────────────────────────┼──────────────┘
                                                          ▼
                                  ┌───────────────────────────────────┐
                                  │      Nvidia NIM API / Gemini      │
                                  │   https://integrate.api.nvidia.com│
                                  │  nemotron-3.5-lightning-30b-a3b   │
                                  └───────────────────────────────────┘
```

### Exercise Modules Specification
1. **Módulo 1: Puntería y Movimiento (Target Range):**
   - Blancos concéntricos que aparecen en posiciones aleatorias.
   - Puntuación basada en distancia al centro del blanco y tiempo de llegada.
2. **Módulo 2: Clic Doble y Clic Secuencial (Action Arena):**
   - Objetos que requieren doble clic rápido (conmutación de carpetas/cajas sorpresa) y clic derecho (menú contextual para realizar una acción específica).
3. **Módulo 3: Arrastrar y Soltar (Drop Zone & Puzzle):**
   - Clasificación de elementos geométricos o de reciclaje en contenedores específicos.
   - Detección precisa de eventos `pointerdown`, `pointermove`, `pointerup` para soporte impecable y feedback de imantación.
4. **Módulo 4: Rueda y Scroll (Precision Scroll Vault):**
   - Túnel de navegación con checkpoints verticales y horizontales donde el usuario debe alinear marcadores exactos con la rueda del ratón.
5. **Módulo 5: Selección de Objetos y Lazo (Box & Multi-Select):**
   - Caja de selección arrastrable (rubber-band) para atrapar solo los elementos válidos (ej. capturar todas las gemas azules evitando los obstáculos).
6. **Módulo 6: Trazo Fluido Continuo (Smooth River & Maze):**
   - Laberintos y curvas Bezier con paredes estrechas donde el cursor no debe tocar los bordes, midiendo la velocidad constante y la ausencia de saltos bruscos.

### State & Storage Structure
- `currentModule`: Módulo activo ('targets' | 'actions' | 'drag' | 'scroll' | 'select' | 'fluid')
- `mode`: 'campaign' (misiones 1 a 6 con estrellas) | 'free_practice' (retos infinitos con récord de score)
- `difficulty`: Factor numérico (1.0 default) que escala parámetros físicos de los ejercicios
- `telemetry`: Registro de los últimos 100 movimientos (coordenadas, tiempos, clics fallidos, desvíos)
- `aiProvider`: 'nvidia' | 'gemini' | 'local'
- `nvidiaModel`: 'nvidia/nemotron-3.5-lightning-30b-a3b' | 'meta/llama-3.3-70b-instruct' | 'nvidia/llama-3.1-nemotron-70b-instruct'
- `highScores`: Registro de puntuaciones máximas por ejercicio guardado en `localStorage`
- `audioEnabled`: Booleano para efectos sonoros sintetizados

---

## Plan de Verificación y Compilación

1. **Servidor y Proxy de API:** Configurar servidor Express seguro en `server.ts` con proxy a Nvidia NIM (`https://integrate.api.nvidia.com/v1`) y Gemini, protegiendo las credenciales y gestionando CORS adecuadamente.
2. **Componentes y Motor Interactivo:** Construir la suite completa de 6 ejercicios interactivos con Web Audio API y telemetría de movimiento.
3. **Calibración y DDA:** Probar el ajuste dinámico de dificultad frente a fallos y aciertos consecutivos.
4. **Validación de Compilación:** Ejecutar `compile_applet` para garantizar cero errores de TypeScript y empaquetado impecable con Vite.
