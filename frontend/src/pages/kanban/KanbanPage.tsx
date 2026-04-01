import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui';
import { ordenesTrabajoService } from '../../services/ordenes-trabajo.service';
import { mecanicosService } from '../../services/mecanicos.service';
import type { OrdenTrabajo, Mecanico } from '../../types';

const columnDefs = [
  { key: 'recepcion', i18nKey: 'estado.recepcion', color: 'border-blue-400' },
  { key: 'diagnostico', i18nKey: 'estado.diagnostico', color: 'border-purple-400' },
  { key: 'presupuesto', i18nKey: 'estado.presupuesto', color: 'border-yellow-400' },
  { key: 'esperando_aprobacion', i18nKey: 'estado.espAprobacion', color: 'border-orange-400' },
  { key: 'esperando_repuestos', i18nKey: 'estado.espRepuestos', color: 'border-amber-400' },
  { key: 'en_reparacion', i18nKey: 'estado.enReparacion', color: 'border-indigo-400' },
  { key: 'control_calidad', i18nKey: 'estado.controlCalidad', color: 'border-teal-400' },
  { key: 'listo', i18nKey: 'estado.listo', color: 'border-green-400' },
] as const;

const prioridadColors: Record<string, string> = {
  baja: 'border-l-gray-300',
  media: 'border-l-blue-400',
  alta: 'border-l-orange-400',
  urgente: 'border-l-red-500',
};

const UNASSIGNED = '__unassigned__';

const defaultColors = [
  '#94a3b8', '#60a5fa', '#4ade80', '#c084fc', '#fb923c',
  '#f472b6', '#2dd4bf', '#facc15', '#f87171', '#818cf8',
];

const STORAGE_KEY = 'kanban-mechanic-colors';

function loadMechanicColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveMechanicColors(colors: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

/** Given a hex color, return a very subtle bg for light & dark modes */
function colorToBg(hex: string, isDark: boolean): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return isDark
    ? `rgba(${r}, ${g}, ${b}, 0.10)`
    : `rgba(${r}, ${g}, ${b}, 0.08)`;
}

export default function KanbanPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const columnas = columnDefs.map((c) => ({ ...c, label: t(c.i18nKey) }));
  const [board, setBoard] = useState<Record<string, OrdenTrabajo[]>>({});
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [activeOt, setActiveOt] = useState<OrdenTrabajo | null>(null);
  const [mecColors, setMecColors] = useState<Record<string, string>>(loadMechanicColors);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const load = async () => {
    const [data, mecData] = await Promise.all([
      ordenesTrabajoService.getKanban(),
      mecanicosService.getActive(),
    ]);
    setBoard(data);
    setMecanicos(mecData);
  };

  useEffect(() => { load(); }, []);

  /* Build rows: each mechanic + unassigned */
  const rows = useMemo(() => {
    const mecRows = mecanicos.map((m, i) => ({
      id: String(m.id),
      label: m.nombre || m.especialidad || `#${m.id}`,
      especialidad: m.especialidad || '',
      color: mecColors[String(m.id)] || defaultColors[(i + 1) % defaultColors.length],
    }));
    return [
      { id: UNASSIGNED, label: t('kanban.sinAsignar'), especialidad: '', color: mecColors[UNASSIGNED] || defaultColors[0] },
      ...mecRows,
    ];
  }, [mecanicos, t, mecColors]);

  const handleColorChange = useCallback((rowId: string, newColor: string) => {
    setMecColors((prev) => {
      const next = { ...prev, [rowId]: newColor };
      saveMechanicColors(next);
      return next;
    });
  }, []);

  /* Flat list of all OTs */
  const allOts = useMemo(() => {
    return Object.values(board).flat();
  }, [board]);

  /* Get OTs for a cell (mechanic × estado) */
  const getCellOts = (mecId: string, estado: string): OrdenTrabajo[] => {
    const otsInEstado = board[estado] ?? [];
    if (mecId === UNASSIGNED) {
      return otsInEstado.filter((o) => !o.mecanico_id);
    }
    return otsInEstado.filter((o) => String(o.mecanico_id) === mecId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const otId = event.active.id;
    const found = allOts.find((o) => String(o.id) === String(otId));
    if (found) setActiveOt(found);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOt(null);
    const { active, over } = event;
    if (!over) return;

    const otId = Number(active.id);
    const targetCol = String(over.id);

    let sourceCol = '';
    for (const key of Object.keys(board)) {
      if (board[key].find((o) => o.id === otId)) { sourceCol = key; break; }
    }

    if (sourceCol === targetCol) return;
    if (!columnDefs.find((c) => c.key === targetCol)) return;

    const ot = board[sourceCol].find((o) => o.id === otId)!;
    setBoard((prev) => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter((o) => o.id !== otId),
      [targetCol]: [...(prev[targetCol] ?? []), { ...ot, estado: targetCol as any }],
    }));

    await ordenesTrabajoService.cambiarEstado(otId, targetCol);
  };

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/ordenes-trabajo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('kanban.title')}</h1>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <table className="border-separate border-spacing-0" style={{ minWidth: columnas.length * 180 + 160 }}>
            {/* Header row: estado columns */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-900 w-36 min-w-[9rem]" />
                {columnas.map((col) => (
                  <th
                    key={col.key}
                    className={`w-44 min-w-[11rem] border-t-4 ${col.color} bg-gray-50 dark:bg-gray-800 px-2 py-2 text-center`}
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{col.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const rowBg = colorToBg(row.color, isDark);
                return (
                  <tr key={row.id}>
                    {/* Mechanic label — vertically centered */}
                    <td
                      className="sticky left-0 z-10 px-2 py-3 align-middle"
                      style={{
                        backgroundColor: rowBg,
                        borderLeft: `4px solid ${row.color}`,
                        borderTop: rowIdx > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Color picker */}
                        <button
                          type="button"
                          className="relative shrink-0 w-5 h-5 rounded-full border-2 border-white/50 dark:border-gray-600 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: row.color }}
                          title={t('kanban.cambiarColor') || 'Cambiar color'}
                          onClick={() => {
                            setColorPickerOpen(row.id);
                            setTimeout(() => colorInputRef.current?.click(), 50);
                          }}
                        />
                        {colorPickerOpen === row.id && (
                          <input
                            ref={colorInputRef}
                            type="color"
                            className="absolute w-0 h-0 opacity-0"
                            value={row.color}
                            onChange={(e) => handleColorChange(row.id, e.target.value)}
                            onBlur={() => setColorPickerOpen(null)}
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap truncate">
                            {row.id === UNASSIGNED ? '— ' : '🔧 '}{row.label}
                          </span>
                          {row.especialidad && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {row.especialidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Cells: one per estado */}
                    {columnas.map((col) => {
                      const cellOts = getCellOts(row.id, col.key);
                      return (
                        <KanbanCell
                          key={`${row.id}-${col.key}`}
                          id={col.key}
                          items={cellOts}
                          rowColor={rowBg}
                          borderTop={rowIdx > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}` : undefined}
                          onClickItem={(id) => navigate(`/ordenes-trabajo/${id}`)}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <DragOverlay>
          {activeOt && <OtCard ot={activeOt} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ── Cell (droppable) ── */
function KanbanCell({
  id,
  items,
  rowColor,
  borderTop,
  onClickItem,
}: {
  id: string;
  items: OrdenTrabajo[];
  rowColor?: string;
  borderTop?: string;
  onClickItem: (id: number) => void;
}) {
  const { setNodeRef } = useSortable({ id });

  return (
    <td
      ref={setNodeRef}
      className="align-top rounded-lg p-1.5 min-h-[7rem] h-28"
      style={{
        minHeight: '7rem',
        backgroundColor: rowColor ?? undefined,
        borderTop: borderTop ?? undefined,
      }}
    >
      <div className="space-y-1.5 min-h-[6rem]">
        {items.map((ot) => (
          <DraggableOtCard key={ot.id} ot={ot} onClick={() => onClickItem(ot.id)} />
        ))}
      </div>
    </td>
  );
}

function DraggableOtCard({ ot, onClick }: { ot: OrdenTrabajo; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(ot.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick} className="group">
      <OtCard ot={ot} />
    </div>
  );
}

function OtCard({ ot }: { ot: OrdenTrabajo }) {
  const { t } = useI18n();
  return (
    <div className={`bg-white dark:bg-gray-700 rounded-lg shadow-sm border-l-4 ${prioridadColors[ot.prioridad] ?? ''} p-2 cursor-pointer
      hover:shadow-[0_8px_25px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_8px_25px_rgba(96,165,250,0.25)]
      hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]
      hover:border-l-blue-500 dark:hover:bg-gray-600
      transition-all duration-300 ease-out`}>
      <div className="flex justify-between items-start mb-0.5">
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{ot.numero_ot}</span>
        <span className={`text-[10px] capitalize px-1 py-0.5 rounded-full font-medium ${
          ot.prioridad === 'urgente' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
          ot.prioridad === 'alta' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
          ot.prioridad === 'media' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
          'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>{t(`enum.prioridad.${ot.prioridad}`)}</span>
      </div>
      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{ot.cliente?.nombre ?? t('kanban.sinCliente')}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
        {ot.vehiculo?.patente} {ot.vehiculo?.marca} {ot.vehiculo?.modelo}
      </p>
      {Number(ot.total) > 0 && (
        <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mt-0.5">${Number(ot.total).toLocaleString()}</p>
      )}
    </div>
  );
}
