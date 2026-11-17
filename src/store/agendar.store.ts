import { create } from 'zustand';
interface Borrador {
  servicioId: string;
  fecha: string;
  inicio: string;
  elegirServicio: (id: string) => void;
  elegirFecha: (fecha: string) => void;
  elegirInicio: (inicio: string) => void;
  limpiar: () => void;
}
export const useAgendarStore = create<Borrador>((set) => ({
  servicioId: '',
  fecha: '',
  inicio: '',
  elegirServicio: (servicioId) => set({ servicioId, fecha: '', inicio: '' }),
  elegirFecha: (fecha) => set({ fecha, inicio: '' }),
  elegirInicio: (inicio) => set({ inicio }),
  limpiar: () => set({ servicioId: '', fecha: '', inicio: '' }),
}));
