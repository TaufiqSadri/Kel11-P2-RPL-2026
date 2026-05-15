'use client'

import { ReactNode, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface ConfirmActionFormProps {
  action: (formData: FormData) => void | Promise<void>
  itemName: string
  title?: string
  message?: string
  confirmLabel?: string
  destructive?: boolean
  children: ReactNode
}

export default function ConfirmActionForm({
  action,
  itemName,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  destructive = true,
  children,
}: ConfirmActionFormProps) {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form
        ref={formRef}
        action={action}
        onSubmit={(event) => {
          if (confirmed) {
            window.setTimeout(() => setConfirmed(false), 0)
            return
          }
          event.preventDefault()
          setOpen(true)
        }}
      >
        {children}
      </form>
      <ConfirmDialog
        open={open}
        title={title}
        itemName={itemName}
        message={message}
        confirmLabel={confirmLabel}
        destructive={destructive}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setConfirmed(true)
          setOpen(false)
          window.requestAnimationFrame(() => {
            formRef.current?.requestSubmit()
          })
        }}
      />
    </>
  )
}
