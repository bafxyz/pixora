import * as React from 'react'
import { cn } from './utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  closeOnEscape?: boolean
  closeOnBackdrop?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      size = 'md',
      className,
      closeOnEscape = true,
      closeOnBackdrop = true,
      ...props
    },
    _ref
  ) => {
    const modalRef = React.useRef<HTMLDivElement>(null)

    // Scroll lock effect
    React.useEffect(() => {
      if (!isOpen) return

      // Store original body styles
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth

      // Apply scroll lock
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }, [isOpen])

    // Escape key handler
    React.useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, closeOnEscape, onClose])

    // Focus trap effect
    React.useEffect(() => {
      if (!isOpen) return

      const modal = modalRef.current
      if (!modal) return

      // Get all focusable elements
      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Store previously focused element
      const previouslyFocused = document.activeElement as HTMLElement

      // Focus first element
      firstElement?.focus()

      // Handle tab key
      const handleTab = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleTab)

      // Cleanup: restore focus
      return () => {
        document.removeEventListener('keydown', handleTab)
        previouslyFocused?.focus()
      }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    }

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdrop && event.target === event.currentTarget) {
        onClose()
      }
    }

    return (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose()
          }
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={modalRef}
          className={cn(
            'bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-auto',
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between p-6 border-b border-slate-200',
      className
    )}
    {...props}
  />
))

ModalHeader.displayName = 'ModalHeader'

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold text-slate-900', className)}
    {...props}
  />
))

ModalTitle.displayName = 'ModalTitle'

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-slate-600', className)} {...props} />
))

ModalDescription.displayName = 'ModalDescription'

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props} />
))

ModalContent.displayName = 'ModalContent'

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3 p-6 border-t border-slate-200',
      className
    )}
    {...props}
  />
))

ModalFooter.displayName = 'ModalFooter'

const ModalClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
      className
    )}
    {...props}
  >
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m11.7816 4.03157c.0824-.08238.0824-.21592 0-.2983-.0824-.08238-.2159-.08238-.2983 0l-3.73165 3.73165-3.73165-3.73165c-.08238-.08238-.21592-.08238-.2983 0-.08238.08238-.08238.21592 0 .2983l3.73165 3.73165-3.73165 3.73165c-.08238.0824.08238.2159 0 .2983.08238.0824.21592.0824.2983 0l3.73165-3.73165 3.73165 3.73165c.0824.0824.2159.0824.2983 0 .0824-.0824.0824-.2159 0-.2983l-3.73165-3.73165 3.73165-3.73165Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
    <span className="sr-only">Close</span>
  </button>
))

ModalClose.displayName = 'ModalClose'

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
}
