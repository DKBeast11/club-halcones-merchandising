'use client';

import React, { useState } from 'react';
// El icono de lucide se llama Image y choca con next/image: se renombra aquí
// de una vez para que el resto del código pueda usar NextImage sin ambigüedad.
import { Image as ImageIcon, Trash2 } from 'lucide-react';

interface AdminStockControlsProps {
  stock: number;
  productName: string;
  /** Unidades a sumar (o restar, si es negativo). */
  onAdjustStock: (delta: number) => void;
  onManageImages: () => void;
  onDelete: () => void;
}

const STEPS = [-10, -1, 1, 10];

const AdminStockControls: React.FC<AdminStockControlsProps> = ({
  stock,
  productName,
  onAdjustStock,
  onManageImages,
  onDelete,
}) => {
  // Interruptor protegido: hay que levantar la tapa antes de poder accionarlo.
  const [guardOpen, setGuardOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 border-t border-panel-edge px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        {STEPS.slice(0, 2).map((step) => (
          <button
            key={step}
            type="button"
            aria-label={`Restar ${Math.abs(step)} ${Math.abs(step) === 1 ? 'unidad' : 'unidades'} de stock`}
            onClick={() => onAdjustStock(step)}
            disabled={stock <= 0}
            className="engraved font-data text-[11px] px-2.5 py-1.5 text-signal-red transition-colors hover:bg-signal-red hover:text-panel disabled:opacity-30 disabled:hover:bg-panel-engrave disabled:hover:text-signal-red"
          >
            {step}
          </button>
        ))}

        <span className="font-data text-[11px] tabular text-legend-dim">
          <span className="sr-only">Stock actual: </span>
          {stock}
        </span>

        {STEPS.slice(2).map((step) => (
          <button
            key={step}
            type="button"
            aria-label={`Sumar ${step} ${step === 1 ? 'unidad' : 'unidades'} de stock`}
            onClick={() => onAdjustStock(step)}
            className="engraved font-data text-[11px] px-2.5 py-1.5 text-signal-green transition-colors hover:bg-signal-green hover:text-panel"
          >
            +{step}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onManageImages}
          className="legend-btn flex flex-1 items-center justify-center gap-1.5 text-[11px]"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Imágenes
        </button>

        {!guardOpen ? (
          <button
            type="button"
            onClick={() => setGuardOpen(true)}
            aria-label={`Eliminar ${productName}`}
            className="legend-btn px-3 text-[11px] hover:border-signal-red/60 hover:text-signal-red"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex flex-1 gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="btn-danger flex-1 px-2 py-1.5 text-[11px]"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setGuardOpen(false)}
              className="legend-btn px-3 text-[11px]"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStockControls;
