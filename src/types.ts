export interface ImageAnalysis {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageMetadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  analysisResults: AnalysisResult;
  createdAt: Date;
  completedAt?: Date;
  processingTime?: number;
}

export interface AnalysisResult {
  confidence: number;
  objects: Array<{
    name: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  colors: Array<{
    hex: string;
    name: string;
    percentage: number;
  }>;
  text: string[];
  description: string;
  metadata: {
    format?: string;
    size?: string;
    raw?: Record<string, unknown>;
  };
}

export interface DataGeneration {
  id: string;
  userId: string;
  horizontalHeaders: string[];
  verticalHeaders: string[];
  dataTypes: Record<string, string>;
  creativityLevel: number;
  generatedData: string[][];
  createdAt: Date;
  isTemplate: boolean;
  templateName?: string;
}

export interface ApiMapping {
  id: string;
  userId: string;
  sourceEndpoint: string;
  targetEndpoint: string;
  sourceAuth: {
    type: 'none' | 'apikey' | 'bearer' | 'basic';
    credentials?: string;
  };
  targetAuth: {
    type: 'none' | 'apikey' | 'bearer' | 'basic';
    credentials?: string;
  };
  mappingConfiguration: {
    rules: MappingRule[];
    transformations: TransformationRule[];
  };
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  successCount: number;
  failureCount: number;
}

export interface MappingRule {
  id: string;
  sourceField: string;
  targetField: string;
  transformationType: 'direct' | 'format' | 'calculate' | 'conditional';
  isRequired: boolean;
  defaultValue?: string;
}

export interface TransformationRule {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  config: Record<string, unknown>;
  executionOrder: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'user' | 'premium' | 'admin';
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UsageTracking {
  id: string;
  userId: string;
  featureType: 'image_analysis' | 'data_generation' | 'api_mapping';
  operationType: string;
  requestDetails: Record<string, unknown>;
  tokensUsed: number;
  createdAt: Date;
  ipAddress?: string;
}