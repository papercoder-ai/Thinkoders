import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        pending:
          "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-200",
        approved:
          "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200",
        rejected:
          "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200",
        cancelled:
          "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
        outline:
          "text-slate-900 dark:text-slate-100",
        destructive:
          "border-red-500 bg-red-500 text-white dark:border-red-600 dark:bg-red-600",
        secondary:
          "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
