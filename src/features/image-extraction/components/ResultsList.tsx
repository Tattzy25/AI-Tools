import React from 'react'
import { AnalysisResult } from '../../../types'
import { Search, Palette, Type } from 'lucide-react'
import { TabKey } from '../hooks/useImageExtraction'

export function ResultsList(props: { results: AnalysisResult[]; previews: string[]; activeTab: TabKey }) {
  const { results, previews, activeTab } = props
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeTab === 'all' || activeTab === 'objects') && (
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

            {(activeTab === 'all' || activeTab === 'colors') && (
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

            {(activeTab === 'all' || activeTab === 'text') && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Type aria-hidden="true" className="h-4 w-4" />
                  Text Content
                </h4>
                <div className="text-sm text-muted-foreground">{result.text.length > 0 ? result.text.join(', ') : 'No text detected'}</div>
              </div>
            )}
          </div>
          <div className="mt-4" />
        </div>
      ))}
    </div>
  )
}