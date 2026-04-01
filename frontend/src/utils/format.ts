/**
 * Format a number as Chilean Pesos (CLP)
 */
export function formatCLP(value: number | string | null | undefined): string {
  const num = Number(value) || 0;
  return `$${num.toLocaleString('es-CL')}`;
}

/**
 * Format a date string to dd/MM/yyyy
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-CL');
}

/**
 * Format a date string to dd/MM/yyyy HH:mm
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a Chilean RUT (e.g. 12345678-9 → 12.345.678-9)
 */
export function formatRut(rut: string | null | undefined): string {
  if (!rut) return '-';
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return rut;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Build a human-readable label from OT estado enum values
 */
export function formatEstado(estado: string): string {
  const map: Record<string, string> = {
    recepcion: 'Recepción',
    diagnostico: 'Diagnóstico',
    presupuesto: 'Presupuesto',
    esperando_aprobacion: 'Esperando Aprobación',
    esperando_repuestos: 'Esperando Repuestos',
    en_reparacion: 'En Reparación',
    control_calidad: 'Control de Calidad',
    listo: 'Listo',
    entregado: 'Entregado',
    facturado: 'Facturado',
    cancelado: 'Cancelado',
  };
  return map[estado] ?? estado;
}
