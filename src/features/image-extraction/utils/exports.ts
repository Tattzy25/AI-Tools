import { AnalysisResult } from '../../../types'

export function buildExportJsonPayload(results: AnalysisResult[]) {
  const reports = results.map((r: any) => r?.metadata?.raw).filter(Boolean)
  return reports.length > 1 ? { success: true, count: reports.length, reports } : (reports[0] || {})
}

export function buildCombinedCsv(results: AnalysisResult[]) {
  const reports = results.map((r: any) => r?.metadata?.raw).filter(Boolean)
  const combined = reports
    .map((rep, idx) => String(rep?.csv_report || '')
      .split('\n').filter(Boolean)
      .map(line => `file_${idx + 1},${line}`).join('\n'))
    .join('\n')
  return combined
}

export function buildSingleCsv(result: AnalysisResult) {
  const report = (result as any)?.metadata?.raw || {}
  const csv = report?.csv_report || ''
  return String(csv)
}

export function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}