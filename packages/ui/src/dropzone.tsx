import { Upload } from 'lucide-react'
import * as React from 'react'
import { cn } from './utils'

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  maxFiles?: number
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

interface DropzoneContentProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  icon?: React.ReactNode
  title?: string
  description?: string
}

const DropzoneContent = React.forwardRef<
  HTMLDivElement,
  DropzoneContentProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      accept,
      multiple,
      maxSize,
      maxFiles,
      icon,
      title = 'Drag & drop files here or click to select',
      description,
      className,
      ...props
    },
    ref
  ) => {
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    const getAcceptDescription = (accept?: string) => {
      if (!accept) return 'All files'
      return accept
        .split(',')
        .map((type) => {
          if (type.startsWith('.')) return type
          if (type.includes('/*')) return `${type.replace('/*', '')} files`
          return type
        })
        .join(', ')
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center p-6 text-center',
          className
        )}
        {...props}
      >
        {icon || <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />}
        <p className="text-gray-600 mb-2">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 mb-2">{description}</p>
        )}
        <div className="text-xs text-gray-400 space-y-1">
          {accept && <p>Accepts: {getAcceptDescription(accept)}</p>}
          {maxSize && <p>Max size: {formatFileSize(maxSize)}</p>}
          {maxFiles && <p>Max files: {maxFiles}</p>}
          {!multiple && <p>Single file only</p>}
        </div>
      </div>
    )
  }
)

DropzoneContent.displayName = 'DropzoneContent'

const Dropzone = React.forwardRef<HTMLButtonElement, DropzoneProps>(
  (
    {
      onFilesSelected,
      accept,
      multiple = true,
      maxSize,
      maxFiles,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isDragActive, setIsDragActive] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const validateFiles = React.useCallback(
      (files: File[]): { valid: File[]; errors: string[] } => {
        const valid: File[] = []
        const errors: string[] = []

        if (maxFiles && files.length > maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`)
          return { valid: [], errors }
        }

        files.forEach((file) => {
          // Check file type
          if (accept) {
            const acceptedTypes = accept.split(',').map((type) => type.trim())
            const isAccepted = acceptedTypes.some((type) => {
              if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase())
              }
              if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -2))
              }
              return file.type === type
            })

            if (!isAccepted) {
              errors.push(`${file.name} is not an accepted file type`)
              return
            }
          }

          // Check file size
          if (maxSize && file.size > maxSize) {
            errors.push(`${file.name} exceeds maximum size limit`)
            return
          }

          valid.push(file)
        })

        return { valid, errors }
      },
      [accept, maxFiles, maxSize]
    )

    const handleFiles = React.useCallback(
      (files: FileList | null) => {
        if (!files || files.length === 0) return

        setError(null)
        const fileList = Array.from(files)

        if (!multiple && fileList.length > 1) {
          setError('Only one file is allowed')
          return
        }

        const { valid, errors } = validateFiles(fileList)

        if (errors.length > 0) {
          setError(errors.join('; '))
          return
        }

        onFilesSelected(valid)
      },
      [multiple, onFilesSelected, validateFiles]
    )

    const handleDragOver = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) {
          setIsDragActive(true)
        }
      },
      [disabled]
    )

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
    }, [])

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)

        if (!disabled) {
          handleFiles(e.dataTransfer.files)
        }
      },
      [disabled, handleFiles]
    )

    const handleClick = () => {
      if (!disabled) {
        fileInputRef.current?.click()
      }
    }

    const handleFileInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
        // Reset input value to allow selecting the same file again
        e.target.value = ''
      },
      [handleFiles]
    )

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'border-2 border-dashed rounded-lg transition-colors cursor-pointer w-full',
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400',
          error && 'border-red-300 bg-red-50',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children || (
          <DropzoneContent
            accept={accept}
            multiple={multiple}
            maxSize={maxSize}
            maxFiles={maxFiles}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {error && (
          <div className="mt-2 text-sm text-red-600 text-center px-4">
            {error}
          </div>
        )}
      </button>
    )
  }
)

Dropzone.displayName = 'Dropzone'

export { Dropzone, DropzoneContent }
