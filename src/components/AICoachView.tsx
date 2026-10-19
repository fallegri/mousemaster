import React, { useState } from 'react';
import { Sparkles, ShieldAlert, Cpu, CheckCircle2, Move, HelpCircle } from 'lucide-react';
import { UserSettings } from '../types';

interface Props {
  userSettings: UserSettings;
  onOpenSettings: () => void;
}

export const AICoachView: React.FC<Props> = ({ userSettings, onOpenSettings }) => {
  const [activeGrip, setActiveGrip] = useState<'palm' | 'claw' | 'fingertip'>('palm');
  const [testAreaPoints, setTestAreaPoints] = useState<number[]>([]);
  const [dpiFeedback, setDpiFeedback] = useState<string>('Mueve el ratón de izquierda a derecha en el recuadro para evaluar tu sensibilidad');

  const handlePointerTest = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setTestAreaPoints((prev) => [...prev.slice(-20), x]);

    if (testAreaPoints.length > 8) {
      const deltas = [];
      for (let i = 1; i < testAreaPoints.length; i++) {
        deltas.push(Math.abs(testAreaPoints[i] - testAreaPoints[i - 1]));
      }
      const avgStep = deltas.reduce((a, b) => a + b, 0) / deltas.length;

      if (avgStep > 24) {
        setDpiFeedback('Sensibilidad Alta: Si sientes que el cursor salta o cuesta centrar las dianas pequeñas, reduce el DPI de tu ratón.');
      } else if (avgStep < 5) {
        setDpiFeedback('Sensibilidad Baja: Buena para precisión milimétrica, pero asegúrate de mover el antebrazo y no solo la muñeca.');
      } else {
        setDpiFeedback('Sensibilidad Equilibrada: Excelente rango de control para navegación y ejercicios de destreza.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Tutor Biomecánico Inteligente</span>
          </div>
          <h1 className="text-xl font-bold">Consejero de Ergonomía & Destreza Motriz</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Aprende a posicionar tu cuerpo y mano para prevenir el síndrome del túnel carpiano, reducir la fatiga y optimizar tu precisión.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Configurar Motor IA ({userSettings.aiProvider.toUpperCase()})</span>
        </button>
      </div>

      {/* Grip Types Guide */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Estilos de Agarre del Ratón (Grip Styles)</h2>
        <p className="text-xs text-slate-500">
          Cada mano es única. Conocer tu agarre te permite elegir la técnica adecuada:
        </p>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveGrip('palm')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeGrip === 'palm'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agarre de Palma (Palm)
          </button>
          <button
            onClick={() => setActiveGrip('claw')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeGrip === 'claw'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agarre de Garra (Claw)
          </button>
          <button
            onClick={() => setActiveGrip('fingertip')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeGrip === 'fingertip'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Solo Yemas (Fingertip)
          </button>
        </div>

        {/* Active Grip Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
          {activeGrip === 'palm' && (
            <>
              <div className="font-bold text-slate-900 text-sm">Agarre de Palma Completa (El más relajante)</div>
              <p className="text-slate-600 leading-relaxed">
                Toda la palma de la mano descansa sobre la superficie del ratón. Es el estilo más cómodo y ergonómico para principiantes y personas con fatiga en los dedos, ya que el movimiento proviene principalmente del antebrazo y codo en lugar de forzar la muñeca.
              </p>
              <div className="flex items-center gap-2 text-indigo-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recomendado para: Navegación diaria, principiantes y sesiones largas.</span>
              </div>
            </>
          )}

          {activeGrip === 'claw' && (
            <>
              <div className="font-bold text-slate-900 text-sm">Agarre de Garra (Mayor velocidad de clic)</div>
              <p className="text-slate-600 leading-relaxed">
                La base de la palma reposa en la parte trasera del ratón mientras los dedos índice y corazón se arquean en ángulo agudo sobre los botones. Brinda una gran rapidez de doble clic y clics repetitivos, pero requiere descansos periódicos.
              </p>
              <div className="flex items-center gap-2 text-indigo-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recomendado para: Tareas que demandan clics rápidos y selección precisa.</span>
              </div>
            </>
          )}

          {activeGrip === 'fingertip' && (
            <>
              <div className="font-bold text-slate-900 text-sm">Agarre de Yemas (Fingertip - Máxima agilidad)</div>
              <p className="text-slate-600 leading-relaxed">
                La palma no toca el ratón en absoluto; únicamente las yemas de los cinco dedos sostienen y guían el dispositivo. Permite micro-ajustes rápidos con los dedos, ideal para ratones compactos y livianos.
              </p>
              <div className="flex items-center gap-2 text-indigo-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recomendado para: Micro-trazados y personas con ratones de tamaño reducido.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ergonomic Golden Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="font-bold text-slate-900 text-xs">1. Ángulo del Codo (90°)</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ajusta la altura de tu asiento para que tu codo descanse a 90 grados respecto a la superficie de la mesa.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="font-bold text-slate-900 text-xs">2. Muñeca Recta y Sin Tensión</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            No dobles la muñeca hacia arriba ni hacia los costados. Desplaza todo el antebrazo sobre la alfombrilla.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="font-bold text-slate-900 text-xs">3. Presión Ligera en los Clics</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            No aprietes el ratón como si fueras a romperlo. Un toque sutil es suficiente para activar el microinterruptor.
          </p>
        </div>
      </div>

      {/* Sensitivity Calibration Sandbox */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Simulador de Calibración de Sensibilidad (DPI)</h3>
            <p className="text-xs text-slate-500">Mueve el cursor dentro del área para recibir un diagnóstico en vivo</p>
          </div>
          <Move className="w-5 h-5 text-indigo-500" />
        </div>

        <div
          onPointerMove={handlePointerTest}
          className="w-full h-32 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center p-4 cursor-crosshair hover:bg-indigo-50/20 transition-colors"
        >
          <span className="text-xs font-medium text-indigo-600 pointer-events-none select-none">
            {dpiFeedback}
          </span>
        </div>
      </div>
    </div>
  );
};
