import { AnalysisResult } from '../types'

const getApiBase = () => {
  return ''
}

export const analyzeImages = async (images: File[]): Promise<AnalysisResult[]> => {
  const batch = images.slice(0, 5)
  const endpoint = `${getApiBase()}/api/analyze-image`
  const results: AnalysisResult[] = []
  for (const file of batch) {
    const form = new FormData()
    form.append('image', file)
    const resp = await fetch(endpoint, { method: 'POST', body: form })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const result = await resp.json()
    const ai = (result?.visual_analysis?.ai_analysis) || {}
    const objects = Array.isArray(ai.objects)
      ? ai.objects.map((o: unknown) => {
          const obj = o as { name?: string; object?: string; confidence?: number }
          return { name: String(obj.name ?? obj.object ?? ''), confidence: Number(obj.confidence ?? 0) }
        })
      : []
    const colors = Array.isArray(ai.colors)
      ? ai.colors.map((c: unknown) => {
          const col = c as { hex?: string; name?: string; color?: string; percentage?: number }
          return { hex: String(col.hex ?? ''), name: String(col.name ?? col.color ?? ''), percentage: Number(col.percentage ?? 0) }
        })
      : []
    const text = Array.isArray(ai.text) ? ai.text.map((t: unknown) => String(t)) : []
    const description = String(ai.description ?? ai.image_description ?? '')
    const confidence = typeof ai.confidence === 'number' ? Number(ai.confidence) : 0
    const fmt = result?.file_metadata?.file_info?.format
    const dim = result?.file_metadata?.dimensions
    const sizeStr = dim ? `${dim.width}x${dim.height}` : undefined
    const mapped: AnalysisResult = {
      confidence,
      description,
      objects,
      colors,
      text,
      metadata: { format: fmt, size: sizeStr, raw: result }
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