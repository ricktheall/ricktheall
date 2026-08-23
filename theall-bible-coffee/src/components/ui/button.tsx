import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color] duration-200 disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        // Outlined gold that inverts on hover — the house call to action.
        primary:
          "border border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        accent:
          "border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-transparent hover:text-[var(--accent)]",
        outline:
          "border border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
        ghost:
          "border border-transparent text-[var(--foreground-muted)] hover:text-[var(--accent)]",
      },
      size: {
        // Comfortable touch targets: never below 44px tall.
        md: "min-h-[2.75rem] px-5 py-2.5 text-[0.9rem] tracking-wide",
        lg: "min-h-[3.25rem] px-8 py-3 text-[0.95rem] tracking-wide",
        sm: "min-h-[2.75rem] px-4 py-2 text-sm",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
}

export function Button({ className, variant, size, block, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}

export { buttonVariants };
