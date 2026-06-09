import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-accent text-slate-950 hover:bg-accent2',
  outline: 'border border-white/10 bg-white/5 text-white hover:border-accent',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/5'
};

export function Button({ className = '', variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
