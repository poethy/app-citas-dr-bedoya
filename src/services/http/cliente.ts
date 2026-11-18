import { create } from 'axios';
// Preparado para integración. La demo utiliza repositorio.ts y no hace HTTP ficticio.
export const clienteHttp = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
