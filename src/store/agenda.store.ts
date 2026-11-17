import { create } from 'zustand';
import { fechaLocal, sumarDias } from '@/utils/fechas';
interface Agenda {
  fecha: string;
  vista: string;
  setFecha: (fecha: string) => void;
  setVista: (vista: string) => void;
}
export const useAgendaStore = create<Agenda>((set) => ({
  fecha: sumarDias(fechaLocal(), 2),
  vista: 'dia',
  setFecha: (fecha) => set({ fecha }),
  setVista: (vista) => set({ vista }),
}));
