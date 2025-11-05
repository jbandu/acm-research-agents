'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

type ToastVariant = 'info' | 'success' | 'error'

type ToastInput =
  | string
  | {
      title?: string
      description?: string
      variant?: ToastVariant
      duration?: number
    }

type Toast = {
  id: number
  title?: string
  description?: string
  variant: ToastVariant
  duration: number
}

type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: 'border-slate-200 bg-white text-slate-900 shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-emerald-900/10 dark:border-emerald-900/60 dark:bg-emerald-950 dark:text-emerald-100',
  error:
    'border-rose-200 bg-rose-50 text-rose-900 shadow-rose-900/10 dark:border-rose-900/60 dark:bg-rose-950 dark:text-rose-100',
}

const DEFAULT_DURATION = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (input: ToastInput) => {
      counterRef.current += 1
      const id = counterRef.current

      const toast: Toast = {
        id,
        title: typeof input === 'string' ? undefined : input.title,
        description:
          typeof input === 'string' ? input : input.description ?? input.title,
        variant: typeof input === 'string' ? 'info' : input.variant ?? 'info',
        duration:
          typeof input === 'string'
            ? DEFAULT_DURATION
            : input.duration ?? DEFAULT_DURATION,
      }

      setToasts((current) => [...current, toast])

      window.setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    },
    [removeToast],
  )

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded-xl border p-4 shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${VARIANT_STYLES[toast.variant]}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {toast.title && (
                  <p className="text-sm font-semibold leading-5">{toast.title}</p>
                )}
                {toast.description && (
                  <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

export default ToastProvider
