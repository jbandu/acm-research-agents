'use client'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-description' : undefined}
      className="fixed inset-0 z-[10000] flex items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900/95">
        <div className="space-y-4">
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p
                id="confirm-dialog-description"
                className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line"
              >
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={loading ? undefined : onCancel}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={loading ? undefined : onConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-acm-brand to-acm-blue-light px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-acm-blue-light hover:to-acm-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-acm-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
              disabled={loading}
            >
              {loading ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
