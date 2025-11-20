import React from 'react'
import { Button } from '../../../components/ui/button'
import { Download } from 'lucide-react'
import { AnalysisResult } from '../../../types'
import { buildExportJsonPayload, buildSingleCsv, buildCombinedCsv, downloadBlob } from '../utils/exports'

export function ExportActions(props: { results: AnalysisResult[]; toast: { success: Function } }) {
  const { results, toast } = props
  const exportJson = () => {
    const payload = buildExportJsonPayload(results)
    const dataStr = JSON.stringify(payload, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    downloadBlob(blob, 'image-analysis-results.json')
    toast.success('Results downloaded successfully')
  }
  const exportCsv = () => {
    const reports = results.map((r: any) => r?.metadata?.raw).filter(Boolean)
    if (reports.length === 0) return
    if (reports.length === 1) {
      const csv = buildSingleCsv(results[0])
      const blob = new Blob([csv], { type: 'text/csv' })
      downloadBlob(blob, 'analysis-report.csv')
      toast.success('CSV downloaded')
    } else {
      const combined = buildCombinedCsv(results)
      const blob = new Blob([combined], { type: 'text/csv' })
      downloadBlob(blob, 'combined-analysis-report.csv')
      toast.success('Combined CSV downloaded')
    }
  }
  return (
    <div className="flex gap-2">
      <Button onClick={exportJson} className="inline-flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export JSON
      </Button>
      <Button variant="outline" onClick={exportCsv} className="inline-flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  )
}