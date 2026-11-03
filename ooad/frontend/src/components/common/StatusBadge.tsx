import React from 'react'
import { getStatusBadgeVariant } from '@/lib/utils'

interface StatusBadgeProps {
  status: string | undefined | null
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { bg, label } = getStatusBadgeVariant(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}

export default StatusBadge
