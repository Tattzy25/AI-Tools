import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image, 
  Palette, 
  Type, 
  Search,
  Download,
  Copy,
  Trash2,
  Eye
} from 'lucide-react';
import { analyzeImages } from '../services/aiService';
import { ImageAnalysis, AnalysisResult } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { timeAsync } from '../hooks/usePerfMonitor';

const ImageExtraction = () => {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'objects' | 'colors' | 'text' | 'all'>('all');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    if (validFiles.length !== acceptedFiles.length) {
      toast.error('Some files were rejected. Only images under 10MB are allowed.');
    }

    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  }, [images, imagePreviews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const analyzeImagesHandler = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    try {
      const batch = images.slice(0, 5);
      const hybridResults: any[] = [];
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const endpoint = apiBase ? `${apiBase}/api/analyze-image` : '/api/analyze-image';
      for (const file of batch) {
        const formData = new FormData();
        formData.append('image', file);
        const resp = await fetch(endpoint, { method: 'POST', body: formData });
        const result = await resp.json();
        hybridResults.push(result);
      }
      // Map hybrid JSON to UI-friendly structure
      const mapped = hybridResults.map((r) => ({
        confidence: typeof r?.visual_analysis?.ai_analysis?.confidence === 'number'
          ? r.visual_analysis.ai_analysis.confidence
          : undefined,
        objects: (r?.visual_analysis?.ai_analysis?.objects || []).map((o: any) => ({ name: o.name, confidence: o.confidence })),
        colors: (r?.visual_analysis?.ai_analysis?.colors || []).map((c: any) => ({ hex: c.hex, name: c.name, percentage: c.percentage })),
        text: r?.visual_analysis?.ai_analysis?.text || [],
        description: r?.visual_analysis?.ai_analysis?.description || '',
        metadata: { format: r?.summary?.format, size: r?.summary?.dimensions, raw: r },
      }));
      setAnalysisResults(mapped);
      toast({ title: 'Analysis complete', description: `Analyzed ${mapped.length} image(s)` });
    } catch (error) {
      toast({ title: 'Analysis failed', description: 'Please try again.', variant: 'destructive' });
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadResults = () => {
    const reports = analysisResults.map((r: any) => r?.metadata?.raw).filter(Boolean);
    const payload = reports.length > 1 ? { success: true, count: reports.length, reports } : (reports[0] || {});
    const dataStr = JSON.stringify(payload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'image-analysis-results.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Results downloaded successfully');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Metadata Extraction</h1>
        <p className="text-gray-600">
          Upload multiple images and let AI extract detailed metadata including objects, colors, text, and visual information.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Upload Images
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Drag and drop or click to select images (max 10MB)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-gray-600 mb-2">
            {isDragActive ? 'Drop the images here...' : 'Drag & drop images here, or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, GIF, WebP (max 10MB per image)
          </p>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Images ({images.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imagePreviews[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                    {(image.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-4">
              <Button onClick={analyzeImagesHandler} disabled={isAnalyzing} className="inline-flex items-center gap-2">
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze Images
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => { setImages([]); setImagePreviews([]); setAnalysisResults([]); }}>
                Clear All
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analysis Results</CardTitle>
            <div className="flex gap-2">
              <Button onClick={downloadResults} className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>

          {/* Results Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'all', label: 'All Results', icon: Image },
                  { id: 'objects', label: 'Objects', icon: Search },
                  { id: 'colors', label: 'Colors', icon: Palette },
                  { id: 'text', label: 'Text', icon: Type }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button key={tab.id} variant={activeTab === tab.id ? 'secondary' : 'ghost'} onClick={() => setActiveTab(tab.id as any)} className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Results Content */}
          <div className="space-y-6">
            {analysisResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={imagePreviews[index]}
                    alt={`Result ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">Image {index + 1}</h3>
                    {typeof result.confidence === 'number' && (
                      <p className="text-sm text-gray-600">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTab === 'all' || activeTab === 'objects' ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Objects Detected
                      </h4>
                      <div className="space-y-1">
                        {result.objects.map((obj, i) => (
                          <div key={i} className="text-sm text-gray-600">
                            {obj.name} ({(obj.confidence * 100).toFixed(1)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'all' || activeTab === 'colors' ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color Palette
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.colors.map((color, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-xs text-gray-600">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'all' || activeTab === 'text' ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Text Content
                      </h4>
                      <div className="text-sm text-gray-600">
                        {result.text.length > 0 ? result.text.join(', ') : 'No text detected'}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4" />
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {analysisResults.length === 1 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Final JSON Report</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const report = (analysisResults[0] as any)?.metadata?.raw || {};
              const text = JSON.stringify(report, null, 2);
              return (
                <>
                  <pre className="text-sm font-mono overflow-auto max-h-80 p-4 bg-muted rounded-md">{text}</pre>
                  <div className="mt-2 flex justify-end">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(text)} className="inline-flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {analysisResults.length > 1 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Final JSON Report (All Images)</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="combined">
                <AccordionTrigger>Combined JSON (expand to view)</AccordionTrigger>
                <AccordionContent>
                  {(() => {
                    const reports = analysisResults.map((r) => (r as any)?.metadata?.raw).filter(Boolean)
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
      )}
    </div>
  );
};

export default ImageExtraction;