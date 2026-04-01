import api from './api';
import type { HistorialEmail, RecordatorioType } from '../types';

export const notificacionesService = {
  getHistorialEmail: () =>
    api.get<HistorialEmail[]>('/email/historial').then((r) => r.data),
  getRecordatorios: () =>
    api.get<RecordatorioType[]>('/recordatorios').then((r) => r.data),
};
