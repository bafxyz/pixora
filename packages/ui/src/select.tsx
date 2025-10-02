'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from './utils'

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
)

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      {children}
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })

  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement)

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  const handleClick = () => {
    updatePosition()
    context?.setIsOpen(!context.isOpen)
  }

  if (!context) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {context.isOpen && (
        <SelectContentInternal
          onClose={() => context.setIsOpen(false)}
          position={position}
        />
      )}
    </div>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

export function SelectValue({ children }: { children?: React.ReactNode }) {
  return <span>{children}</span>
}

let selectContentChildren: React.ReactNode = null

export function SelectContent({ children }: { children: React.ReactNode }) {
  selectContentChildren = children
  return null
}

function SelectContentInternal({
  onClose,
  position,
}: {
  onClose: () => void
  position: { top: number; left: number; width: number }
}) {
  const context = React.useContext(SelectContext)
  const ref = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!context || !mounted) return null

  const content = (
    <div
      ref={ref}
      className="fixed z-[9999] max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
      style={{
        top: `${position.top + 4}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      {selectContentChildren}
    </div>
  )

  return createPortal(content, document.body)
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

export function SelectItem({ value, children }: SelectItemProps) {
  const context = React.useContext(SelectContext)

  if (!context) return null

  const handleSelect = () => {
    context.onValueChange(value)
    context.setIsOpen(false)
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm outline-none hover:bg-gray-100 transition-colors',
        context.value === value && 'bg-blue-50 text-blue-600 font-medium'
      )}
    >
      {children}
    </button>
  )
}
