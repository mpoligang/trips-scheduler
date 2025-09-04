'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { ButtonHTMLAttributes, ReactNode } from 'react';

// 1. Definiamo le varianti del bottone con CVA
const buttonVariants = cva(
  // Classi base condivise da tutte le varianti
  'cursor-pointer inline-flex items-center justify-center rounded-lg font-semibold focus:outline-none  transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Variante primaria (es. bottone di login principale)
        primary:
          'bg-gradient-to-br from-purple-600 to-indigo-700 text-white hover:opacity-90 focus:ring-purple-600 focus:ring-opacity-50',
        // Variante secondaria (es. login con Google)
        secondary:
          'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ',
        // Variante solo per le icone (senza bordo, con sfondo al hover)
        icon:
          'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ',
      },
      size: {
        default: 'py-3 px-5 text-sm w-full',
        sm: 'py-2 px-4 text-xs',
        lg: 'py-4 px-6 text-base',
        // Dimensione specifica per i bottoni con solo icona
        icon: 'h-10 w-10',
      },
    },
    // Varianti di default
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

// 2. Definiamo le props del componente, estendendo quelle native del bottone
// e le varianti che abbiamo creato con CVA
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  children: ReactNode;
}

// 3. Creiamo il componente
export default function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // twMerge unisce le classi in modo intelligente, evitando duplicati o conflitti
      className={twMerge(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  );
}
