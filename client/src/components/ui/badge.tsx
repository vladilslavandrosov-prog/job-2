import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#6366F1]/20 text-[#6366F1]",
        secondary:   "border-[var(--border)] bg-[var(--border-2)] text-[var(--text-2)]",
        destructive: "border-transparent bg-[#EF4444]/20 text-[#EF4444]",
        outline:     "border-[var(--border)] text-[var(--text-2)]",
        success:     "border-transparent bg-[#10B981]/20 text-[#10B981]",
        warning:     "border-transparent bg-[#F59E0B]/20 text-[#F59E0B]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
