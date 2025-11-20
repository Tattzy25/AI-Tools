import { AnalysisResult } from '../types'

const getApiBase = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  return apiBase ? `${apiBase}` : ''
}

export const analyzeImages = async (images: File[]): Promise<AnalysisResult[]> => {
  const batch = images.slice(0, 5)
  const endpoint = `${getApiBase()}/api/analyze-image`
  const results: AnalysisResult[] = []
  for (const file of batch) {
    const formData = new FormData()
    formData.append('image', file)
    const resp = await fetch(endpoint, { method: 'POST', body: formData })
    const result = await resp.json()
    const mapped: AnalysisResult = {
      confidence: typeof result?.visual_analysis?.ai_analysis?.confidence === 'number' ? result.visual_analysis.ai_analysis.confidence : 0,
      description: result?.visual_analysis?.ai_analysis?.description || '',
      objects: (result?.visual_analysis?.ai_analysis?.objects || []).map((o: any) => ({ name: o.name, confidence: o.confidence })),
      colors: (result?.visual_analysis?.ai_analysis?.colors || []).map((c: any) => ({ hex: c.hex, name: c.name, percentage: c.percentage })),
      text: result?.visual_analysis?.ai_analysis?.text || [],
      metadata: { format: result?.summary?.format, size: result?.summary?.dimensions, raw: result },
    }
    results.push(mapped)
  }
  return results
}

export const generateDataWithAI = async (
  horizontalHeaders: string[],
  verticalHeaders: string[],
  dataTypes: Record<string, string>,
  creativityLevel: number
): Promise<string[][]> => {
  const endpoint = `${getApiBase()}/api/generate-data`
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ horizontalHeaders, verticalHeaders, dataTypes, creativityLevel }),
  })
  const json = await resp.json()
  return Array.isArray(json?.data) ? json.data : []
}