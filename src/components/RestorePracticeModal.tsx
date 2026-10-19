import React, { useState } from 'react';
import { RotateCcw, UserPlus, AlertTriangle, X } from 'lucide-react';

interface Props {
  currentUserNumber: number;
  onConfirmRestore: (newUserName: string) => void;
  onClose: () => void;
}

export const RestorePracticeModal: React.FC<Props> = ({
  currentUserNumber,
  onConfirmRestore,
  onClose,
}) => {
  const nextUserNumber = currentUserNumber + 1;
  const [newUserName, setNewUserName] = useState(`Usuario ${nextUserNumber}`);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmRestore(newUserName.trim() || `Usuario ${nextUserNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-red-600">
            <RotateCcw className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900">Restaurar Práctica</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Limpieza de datos locales</span>
              Se borrarán todos los récords personales, puntuaciones y estrellas almacenadas en este navegador para dar paso a un nuevo usuario.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nombre o identificador del nuevo usuario:</span>
            </label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Ej: Usuario 2, Alumno, María..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <span className="text-[10px] text-slate-400">
              El nuevo usuario comenzará con las misiones desde el Nivel 1 y el historial de práctica limpio.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar y Crear Usuario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
