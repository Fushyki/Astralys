/**
 * Botão único da interface: variantes `primary` (dourado), `secondary` e `ghost`; tamanhos `sm` (32), `md` (40) e `lg` (48).
 * Toda ação, inclusive as que antes eram texto sublinhado, usa este componente. `ButtonLink` é o mesmo botão para navegar.
 */
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Look {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Classes do botão (`dz-btn` + variante + tamanho); exportada para quem precisa de um `<label>` ou `<summary>` com a mesma cara. */
export function buttonClass({ variant = 'secondary', size = 'md' }: Look = {}, extra?: string): string {
  return ['dz-btn', variant === 'primary' ? 'gold' : variant === 'ghost' ? 'ghost' : '', size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '', extra ?? ''].filter(Boolean).join(' ');
}

export function Button({ variant, size, className, type = 'button', ...rest }: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...rest} />;
}

export function ButtonLink({ variant, size, className, ...rest }: Look & LinkProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...rest} />;
}
