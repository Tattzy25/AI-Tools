import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Download,
  Copy,
  RefreshCw,
  Save,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  DollarSign,
  Mail
} from 'lucide-react';
import { generateDataWithAI } from '../services/aiService';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip';
import { timeAsync } from '../hooks/usePerfMonitor';

const dataGeneratorSchema = z.object({
  horizontalHeaders: z.array(z.string().min(1)).min(1, 'At least one horizontal header is required'),
  verticalHeaders: z.array(z.string().min(1)).min(1, 'At least one vertical header is required'),
  creativityLevel: z.number().min(0).max(1),
  dataTypes: z.record(z.string())
});

type DataGeneratorForm = z.infer<typeof dataGeneratorSchema>;

const DataGenerator = () => {
  const [generatedData, setGeneratedData] = useState<string[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<DataGeneratorForm>({
    resolver: zodResolver(dataGeneratorSchema),
    defaultValues: {
      horizontalHeaders: ['Name', 'Email', 'Price', 'Date'],
      verticalHeaders: ['Product A', 'Product B', 'Product C'],
      creativityLevel: 0.5,
      dataTypes: {}
    }
  });

  const horizontalHeaders = watch('horizontalHeaders');
  const verticalHeaders = watch('verticalHeaders');
  const creativityLevel = watch('creativityLevel');
  const dataTypes = watch('dataTypes');

  const addHeader = (type: 'horizontal' | 'vertical') => {
    const currentHeaders = type === 'horizontal' ? horizontalHeaders : verticalHeaders;
    const newHeader = type === 'horizontal' ? `Column ${currentHeaders.length + 1}` : `Row ${currentHeaders.length + 1}`;
    
    setValue(
      type === 'horizontal' ? 'horizontalHeaders' : 'verticalHeaders',
      [...currentHeaders, newHeader]
    );
  };

  const removeHeader = (type: 'horizontal' | 'vertical', index: number) => {
    const currentHeaders = type === 'horizontal' ? horizontalHeaders : verticalHeaders;
    if (currentHeaders.length <= 1) {
      toast.error('At least one header is required');
      return;
    }
    
    setValue(
      type === 'horizontal' ? 'horizontalHeaders' : 'verticalHeaders',
      currentHeaders.filter((_, i) => i !== index)
    );
  };

  const updateHeader = (type: 'horizontal' | 'vertical', index: number, value: string) => {
    const currentHeaders = [...(type === 'horizontal' ? horizontalHeaders : verticalHeaders)];
    currentHeaders[index] = value;
    
    setValue(
      type === 'horizontal' ? 'horizontalHeaders' : 'verticalHeaders',
      currentHeaders
    );
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'boolean': return <ToggleLeft className="h-4 w-4" />;
      case 'currency': return <DollarSign className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const onSubmit = async (data: DataGeneratorForm) => {
    setIsGenerating(true);
    try {
      const result = await timeAsync('generateData', () => generateDataWithAI(
        data.horizontalHeaders,
        data.verticalHeaders,
        data.dataTypes,
        data.creativityLevel
      ));
      setGeneratedData(result);
      toast({ title: 'Data generated', description: 'Your dataset is ready.' });
    } catch (error) {
      toast({ title: 'Generation failed', description: 'Please try again.', variant: 'destructive' });
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const csvContent = [
      ['', ...horizontalHeaders].join(','),
      ...generatedData.map((row, index) => [verticalHeaders[index], ...row].join(','))
    ].join('\n');
    
    navigator.clipboard.writeText(csvContent);
    toast({ title: 'Copied', description: 'Data copied to clipboard as CSV' });
  };

  const downloadCSV = () => {
    const csvContent = [
      ['', ...horizontalHeaders].join(','),
      ...generatedData.map((row, index) => [verticalHeaders[index], ...row].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-data.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'CSV downloaded successfully' });
  };

  const updateCellValue = (row: number, col: number, value: string) => {
    const newData = [...generatedData];
    newData[row][col] = value;
    setGeneratedData(newData);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Smart Data Generator</h1>
        <p className="text-muted-foreground">
          Create custom data tables by defining horizontal and vertical headers. AI generates realistic data for each intersection.
        </p>
      </div>

      {/* Configuration Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Configuration
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Type aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>Define headers and types, then generate a dataset</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Horizontal Headers */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Horizontal Headers</h3>
              <div className="space-y-3">
                {horizontalHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader('horizontal', index, e.target.value)}
                      className="flex-1"
                      placeholder={`Header ${index + 1}`}
                    />
                    <Select value={dataTypes[header] || 'text'} onValueChange={(val) => {
                      const newDataTypes = { ...dataTypes };
                      newDataTypes[header] = val;
                      setValue('dataTypes', newDataTypes);
                    }}>
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" onClick={() => removeHeader('horizontal', index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="link" onClick={() => addHeader('horizontal')} className="inline-flex items-center gap-2">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Add Column
                </Button>
              </div>
            </div>

            {/* Vertical Headers */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Vertical Headers</h3>
              <div className="space-y-3">
                {verticalHeaders.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader('vertical', index, e.target.value)}
                      className="flex-1"
                      placeholder={`Row ${index + 1}`}
                    />
                    <Button type="button" variant="ghost" onClick={() => removeHeader('vertical', index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="link" onClick={() => addHeader('vertical')} className="inline-flex items-center gap-2">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Add Row
                </Button>
              </div>
            </div>
          </div>

          {/* Creativity Level */}
          <div className="mt-6">
            <Label className="mb-2 block">Creativity Level: {Math.round(creativityLevel * 100)}%</Label>
            <Input type="range" min="0" max="1" step="0.1" value={creativityLevel} onChange={(e) => setValue('creativityLevel', parseFloat(e.target.value))} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <Button type="submit" disabled={isGenerating} className="inline-flex items-center gap-2">
              {isGenerating ? (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  Generate Data
                </>
              )}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {generatedData.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-lg">Generated Data</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="inline-flex items-center gap-2">
                <Copy aria-hidden="true" className="h-4 w-4" />
                Copy CSV
              </Button>
              <Button onClick={downloadCSV} className="inline-flex items-center gap-2">
                <Download aria-hidden="true" className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">Generated Data</h3>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary"
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
                Copy CSV
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download CSV
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                  {horizontalHeaders.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-2">
                        {getDataTypeIcon(dataTypes[header] || 'text')}
                        {header}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {generatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {verticalHeaders[rowIndex]}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                          <Input type="text" value={cell} onChange={(e) => updateCellValue(rowIndex, colIndex, e.target.value)} onBlur={() => setEditingCell(null)} onKeyDown={(e) => { if (e.key === 'Enter') { setEditingCell(null); } }} autoFocus />
                        ) : (
                          <div
                            onClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                            className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                          >
                            {cell}
                          </div>
                        )}
                  </td>
                ))}
              </tr>
            ))}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataGenerator;