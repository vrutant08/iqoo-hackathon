import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

type Props = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export function Button({ variant = "solid", size = "md", icon, className, children, ...props }: Props) {
  return (
    <motion.button
      whileHover={!props.disabled ? { y: -1 } : undefined}
      whileTap={!props.disabled ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className={cn(
        "group inline-flex items-center justify-center gap-2 font-mono text-label tracking-label uppercase",
        "transition-[background-color,color,transform,border-color,box-shadow] duration-150 ease-[var(--ease-press)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "solid" && "bg-ink text-paper hover:bg-accent hover:text-accent-fg hover:shadow-[0_6px_20px_rgb(255_68_0/0.25)]",
        variant === "outline" && "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
        variant === "ghost" && "text-ink hover:text-accent",
        size === "md" && "h-11 px-5",
        size === "lg" && "h-12 px-6",
        className,
      )}
      {...props}
    >
      {children}
      <span className="inline-flex transition-transform duration-200 group-hover:translate-x-0.5">{icon}</span>
    </motion.button>
  );
}
