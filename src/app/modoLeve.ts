/** A regra do Modo leve, sem dependências para poder ser testada. A preferência e a aplicação ficam em `settings.ts`. */
export type ModoLeve = 'auto' | 'on' | 'off';

/** `auto` liga com até 4 núcleos, até 4 GB de memória (onde o navegador informa) ou quando o sistema pede menos movimento. */
export function modoLeveLigado(pref: ModoLeve, device: { hardwareConcurrency?: number; deviceMemory?: number }, menosMovimento: boolean): boolean {
  if (pref !== 'auto') return pref === 'on';
  return menosMovimento || (device.hardwareConcurrency ?? Infinity) <= 4 || (device.deviceMemory ?? Infinity) <= 4;
}
