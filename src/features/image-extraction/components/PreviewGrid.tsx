import React from 'react'
import { Trash2, Search } from 'lucide-react'
import { Button } from '../../../components/ui/button'

export function PreviewGrid(props: {
  images: File[]
  imagePreviews: string[]
  onRemove: (index: number) => void
  onAnalyze: () => void
  onClear: () => void
  isAnalyzing: boolean
}) {
  const { images, imagePreviews, onRemove, onAnalyze, onClear, isAnalyzing } = props
  if (images.length === 0) return null
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-foreground mb-4">Selected Images ({images.length})</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img src={imagePreviews[index]} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
            <button onClick={() => onRemove(index)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-foreground/50 text-background text-xs p-1 rounded-b-lg">
              {(image.size / 1024 / 1024).toFixed(1)}MB
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-4">
        <Button onClick={onAnalyze} disabled={isAnalyzing} className="inline-flex items-center gap-2">
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Search aria-hidden="true" className="h-4 w-4" />
              Analyze Images
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClear}>Clear All</Button>
      </div>
    </div>
  )
}