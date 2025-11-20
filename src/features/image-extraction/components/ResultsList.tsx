import React from 'react'
import { AnalysisResult } from '../../../types'
import { Search, Palette, Type, FileText, Code, FileSpreadsheet, Download } from 'lucide-react'
import { TabKey } from '../hooks/useImageExtraction'
import ButtonCopy from '../../../components/smoothui/button-copy'

export function ResultsList(props: { results: AnalysisResult[]; previews: string[]; activeTab: TabKey }) {
  const { results, previews, activeTab } = props

  const getJsonData = (result: AnalysisResult) => {
    return JSON.stringify({
      confidence: result.confidence,
      objects: result.objects,
      colors: result.colors,
      text: result.text,
      description: result.description,
      metadata: result.metadata
    }, null, 2)
  }

  const getCsvData = (result: AnalysisResult) => {
    const headers = ['Type', 'Name', 'Confidence', 'Details']
    const rows = [
      ...result.objects.map(obj => ['Object', obj.name, `${(obj.confidence * 100).toFixed(1)}%`, '']),
      ...result.colors.map(color => ['Color', color.name, `${color.percentage.toFixed(1)}%`, color.hex]),
      ...result.text.map(text => ['Text', text, '', ''])
    ]
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }
  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <div key={index} className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={previews[index]} alt={`Result ${index + 1}`} className="w-16 h-16 object-cover rounded-lg" />
            <div>
              <h3 className="font-medium text-foreground">Image {index + 1}</h3>
              {typeof result.confidence === 'number' && (
                <p className="text-sm text-muted-foreground">{`Confidence: ${(result.confidence * 100).toFixed(1)}%`}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            {activeTab === 'all' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Search aria-hidden="true" className="h-4 w-4" />
                    Objects Detected
                  </h4>
                  <div className="space-y-1">
                    {result.objects.map((obj, i) => (
                      <div key={i} className="text-sm text-muted-foreground">{`${obj.name} (${(obj.confidence * 100).toFixed(1)}%)`}</div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Palette aria-hidden="true" className="h-4 w-4" />
                    Color Palette
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: color.hex }} />
                        <span className="text-xs text-muted-foreground">{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Type aria-hidden="true" className="h-4 w-4" />
                    Text Content
                  </h4>
                  <div className="text-sm text-muted-foreground">{result.text.length > 0 ? result.text.join(', ') : 'No text detected'}</div>
                </div>
              </div>
            )}

            {activeTab === 'objects' && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Objects Detected
                </h4>
                <div className="space-y-1">
                  {result.objects.map((obj, i) => (
                    <div key={i} className="text-sm text-muted-foreground">{`${obj.name} (${(obj.confidence * 100).toFixed(1)}%)`}</div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Palette aria-hidden="true" className="h-4 w-4" />
                  Color Palette
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color.hex }} />
                      <span className="text-xs text-muted-foreground">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Type aria-hidden="true" className="h-4 w-4" />
                  Text Content
                </h4>
                <div className="text-sm text-muted-foreground">{result.text.length > 0 ? result.text.join(', ') : 'No text detected'}</div>
              </div>
            )}

            {activeTab === 'description' && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    Description
                  </h4>
                  <ButtonCopy
                    onCopy={async () => {
                      await navigator.clipboard.writeText(result.description)
                    }}
                    idleIcon={<Download size={16} />}
                    duration={2000}
                  />
                </div>
                <div className="text-sm text-muted-foreground">{result.description || 'No description available'}</div>
              </div>
            )}

            {activeTab === 'json' && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Code aria-hidden="true" className="h-4 w-4" />
                    JSON Data
                  </h4>
                  <ButtonCopy
                    onCopy={async () => {
                      await navigator.clipboard.writeText(getJsonData(result))
                    }}
                    idleIcon={<Download size={16} />}
                    duration={2000}
                  />
                </div>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-48">{getJsonData(result)}</pre>
              </div>
            )}

            {activeTab === 'csv' && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
                    CSV Data
                  </h4>
                  <ButtonCopy
                    onCopy={async () => {
                      await navigator.clipboard.writeText(getCsvData(result))
                    }}
                    idleIcon={<Download size={16} />}
                    duration={2000}
                  />
                </div>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-48">{getCsvData(result)}</pre>
              </div>
            )}
          </div>
          <div className="mt-4" />
        </div>
      ))}
    </div>
  )
}