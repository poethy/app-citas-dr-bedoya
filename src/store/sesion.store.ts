import { create } from 'zustand';
import type { Perfil } from '@/models';
interface Sesion {
  perfil: Perfil | null;
  hidratada: boolean;
  establecer: (perfil: Perfil | null) => void;
}
export const useSesionStore = create<Sesion>((set) => ({
  perfil: null,
  hidratada: false,
  establecer: (perfil) => set({ perfil, hidratada: true }),
}));
