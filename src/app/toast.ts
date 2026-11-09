/** Aviso rápido (popup) para exportar, copiar, enviar e importar. Uso: `toast('Imagem copiada.')` ou `toast(texto, 'error')`. */
import { create } from 'zustand';

export interface ToastItem { id: number; text: string; kind: 'ok' | 'error' }
let next = 1;

export const useToasts = create<{ items: ToastItem[]; dismiss: (id: number) => void }>((set) => ({
  items: [],
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export function toast(text: string, kind: ToastItem['kind'] = 'ok'): void {
  const id = next++;
  useToasts.setState((s) => ({ items: [...s.items.slice(-3), { id, text, kind }] }));
  setTimeout(() => useToasts.getState().dismiss(id), kind === 'error' ? 6000 : 3500);
}
