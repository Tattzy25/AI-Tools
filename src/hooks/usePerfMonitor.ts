import { create } from 'zustand'

type Metric = {
  name: string
  durationMs: number
  timestamp: number
}

type PerfState = {
  metrics: Metric[]
  thresholdMs: number
  addMetric: (m: Metric) => void
  setThreshold: (ms: number) => void
}

export const usePerfMonitor = create<PerfState>((set, get) => ({
  metrics: [],
  thresholdMs: 1500,
  addMetric: (m) => {
    set((s) => ({ metrics: [m, ...s.metrics].slice(0, 100) }))
  },
  setThreshold: (ms) => set({ thresholdMs: ms })
}))

export const timeAsync = async <T>(name: string, fn: () => Promise<T>) => {
  const start = performance.now()
  try {
    const result = await fn()
    return result
  } finally {
    const end = performance.now()
    usePerfMonitor.getState().addMetric({ name, durationMs: end - start, timestamp: Date.now() })
  }
}