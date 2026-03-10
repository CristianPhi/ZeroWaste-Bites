'use client'

import { useToast } from '@/hooks/use-toast'
import { Check, CircleAlert } from 'lucide-react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === 'destructive'

        return (
          <Toast key={id} {...props} className="rounded-xl border shadow-2xl">
            <div className="flex w-full items-start gap-3">
              <div className={`relative mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${isDestructive ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                <span className={`absolute inset-0 animate-ping rounded-full ${isDestructive ? 'bg-red-500/20' : 'bg-emerald-500/20'}`} />
                {isDestructive ? <CircleAlert className="relative h-4 w-4" /> : <Check className="relative h-4 w-4" />}
              </div>
              <div className="grid flex-1 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
