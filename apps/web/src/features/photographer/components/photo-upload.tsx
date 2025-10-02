import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Dropzone } from '@repo/ui/dropzone'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Spinner } from '@repo/ui/spinner'
import { AlertCircle, Upload, X } from 'lucide-react'
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

  const handleFileSelect = useCallback(
    (selectedFiles: File[] | FileList | null) => {
      if (!selectedFiles) return

      const filesArray = Array.isArray(selectedFiles)
        ? selectedFiles
        : Array.from(selectedFiles)
      const newFiles: UploadFile[] = filesArray.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending' as const,
      }))

      setFiles((prev) => [...prev, ...newFiles])
    },
    []
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
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue

        // Update status to uploading
        setFiles((prev) =>
          prev.map((f, index) =>
            index === i
              ? { ...f, status: 'uploading' as const, progress: 0 }
              : f
          )
        )

        const url = await uploadFile(file, i)
        if (url) {
          uploadedUrls.push(url)
          setFiles((prev) =>
            prev.map((f, index) =>
              index === i
                ? { ...f, status: 'completed' as const, progress: 100 }
                : f
            )
          )
        }
      }

      if (uploadedUrls.length > 0) {
        // Call the API to save photo metadata
        const saveResponse = await fetch('/api/photos/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoSessionId: sessionId,
            photoUrls: uploadedUrls,
          }),
        })

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json()
          throw new Error(errorData.error || 'Failed to save photos')
        }

        onUploadComplete(uploadedUrls, sessionId)
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
        />

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
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} Photo{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
