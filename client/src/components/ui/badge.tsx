import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#6366F1]/20 text-[#6366F1]",
        secondary: "border-transparent bg-[#1A1A24] text-[#D1D5DB] border border-[#2A2A3A]",
        destructive: "border-transparent bg-[#EF4444]/20 text-[#EF4444]",
        outline: "border-[#2A2A3A] text-[#D1D5DB]",
        success: "border-transparent bg-[#10B981]/20 text-[#10B981]",
        warning: "border-transparent bg-[#F59E0B]/20 text-[#F59E0B]",
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
