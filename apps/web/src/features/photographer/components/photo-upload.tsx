import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Dropzone } from '@repo/ui/dropzone'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Spinner } from '@repo/ui/spinner'
import { AlertCircle, Upload, X, Zap } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/shared/lib/supabase/client'

interface PhotoUploadProps {
  onUploadComplete: (uploadedUrls: string[], sessionId: string) => void
  onUploadError: (error: string) => void
  presetSessionId?: string
}

interface UploadFile {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export function PhotoUpload({
  onUploadComplete,
  onUploadError,
  presetSessionId,
}: PhotoUploadProps) {
  const { _ } = useLingui()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [sessionId, setSessionId] = useState(presetSessionId || '')
  const supabase = createClient()

  // Update ID when preset changes
  useEffect(() => {
    if (presetSessionId) {
      setSessionId(presetSessionId)
    }
  }, [presetSessionId])

  const compressImage = useCallback(async (file: File): Promise<File> => {
    // If file is already small enough, return as-is
    if (file.size <= 2 * 1024 * 1024) return file // 2MB threshold

    return new Promise<File>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      const img = document.createElement('img')

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        let { width, height } = img
        const maxWidth = 1920
        const maxHeight = 1080

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          0.85 // Quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleFileSelect = useCallback(
    async (selectedFiles: File[] | FileList | null) => {
      if (!selectedFiles) return

      const filesArray = Array.isArray(selectedFiles)
        ? selectedFiles
        : Array.from(selectedFiles)

      // Process files with compression
      const processedFiles = await Promise.all(
        filesArray.map(async (file) => {
          const processedFile = file.type.startsWith('image/')
            ? await compressImage(file)
            : file
          return {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file: processedFile,
            preview: URL.createObjectURL(processedFile),
            progress: 0,
            status: 'pending' as const,
          }
        })
      )

      setFiles((prev) => [...prev, ...processedFiles])
    },
    [compressImage]
  )

  const uploadFile = useCallback(
    async (uploadFile: UploadFile, index: number): Promise<string | null> => {
      try {
        const fileExt = uploadFile.file.name.split('.').pop()
        const fileName = `${sessionId}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`

        const { error } = await supabase.storage
          .from('photos')
          .upload(fileName, uploadFile.file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          throw error
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL')
        }

        return urlData.publicUrl
      } catch (error) {
        console.error('Upload error:', error)
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  status: 'error' as const,
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        )
        return null
      }
    },
    [sessionId, supabase]
  )

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !sessionId.trim()) return

    setIsUploading(true)
    const uploadedPhotos: Array<{ url: string; fileSize: number }> = []

    try {
      // Upload files in batches of 5 to avoid overwhelming the browser
      const batchSize = 5
      for (
        let batchStart = 0;
        batchStart < files.length;
        batchStart += batchSize
      ) {
        const batch = files.slice(batchStart, batchStart + batchSize)

        // Upload batch in parallel
        const uploadPromises = batch.map(async (file, batchIndex) => {
          const actualIndex = batchStart + batchIndex

          // Update status to uploading
          setFiles((prev) =>
            prev.map((f, index) =>
              index === actualIndex
                ? { ...f, status: 'uploading' as const, progress: 0 }
                : f
            )
          )

          const url = await uploadFile(file, actualIndex)
          if (url) {
            uploadedPhotos.push({
              url,
              fileSize: file.file.size,
            })
            setFiles((prev) =>
              prev.map((f, index) =>
                index === actualIndex
                  ? { ...f, status: 'completed' as const, progress: 100 }
                  : f
              )
            )
          }
          return url
        })

        await Promise.all(uploadPromises)
      }

      if (uploadedPhotos.length > 0) {
        // Call the API to save photo metadata
        const saveResponse = await fetch('/api/photos/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoSessionId: sessionId,
            photos: uploadedPhotos,
          }),
        })

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json()
          throw new Error(errorData.error || 'Failed to save photos')
        }

        onUploadComplete(
          uploadedPhotos.map((p) => p.url),
          sessionId
        )
        // Clear completed files
        setFiles((prev) => prev.filter((f) => f.status !== 'completed'))
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [files, sessionId, uploadFile, onUploadComplete, onUploadError])

  const clearAllFiles = useCallback(() => {
    files.forEach((file) => {
      URL.revokeObjectURL(file.preview)
    })
    setFiles([])
  }, [files])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Photo Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <Dropzone
          onFilesSelected={handleFileSelect}
          accept="image/*"
          multiple={true}
          maxSize={10 * 1024 * 1024} // 10MB
          maxFiles={100} // Allow up to 100 files at once
          showCameraButton={true}
        >
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">
              <Trans>Drag & drop photos here or click to select</Trans>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              <Trans>Upload multiple photos at once from your device</Trans>
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                <Trans>Accepts: JPG, PNG, HEIC, RAW files</Trans>
              </p>
              <p>
                <Trans>Max size: 10MB per file (auto-compressed)</Trans>
              </p>
              <p>
                <Trans>Max files: 100 photos at once</Trans>
              </p>
            </div>
          </div>
        </Dropzone>

        {/* Session ID Input - only show if not preset */}

        {/* Session ID Input */}
        <div className="space-y-2">
          <Label htmlFor="session-id">Photo Session ID</Label>
          <Input
            id="session-id"
            placeholder="Enter photo session ID"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            required
          />
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected Files ({files.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFiles}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                    <Image
                      src={file.preview}
                      alt={`Preview of ${file.file.name}`}
                      fill
                      className="object-cover"
                    />
                    {file.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Spinner
                            size="sm"
                            className="mx-auto mb-2 text-white"
                          />
                          <p className="text-sm">{file.progress}%</p>
                        </div>
                      </div>
                    )}
                    {file.status === 'completed' && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mb-2">
                            ✓
                          </div>
                          <p className="text-sm">Done</p>
                        </div>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                        <div className="text-white text-center">
                          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                          <p className="text-sm">Error</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFiles((prev) => prev.filter((f) => f.id !== file.id))
                      URL.revokeObjectURL(file.preview)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isUploading}
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="mt-2">
                    <p className="text-xs text-gray-600 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                <Trans>Uploading photos...</Trans>
              </span>
              <span className="text-sm text-blue-700">
                {files.filter((f) => f.status === 'completed').length} /{' '}
                {files.length}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(files.filter((f) => f.status === 'completed').length / files.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading || !sessionId.trim()}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                Uploading...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Upload {files.length} Photo{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
