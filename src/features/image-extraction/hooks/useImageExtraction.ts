import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { AnalysisResult } from '../../../types'
import { analyzeImages } from '../../../services/aiService'
import { timeAsync } from '../../../hooks/usePerfMonitor'

export type TabKey = 'objects' | 'colors' | 'text' | 'all' | 'description' | 'json' | 'csv'

export function useImageExtraction(toast: { success: Function; error: Function; }): {
  images: File[]
  imagePreviews: string[]
  analysisResults: AnalysisResult[]
  isAnalyzing: boolean
  activeTab: TabKey
  setActiveTab: (t: TabKey) => void
  onDrop: (files: File[]) => void
  removeImage: (index: number) => void
  analyze: () => Promise<void>
  dropzone: ReturnType<typeof useDropzone>
  clearAll: () => void
} {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024)
    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Some files were rejected. Only images under 10MB are allowed.')
    }
    const newImages = [...images, ...validFiles]
    setImages(newImages)
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }, [images])

  const dropzone = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    maxSize: 10 * 1024 * 1024
  })

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
    setAnalysisResults([])
  }

  const clearAll = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setImages([])
    setImagePreviews([])
    setAnalysisResults([])
  }

  const analyze = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }
    setIsAnalyzing(true)
    try {
      const mapped = await timeAsync('analyzeImages', () => analyzeImages(images.slice(0, 5)))
      setAnalysisResults(mapped)
      toast.success(`Analyzed ${mapped.length} image(s)`) 
    } catch (e) {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return { images, imagePreviews, analysisResults, isAnalyzing, activeTab, setActiveTab, onDrop, removeImage, analyze, dropzone, clearAll }
}