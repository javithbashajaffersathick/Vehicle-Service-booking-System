import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4500) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, message, type, title, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, duration)
      }
    },
    [dismissToast]
  )

  const success = useCallback(
    (message: string, title?: string) => showToast(message, 'success', title),
    [showToast]
  )
  const error = useCallback(
    (message: string, title?: string) => showToast(message, 'error', title),
    [showToast]
  )
  const warning = useCallback(
    (message: string, title?: string) => showToast(message, 'warning', title),
    [showToast]
  )
  const info = useCallback(
    (message: string, title?: string) => showToast(message, 'info', title),
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast,
      }}
    >
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4 sm:p-0">
        {toasts.map((toast) => {
          let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />
          let borderClass = 'border-blue-200 bg-white'

          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-[#2D5A3D] shrink-0" />
            borderClass = 'border-[#5A9E6F]/40 bg-white'
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            borderClass = 'border-rose-200 bg-white'
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            borderClass = 'border-amber-200 bg-white'
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-2 ${borderClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1">
                {toast.title && <h5 className="font-semibold text-sm text-gray-900">{toast.title}</h5>}
                <p className="text-sm text-gray-600 leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
