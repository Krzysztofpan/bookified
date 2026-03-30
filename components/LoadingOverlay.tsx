"use client"

import { Loader2 } from "lucide-react"

type LoadingOverlayProps = {
  title?: string
}

export function LoadingOverlay({ title = "Processing your book…" }: LoadingOverlayProps) {
  return (
    <div className='loading-wrapper' role='status' aria-live='polite' aria-busy='true'>
      <div className='loading-shadow-wrapper bg-white shadow-soft-md'>
        <div className='loading-shadow'>
          <Loader2 className='loading-animation text-[var(--color-brand)] size-12' />
          <p className='loading-title'>{title}</p>
        </div>
      </div>
    </div>
  )
}
