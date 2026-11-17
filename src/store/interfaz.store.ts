import { create } from 'zustand';
interface Interfaz {
  aviso: string;
  mostrar: (aviso: string) => void;
}
export const useInterfazStore = create<Interfaz>((set) => ({
  aviso: '',
  mostrar: (aviso) => set({ aviso }),
}));
