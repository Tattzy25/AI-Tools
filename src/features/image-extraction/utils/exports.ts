import { AnalysisResult } from '../../../types'

export function buildExportJsonPayload(results: AnalysisResult[]) {
  const reports = results
    .map((r) => r.metadata.raw)
    .filter((r): r is Record<string, unknown> => !!r)
  return reports.length > 1 ? { success: true, count: reports.length, reports } : (reports[0] || {})
}

export function buildCombinedCsv(results: AnalysisResult[]) {
  const reports = results
    .map((r) => r.metadata.raw as { csv_report?: string } | undefined)
    .filter(Boolean)
  const combined = reports
    .map((rep, idx) => String(rep?.csv_report ?? '')
      .split('\n').filter(Boolean)
      .map(line => `file_${idx + 1},${line}`).join('\n'))
    .join('\n')
  return combined
}

export function buildSingleCsv(result: AnalysisResult) {
  const report = result.metadata.raw as { csv_report?: string } | undefined
  const csv = report?.csv_report ?? ''
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