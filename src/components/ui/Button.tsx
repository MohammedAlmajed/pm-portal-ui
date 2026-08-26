import * as React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'brand' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

/**
 * All colors reference semantic tokens (bg-brand, text-on-brand, border-border…),
 * so the button follows the active theme/tenant automatically. See docs/THEMING.md.
 */
const VARIANTS: Record<Variant, string> = {
  brand: 'bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-active shadow-sm',
  outline: 'border border-border-strong bg-surface text-foreground hover:bg-surface-sunken',
  ghost: 'text-foreground hover:bg-surface-sunken',
  danger: 'bg-danger text-on-danger hover:brightness-95',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'brand', size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
