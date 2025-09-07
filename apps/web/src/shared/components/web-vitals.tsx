'use client'

import { useEffect } from 'react'

export function WebVitals() {
  useEffect(() => {
    // Simple performance monitoring without external dependencies
    // This provides basic performance insights

    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number
          }
          if (lastEntry) {
            console.log('LCP:', lastEntry.startTime, 'ms')
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(
            (entry: PerformanceEntry & { processingStart?: number }) => {
              if (entry.processingStart && entry.startTime) {
                console.log(
                  'FID:',
                  entry.processingStart - entry.startTime,
                  'ms'
                )
              }
            }
          )
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Monitor Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach(
            (
              entry: PerformanceEntry & {
                hadRecentInput?: boolean
                value?: number
              }
            ) => {
              if (!entry.hadRecentInput && entry.value) {
                clsValue += entry.value
              }
            }
          )
          console.log('CLS:', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

        // Cleanup observers on unmount
        return () => {
          lcpObserver.disconnect()
          fidObserver.disconnect()
          clsObserver.disconnect()
        }
      } catch (error) {
        console.warn('Performance monitoring not supported:', error)
      }
    }

    // Fallback: Monitor basic page load metrics
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            'navigation'
          )[0] as PerformanceNavigationTiming
          if (navigation) {
            console.log('Page Load Metrics:', {
              domContentLoaded:
                navigation.domContentLoadedEventEnd -
                navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              totalTime: navigation.loadEventEnd - navigation.fetchStart,
            })
          }
        }, 0)
      })
    }
  }, [])

  return null
}
