'use client'

import { Trans, t } from '@lingui/macro'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, CameraOff, CheckCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface QRScannerProps {
  onScan?: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera
      })

      setHasPermission(true)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)

        // Initialize ZXing reader
        const codeReader = new BrowserMultiFormatReader()
        codeReaderRef.current = codeReader

        try {
          const result = await codeReader.decodeOnceFromVideoDevice(
            undefined,
            videoRef.current
          )
          if (result) {
            const scannedData = result.getText()

            // Validate scanned data
            try {
              const parsedData = JSON.parse(scannedData)
              // Basic structure validation
              if (
                parsedData.id &&
                parsedData.name &&
                parsedData.type === 'guest'
              ) {
                setLastScanned(scannedData)
                setScanError(null)
                if (onScan) {
                  onScan(scannedData)
                }
                // Automatically stop scanning after successful scan
                stopScanning()
              } else {
                setScanError(t`Invalid QR code format. Guest code expected.`)
              }
            } catch (_parseError) {
              setScanError(
                t`QR code contains invalid data. Please try a different code.`
              )
            }
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            // QR code not found, continue scanning
            setScanError(
              t`QR code not found. Please bring it closer to the camera.`
            )
          } else {
            console.error('Error scanning QR:', error)
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'
            setScanError(t`Scanning error: ${errorMessage}`)
            if (onError) {
              onError(t`QR code scanning error: ${errorMessage}`)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
      if (onError) {
        onError(t`Failed to access camera`)
      }
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }
  }

  const simulateScan = () => {
    // Simulate scanning for testing
    const mockData = JSON.stringify({
      id: 'guest-1234567890-abc123def',
      name: 'Test Guest',
      type: 'guest',
      timestamp: new Date().toISOString(),
    })

    setLastScanned(mockData)
    if (onScan) {
      onScan(mockData)
    }
  }

  const handleManualInput = () => {
    const manualData = prompt(t`Enter QR data manually:`)
    if (manualData) {
      setLastScanned(manualData)
      if (onScan) {
        onScan(manualData)
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <Trans>QR Code Scanner</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Scan guest QR code</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video element for camera */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-64 bg-gray-100 rounded-lg ${
              isScanning ? 'block' : 'hidden'
            }`}
          />

          {!isScanning && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <CameraOff className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Overlay with frame for QR */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-lg bg-transparent"></div>
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              className="flex-1"
              disabled={hasPermission === false}
            >
              <Camera className="w-4 h-4 mr-2" />
              <Trans>Start Scanning</Trans>
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="flex-1">
              <CameraOff className="w-4 h-4 mr-2" />
              <Trans>Stop</Trans>
            </Button>
          )}

          <Button onClick={simulateScan} variant="outline" size="sm">
            <Trans>Test</Trans>
          </Button>
        </div>

        {/* Manual input */}
        <Button
          onClick={handleManualInput}
          variant="outline"
          className="w-full"
        >
          <Trans>Enter Manually</Trans>
        </Button>

        {/* Status */}
        {hasPermission === false && (
          <p className="text-sm text-red-600">
            <Trans>
              Camera access denied. Please allow camera access in browser
              settings.
            </Trans>
          </p>
        )}

        {scanError && isScanning && (
          <p className="text-sm text-orange-600">{scanError}</p>
        )}

        {/* Last scanned code */}
        {lastScanned && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                <Trans>Code Scanned</Trans>
              </span>
            </div>
            <p className="text-xs text-green-700 break-all">{lastScanned}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
