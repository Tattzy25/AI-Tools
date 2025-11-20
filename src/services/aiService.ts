import Groq from 'groq-sdk'
import { ImageAnalysis, AnalysisResult } from '../types';

const groqKey = import.meta.env.VITE_GROQ_API_KEY
const groq = new Groq({ apiKey: groqKey || '', dangerouslyAllowBrowser: true })

export const analyzeImages = async (images: File[]): Promise<AnalysisResult[]> => {
  if (!groqKey) throw new Error('Missing VITE_GROQ_API_KEY')
  const batch = images.slice(0, 5)
  const results: AnalysisResult[] = []

  for (const image of batch) {
    const dataUrl = await fileToBase64(image)

    const messages: any[] = [
      {
        role: 'system',
        content:
          'You are a senior master level authoritarian extracting metadata from user provided images , Your final outcome is json only',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is the metadata for this image?' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
      {
        role: 'assistant',
        content:
          '```\n{\n  "image_description": "A person\'s hands forming a heart shape around the sun during sunset",\n  "objects_detected": [\n    {\n      "object": "hands",\n      "confidence": 0.9,\n      "location": [\n        0.2,\n        0.3\n      ]\n    },\n    {\n      "object": "sun",\n      "confidence": 0.95,\n      "location": [\n        0.45,\n        0.2\n      ]\n    },\n    {\n      "object": "water",\n      "confidence": 0.8,\n      "location": [\n        0.5,\n        0.6\n      ]\n    }\n  ],\n  "color_palette": [\n    {\n      "color": "orange",\n      "percentage": 30\n    },\n    {\n      "color": "yellow",\n      "percentage": 20\n    },\n    {\n      "color": "blue",\n      "percentage": 20\n    }\n  ],\n  "exif_data": {\n    "orientation": "horizontal",\n    "dpi": 300,\n    "camera_make": "Canon",\n    "camera_model": "EOS 5D Mark III"\n  },\n  "image_properties": {\n    "width": 1024,\n    "height": 768,\n    "file_size": 245,\n    "file_format": "JPEG"\n  }\n}\n```',
      },
      { role: 'user', content: '' },
    ]

    const stream = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages,
      temperature: 1,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: true,
      stop: null,
    })

    let aggregated = ''
    for await (const chunk of stream as any) {
      const delta = chunk?.choices?.[0]?.delta?.content || ''
      aggregated += delta
    }

    const jsonText = aggregated.replace(/```json?\n?|```/g, '').trim()
    const parsed = JSON.parse(jsonText)
    results.push(mapGroqImageMetadata(parsed, image))
  }

  return results
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Removed mock results generator to enforce real functionality only

export const generateDataWithAI = async (
  horizontalHeaders: string[],
  verticalHeaders: string[],
  dataTypes: Record<string, string>,
  creativityLevel: number
) => {
  if (!groqKey) {
    throw new Error('Missing VITE_GROQ_API_KEY')
  }

  const prompt = `Generate realistic tabular data as JSON array of rows.\nHeaders: ${JSON.stringify(horizontalHeaders)}\nRows: ${JSON.stringify(verticalHeaders)}\nTypes: ${JSON.stringify(dataTypes)}\nCreativity: ${creativityLevel}\nReturn only JSON, no prose.`

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    temperature: creativityLevel,
    max_tokens: 2000,
  })
  const responseText = completion.choices?.[0]?.message?.content || '[]'
  return JSON.parse(responseText)
};

function namedColorToHex(name: string) {
  const map: Record<string, string> = {
    orange: '#FFA500',
    yellow: '#FFFF00',
    blue: '#0000FF',
    red: '#FF0000',
    green: '#008000',
    purple: '#800080',
    pink: '#FFC0CB',
    black: '#000000',
    white: '#FFFFFF',
    gray: '#808080',
    brown: '#A52A2A',
  }
  return map[name.toLowerCase()] || '#000000'
}

function mapGroqImageMetadata(raw: any, file: File): AnalysisResult {
  const colors = Array.isArray(raw?.color_palette)
    ? raw.color_palette.map((c: any) => ({
        name: String(c.color || ''),
        percentage: Number(c.percentage || 0),
        hex: namedColorToHex(String(c.color || '')),
      }))
    : []
  const objects = Array.isArray(raw?.objects_detected)
    ? raw.objects_detected.map((o: any) => ({
        name: String(o.object || ''),
        confidence: Number(o.confidence || 0),
      }))
    : []
  const props = raw?.image_properties || {}
  const exif = raw?.exif_data || {}
  const size = props?.width && props?.height ? `${props.width}x${props.height}` : undefined
  return {
    confidence: 0.9,
    description: String(raw?.image_description || ''),
    text: [],
    colors,
    objects,
    metadata: {
      format: props?.file_format || file.type,
      size,
      exif,
      properties: props,
    },
  }
}