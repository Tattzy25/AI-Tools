import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  Link,
  Unlink,
  Play,
  Save,
  Download,
  Copy,
  Trash2,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { timeAsync } from '../hooks/usePerfMonitor';

const apiMapperSchema = z.object({
  sourceEndpoint: z.string().url('Please enter a valid URL'),
  targetEndpoint: z.string().url('Please enter a valid URL'),
  sourceMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  targetMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  sourceAuth: z.object({
    type: z.enum(['none', 'apikey', 'bearer', 'basic']),
    credentials: z.string().optional()
  }),
  targetAuth: z.object({
    type: z.enum(['none', 'apikey', 'bearer', 'basic']),
    credentials: z.string().optional()
  }),
  mappingRules: z.array(z.object({
    sourceField: z.string().min(1, 'Source field is required'),
    targetField: z.string().min(1, 'Target field is required'),
    transformationType: z.enum(['direct', 'format', 'calculate', 'conditional']),
    isRequired: z.boolean(),
    defaultValue: z.string().optional()
  })).min(1, 'At least one mapping rule is required')
});

type ApiMapperForm = z.infer<typeof apiMapperSchema>;

const ApiMapper = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{
    sourceStatus: 'idle' | 'loading' | 'success' | 'error';
    targetStatus: 'idle' | 'loading' | 'success' | 'error';
    sourceData?: any;
    transformedData?: any;
    error?: string;
  }>({
    sourceStatus: 'idle',
    targetStatus: 'idle'
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm<ApiMapperForm>({
    resolver: zodResolver(apiMapperSchema),
    defaultValues: {
      sourceMethod: 'GET',
      targetMethod: 'POST',
      sourceAuth: { type: 'none' },
      targetAuth: { type: 'none' },
      mappingRules: [
        { sourceField: '', targetField: '', transformationType: 'direct', isRequired: true }
      ]
    }
  });

  const mappingRules = watch('mappingRules') || [];

  const addMappingRule = () => {
    const newRules = [...mappingRules, {
      sourceField: '',
      targetField: '',
      transformationType: 'direct' as const,
      isRequired: true
    }];
    setValue('mappingRules', newRules);
  };

  const removeMappingRule = (index: number) => {
    if (mappingRules.length <= 1) {
      toast({ title: 'Validation', description: 'At least one mapping rule is required', variant: 'destructive' });
      return;
    }
    const newRules = mappingRules.filter((_, i) => i !== index);
    setValue('mappingRules', newRules);
  };

  const getAuthHeaders = (auth: { type: string; credentials?: string }) => {
    const headers: Record<string, string> = {};
    
    switch (auth.type) {
      case 'apikey':
        headers['X-API-Key'] = auth.credentials || '';
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${auth.credentials || ''}`;
        break;
      case 'basic':
        headers['Authorization'] = `Basic ${btoa(auth.credentials || '')}`;
        break;
    }
    
    return headers;
  };

  const transformData = (sourceData: any, rules: any[]) => {
    const transformed: Record<string, any> = {};
    
    rules.forEach(rule => {
      if (rule.isRequired || sourceData[rule.sourceField] !== undefined) {
        let value = sourceData[rule.sourceField];
        
        // Apply transformation based on type
        switch (rule.transformationType) {
          case 'format':
            if (typeof value === 'string' && rule.format) {
              value = rule.format.replace('{value}', value);
            }
            break;
          case 'calculate':
            if (rule.formula) {
              // Simple calculation support
              try {
                value = eval(rule.formula.replace('{value}', value));
              } catch {
                value = sourceData[rule.sourceField];
              }
            }
            break;
          case 'conditional':
            if (rule.condition && rule.conditionValue) {
              value = value === rule.conditionValue ? rule.trueValue : rule.falseValue;
            }
            break;
        }
        
        transformed[rule.targetField] = value !== undefined ? value : rule.defaultValue;
      }
    });
    
    return transformed;
  };

  const testConnection = async (data: ApiMapperForm) => {
    setTestResults({ sourceStatus: 'loading', targetStatus: 'idle' });
    
    try {
      // Test source endpoint
      const sourceHeaders = getAuthHeaders(data.sourceAuth);
      const sourceResponse = await timeAsync('sourceRequest', () => axios({
        method: data.sourceMethod,
        url: data.sourceEndpoint,
        headers: sourceHeaders,
        timeout: 10000
      }));
      
      setTestResults(prev => ({
        ...prev,
        sourceStatus: 'success',
        sourceData: sourceResponse.data
      }));
      
      // Transform data
      const transformedData = transformData(sourceResponse.data, data.mappingRules);
      setTestResults(prev => ({ ...prev, transformedData }));
      
      // Test target endpoint with transformed data
      setTestResults(prev => ({ ...prev, targetStatus: 'loading' }));
      
      const targetHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(data.targetAuth)
      };
      
      const targetResponse = await timeAsync('targetRequest', () => axios({
        method: data.targetMethod,
        url: data.targetEndpoint,
        headers: targetHeaders,
        data: transformedData,
        timeout: 10000
      }));
      
      setTestResults(prev => ({
        ...prev,
        targetStatus: 'success'
      }));
      
      toast({ title: 'Success', description: 'Both endpoints connected successfully!' });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Connection failed';
      setTestResults(prev => ({
        ...prev,
        sourceStatus: prev.sourceStatus === 'loading' ? 'error' : prev.sourceStatus,
        targetStatus: prev.targetStatus === 'loading' ? 'error' : prev.targetStatus,
        error: errorMessage
      }));
      toast({ title: 'Connection failed', description: errorMessage, variant: 'destructive' });
    }
  };

  const copyMappingConfig = () => {
    const config = {
      sourceEndpoint: watch('sourceEndpoint'),
      targetEndpoint: watch('targetEndpoint'),
      mappingRules: mappingRules
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast({ title: 'Copied', description: 'Mapping configuration copied to clipboard' });
  };

  const downloadMappingConfig = () => {
    const config = {
      sourceEndpoint: watch('sourceEndpoint'),
      targetEndpoint: watch('targetEndpoint'),
      sourceMethod: watch('sourceMethod'),
      targetMethod: watch('targetMethod'),
      mappingRules: mappingRules,
      createdAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'api-mapping-config.json';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Mapping configuration downloaded' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Endpoint Mapper</h1>
        <p className="text-gray-600">
          Connect two API endpoints with intelligent data mapping and transformation capabilities.
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSubmit(testConnection)} className="space-y-8">
        {/* Source and Target Endpoints */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Source Endpoint */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Source Endpoint
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-sm">Method</Label>
                <Controller
                  name="sourceMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div>
                <Label className="mb-1 block text-sm">URL</Label>
                <Input type="url" {...register('sourceEndpoint')} placeholder="https://api.example.com/data" />
                {errors.sourceEndpoint && (
                  <p className="text-red-500 text-sm mt-1">{errors.sourceEndpoint.message}</p>
                )}
              </div>
              
              <div>
                <Label className="mb-1 block text-sm">Authentication</Label>
                <Controller
                  name="sourceAuth.type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Authentication" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              {watch('sourceAuth.type') !== 'none' && (
                <div>
                  <Label className="mb-1 block text-sm">Credentials</Label>
                  <Input type="password" {...register('sourceAuth.credentials')} placeholder="Enter your API key or token" />
                </div>
              )}
            </div>
          </div>

          {/* Target Endpoint */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Target Endpoint
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-sm">Method</Label>
                <Controller
                  name="targetMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div>
                <Label className="mb-1 block text-sm">URL</Label>
                <Input type="url" {...register('targetEndpoint')} placeholder="https://api.example.com/target" />
                {errors.targetEndpoint && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetEndpoint.message}</p>
                )}
              </div>
              
              <div>
                <Label className="mb-1 block text-sm">Authentication</Label>
                <Controller
                  name="targetAuth.type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Authentication" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              {watch('targetAuth.type') !== 'none' && (
                <div>
                  <Label className="mb-1 block text-sm">Credentials</Label>
                  <Input type="password" {...register('targetAuth.credentials')} placeholder="Enter your API key or token" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapping Rules */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mapping Rules</h3>
            <Button type="button" onClick={addMappingRule} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
          
          <div className="space-y-4">
            {mappingRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <Input {...register(`mappingRules.${index}.sourceField`)} placeholder="Source field (e.g., user.name)" />
                </div>
                
                <div className="flex items-center gap-2 text-gray-500">
                  <ArrowRight className="h-4 w-4" />
                  <Controller
                    name={`mappingRules.${index}.transformationType` as const}
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="format">Format</SelectItem>
                          <SelectItem value="calculate">Calculate</SelectItem>
                          <SelectItem value="conditional">Conditional</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                <div className="flex-1">
                  <Input {...register(`mappingRules.${index}.targetField`)} placeholder="Target field (e.g., customer.fullName)" />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`required-${index}`} checked={rule.isRequired} onCheckedChange={(checked) => setValue(`mappingRules.${index}.isRequired`, !!checked)} />
                    <Label htmlFor={`required-${index}`}>Required</Label>
                  </div>
                  
                  <Button type="button" variant="ghost" onClick={() => removeMappingRule(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {errors.mappingRules && (
            <p className="text-red-500 text-sm mt-2">{errors.mappingRules.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={copyMappingConfig} className="inline-flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Config
            </Button>
            
            <Button type="button" variant="outline" onClick={downloadMappingConfig} className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Config
            </Button>
          </div>
          
          <Button type="submit" className="inline-flex items-center gap-2">
            <Play className="h-4 w-4" />
            Test Connection
          </Button>
        </div>
      </form>

      {/* Test Results */}
      {(testResults.sourceStatus !== 'idle' || testResults.targetStatus !== 'idle') && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Endpoint Result */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Source Endpoint</h4>
                {testResults.sourceStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {testResults.sourceStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                {testResults.sourceStatus === 'loading' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>}
              </div>
              
              {testResults.sourceData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-auto max-h-40">
                    {JSON.stringify(testResults.sourceData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            {/* Target Endpoint Result */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">Target Endpoint</h4>
                {testResults.targetStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {testResults.targetStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                {testResults.targetStatus === 'loading' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>}
              </div>
              
              {testResults.transformedData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-auto max-h-40">
                    {JSON.stringify(testResults.transformedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
          
          {testResults.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 font-medium">Error:</span>
              </div>
              <p className="text-red-600 mt-1">{testResults.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiMapper;