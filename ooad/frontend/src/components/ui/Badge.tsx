import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#e8f0eb] text-[#2D5A3D] border border-[#2D5A3D]/20',
        primary: 'bg-[#2D5A3D] text-white',
        secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        destructive: 'bg-rose-50 text-rose-700 border border-rose-200',
        info: 'bg-blue-50 text-blue-700 border border-blue-200',
        outline: 'text-gray-700 border border-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export default Badge
