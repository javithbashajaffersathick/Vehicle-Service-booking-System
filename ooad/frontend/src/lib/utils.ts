import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '$0.00'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount))
}

export function formatDate(date: string | Date | undefined | null, formatStr = 'MMM dd, yyyy'): string {
  if (!date) return 'N/A'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, formatStr)
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'MMM dd, yyyy h:mm a')
}

export function formatTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'h:mm a')
}

export function capitalize(str: string | undefined | null): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatStatus(status: string | undefined | null): string {
  if (!status) return ''
  return status
    .split('_')
    .map(word => capitalize(word))
    .join(' ')
}

export function getStatusBadgeVariant(status: string | undefined | null): {
  bg: string
  text: string
  border: string
  label: string
} {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'completed':
    case 'paid':
    case 'active':
    case 'available':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: formatStatus(s),
      }
    case 'in_progress':
    case 'in-progress':
    case 'processing':
    case 'busy':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: formatStatus(s),
      }
    case 'pending':
    case 'scheduled':
    case 'draft':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: formatStatus(s),
      }
    case 'confirmed':
    case 'approved':
      return {
        bg: 'bg-teal-50 text-[#2D5A3D] border-[#5A9E6F]/30',
        text: 'text-[#2D5A3D]',
        border: 'border-[#5A9E6F]/30',
        label: formatStatus(s),
      }
    case 'cancelled':
    case 'failed':
    case 'overdue':
    case 'rejected':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        text: 'text-rose-700',
        border: 'border-rose-200',
        label: formatStatus(s),
      }
    default:
      return {
        bg: 'bg-gray-100 text-gray-700 border-gray-200',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: formatStatus(s) || 'Unknown',
      }
  }
}
