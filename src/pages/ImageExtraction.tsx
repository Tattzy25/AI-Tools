import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { useImageExtraction } from '../features/image-extraction/hooks';
import { UploadDropzone, PreviewGrid, ResultsTabs, ResultsList, ExportActions, FinalJsonSection } from '../features/image-extraction/components';

const ImageExtraction = () => {
  const { toast } = useToast();
  const { images, imagePreviews, analysisResults, isAnalyzing, activeTab, setActiveTab, removeImage, analyze, dropzone, clearAll } = useImageExtraction({ success: (m: string) => toast({ title: 'Success', description: m }), error: (m: string) => toast({ title: 'Error', description: m, variant: 'destructive' }) } as any);
  const { getRootProps, getInputProps, isDragActive } = dropzone;


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Image Metadata Extraction</h1>
        <p className="text-muted-foreground">
          Upload multiple images and let AI extract detailed metadata including objects, colors, text, and visual information.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadDropzone getRootProps={getRootProps} getInputProps={getInputProps} isDragActive={isDragActive} />
          <PreviewGrid
            images={images}
            imagePreviews={imagePreviews}
            onRemove={removeImage}
            onAnalyze={analyze}
            onClear={clearAll}
            isAnalyzing={isAnalyzing}
          />
        </CardContent>
      </Card>
      
      {analysisResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analysis Results</CardTitle>
            <ExportActions results={analysisResults} toast={{ success: (msg: string) => toast({ title: 'Success', description: msg }) }} />
          </CardHeader>
          <CardContent>

          <ResultsTabs activeTab={activeTab as any} setActiveTab={setActiveTab as any} />

          <ResultsList results={analysisResults} previews={imagePreviews} activeTab={activeTab as any} />
          </CardContent>
        </Card>
      )}

      <FinalJsonSection results={analysisResults} />
    </div>
  );
};

export default ImageExtraction;