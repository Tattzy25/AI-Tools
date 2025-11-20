import React from 'react'
import { Upload, Eye } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/tooltip'

export function UploadDropzone(props: { getRootProps: any; getInputProps: any; isDragActive: boolean }) {
  const { getRootProps, getInputProps, isDragActive } = props
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Eye aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>Drag and drop or click to select files (max 10MB)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-muted' : 'border-border hover:border-ring'
        }`}
      >
        <input {...getInputProps()} />
        <Upload aria-hidden="true" className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          {isDragActive ? 'Drop the images here...' : 'Drag & drop images here, or click to select'}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports JPG, PNG, GIF, WebP, TXT, JSON, CSV, XML (max 10MB per file)
        </p>
      </div>
    </div>
  )
}