import React from 'react'
import { AnalysisResult } from '../../../types'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../../components/ui/accordion'
import { Button } from '../../../components/ui/button'
import { Copy } from 'lucide-react'

export function FinalJsonSection(props: { results: AnalysisResult[] }) {
  const { results } = props
  if (results.length === 0) return null
  if (results.length === 1) {
    const report = (results[0] as any)?.metadata?.raw || {}
    const text = JSON.stringify(report, null, 2)
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Final JSON Report</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm font-mono overflow-auto max-h-80 p-4 bg-muted rounded-md">{text}</pre>
          <div className="mt-2 flex justify-end">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(text)} className="inline-flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Final JSON Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {results.map((r, idx) => {
            const report = (r as any)?.metadata?.raw || {}
            const text = JSON.stringify(report, null, 2)
            return (
              <AccordionItem key={`final-${idx}`} value={`final-${idx}`}>
                <AccordionTrigger>{`Image ${idx + 1} — Final JSON`}</AccordionTrigger>
                <AccordionContent>
                  <pre className="text-sm font-mono overflow-auto max-h-80 p-4 bg-muted rounded-md">{text}</pre>
                  <div className="mt-2 flex justify-end">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(text)} className="inline-flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
          <AccordionItem value="combined">
            <AccordionTrigger>Combined JSON (expand to view)</AccordionTrigger>
            <AccordionContent>
              {(() => {
                const reports = results.map((x) => (x as any)?.metadata?.raw).filter(Boolean)
                const combined = { success: true, count: reports.length, reports }
                const combinedText = JSON.stringify(combined, null, 2)
                return (
                  <>
                    <pre className="text-sm font-mono overflow-auto max-h-80 p-4 bg-muted rounded-md">{combinedText}</pre>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" onClick={() => navigator.clipboard.writeText(combinedText)} className="inline-flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </>
                )
              })()}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}