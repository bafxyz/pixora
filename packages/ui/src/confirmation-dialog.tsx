import { AlertTriangle } from 'lucide-react'
import * as React from 'react'
import { Button } from './button'
import { Modal, ModalContent, ModalFooter, ModalHeader } from './modal'
import { cn } from './utils'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export const ConfirmationDialog = React.forwardRef<
  HTMLDivElement,
  ConfirmationDialogProps
>(
  (
    {
      isOpen,
      onClose,
      onConfirm,
      title = 'Confirm Action',
      description = 'Are you sure you want to perform this action?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'warning',
      isLoading = false,
    },
    _ref
  ) => {
    const handleConfirm = () => {
      onConfirm()
      onClose()
    }

    const variantStyles = {
      danger: {
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700',
      },
      warning: {
        icon: 'text-yellow-600',
        button: 'bg-yellow-600 hover:bg-yellow-700',
      },
      info: {
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
    }

    const styles = variantStyles[variant]

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full bg-opacity-10',
                variant === 'danger' && 'bg-red-100',
                variant === 'warning' && 'bg-yellow-100',
                variant === 'info' && 'bg-blue-100'
              )}
            >
              <AlertTriangle className={cn('w-5 h-5', styles.icon)} />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        </ModalHeader>
        <ModalContent>
          <p className="text-sm text-slate-600">{description}</p>
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </ModalFooter>
      </Modal>
    )
  }
)

ConfirmationDialog.displayName = 'ConfirmationDialog'

// Hook for easier usage
export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<
    Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>
  >({})
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback(
    (
      options: Omit<
        ConfirmationDialogProps,
        'isOpen' | 'onClose' | 'onConfirm'
      > = {}
    ): Promise<boolean> => {
      setConfig(options)
      setIsOpen(true)
      return new Promise((resolve) => {
        resolveRef.current = resolve
      })
    },
    []
  )

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
  }, [])

  const handleConfirm = React.useCallback(() => {
    setIsOpen(false)
    if (resolveRef.current) {
      resolveRef.current(true)
      resolveRef.current = null
    }
  }, [])

  const dialog = (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...config}
    />
  )

  return { confirm, dialog }
}
