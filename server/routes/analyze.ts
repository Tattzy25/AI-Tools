import * as express from 'express'
import * as multer from 'multer'
import exifr from 'exifr'
import { imageSize } from 'image-size'
import { parse as parseCsv } from 'csv-parse/sync'
import { XMLParser } from 'fast-xml-parser'
import { groq } from '../groq'
import { groqKey, groqModel } from '../config'
import { toDataUrl, isSupportedMime } from '../utils'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

router.post('/api/analyze-image', upload.single('image'), async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' })
    if (!groqKey) return res.status(500).json({ success: false, error: 'Missing GROQ_API_KEY' })

    const buf = req.file.buffer
    const mime = req.file.mimetype
    const { isImage, isText, isJson, isCsv, isXml } = isSupportedMime(mime)
    if (!isImage && !isText && !isJson && !isCsv && !isXml) {
      return res.status(415).json({ success: false, error: 'Unsupported media type. Allowed: image, txt, json, csv, xml.' })
    }
    const sizeBytes = buf.length
    const sizeMb = +(sizeBytes / (1024 * 1024)).toFixed(2)

    let dim: any = { type: '', width: 0, height: 0 }
    let width = 0, height = 0, aspectRatio = '', megapixels = 0
    let exifData: any = {}
    let visual: any = undefined
    let contentAnalysis: any = undefined
    let csvReport = ''

    if (isImage) {
      dim = imageSize(buf)
      width = dim.width || 0
      height = dim.height || 0
      aspectRatio = `${width}:${height}`
      megapixels = +((width * height) / 1_000_000).toFixed(2)
      try { exifData = await exifr.parse(buf) || {} } catch {}

      const dataUrl = toDataUrl(mime, buf)
      const messages: any[] = [
        { role: 'system', content: 'Return STRICT JSON describing the image ONLY. Include: image_description, objects_detected[{object,confidence}], color_palette[{color,hex,percentage}], text[], confidence. JSON only.' },
        { role: 'user', content: [ { type: 'text', text: 'Analyze this image.' }, { type: 'image_url', image_url: { url: dataUrl } } ] },
      ]
      const stream = await groq.chat.completions.create({ model: groqModel, messages, temperature: 1, max_completion_tokens: 4096, top_p: 1, stream: true })
      let aggregated = ''
      for await (const chunk of stream as any) {
        const delta = chunk?.choices?.[0]?.delta?.content || ''
        aggregated += delta
      }
      const jsonText = aggregated.replace(/```json?\n?|```/g, '').trim()
      let aiJson: any = {}
      try { aiJson = JSON.parse(jsonText) } catch { aiJson = {} }
      const colors = Array.isArray(aiJson?.color_palette) ? aiJson.color_palette.map((c: any) => ({ name: String(c.color||''), percentage: Number(c.percentage||0), hex: String(c.hex||'') })) : []
      const objects = Array.isArray(aiJson?.objects_detected) ? aiJson.objects_detected.map((o: any) => ({ name: String(o.object||''), confidence: Number(o.confidence||0) })) : []
      visual = { description: String(aiJson?.image_description || ''), objects, colors, text: Array.isArray(aiJson?.text) ? aiJson.text : [] }
      if (typeof aiJson?.confidence === 'number') visual.confidence = Number(aiJson.confidence)
      csvReport = [ 'metric,value', `width,${width}`, `height,${height}`, `megapixels,${megapixels}`, `colors,${colors.length}`, `objects,${objects.length}` ].join('\n')
    } else if (isText) {
      const text = buf.toString('utf-8')
      const lines = text.split(/\r?\n/)
      const words = text.trim().split(/\s+/).filter(Boolean)
      contentAnalysis = { character_count: text.length, word_count: words.length, line_count: lines.length }
      const summaryMsg = [ { role: 'system', content: 'Summarize in 2 sentences and 5 key phrases. JSON: {"summary":"...","key_phrases":["..."]} only.' }, { role: 'user', content: text.slice(0, 10000) } ]
      try {
        const resp = await groq.chat.completions.create({ model: groqModel, messages: summaryMsg, temperature: 0.3 })
        const s = resp.choices?.[0]?.message?.content || '{}'
        const clean = s.replace(/```json?\n?|```/g, '').trim()
        const parsed = JSON.parse(clean)
        contentAnalysis.summary = parsed.summary || ''
        contentAnalysis.key_phrases = parsed.key_phrases || []
      } catch {}
      csvReport = [ 'metric,value', `characters,${contentAnalysis.character_count}`, `words,${contentAnalysis.word_count}`, `lines,${contentAnalysis.line_count}` ].join('\n')
    } else if (isJson) {
      let parsed: any = {}
      try { parsed = JSON.parse(buf.toString('utf-8')) } catch { parsed = null }
      const isArray = Array.isArray(parsed)
      const rootType = parsed === null ? 'invalid' : isArray ? 'array' : typeof parsed === 'object' ? 'object' : typeof parsed
      const keysCount = rootType === 'object' ? Object.keys(parsed).length : 0
      const depth = (() => { const walk=(o:any,d:number):number=> (o&&typeof o==='object')?Math.max(...Object.values(o).map(v=>walk(v,d+1)),d):d; return walk(parsed,1) })()
      contentAnalysis = { parse_ok: parsed !== null, root_type: rootType, keys_count: keysCount, depth }
      csvReport = [ 'metric,value', `parse_ok,${contentAnalysis.parse_ok}`, `root_type,${rootType}`, `keys_count,${keysCount}`, `depth,${depth}` ].join('\n')
    } else if (isCsv) {
      let records: any[] = []
      try { records = parseCsv(buf.toString('utf-8'), { columns: true, skip_empty_lines: true }) } catch {}
      const rows = records.length
      const cols = rows ? Object.keys(records[0]).length : 0
      contentAnalysis = { rows, columns: cols, headers: rows ? Object.keys(records[0]) : [] }
      const header = contentAnalysis.headers as string[]
      const sampleRows = records.slice(0, 5)
      const csvLines = [ header.join(',') , ...sampleRows.map(r => header.map(h => String(r[h] ?? '')).join(',')) ]
      csvReport = csvLines.join('\n')
    } else {
      const parser = new XMLParser({ ignoreAttributes: false })
      let parsed: any = {}
      try { parsed = parser.parse(buf.toString('utf-8')) } catch { parsed = null }
      const rootName = parsed ? Object.keys(parsed)[0] : ''
      const depth = (() => { const walk=(o:any,d:number):number=> (o&&typeof o==='object')?Math.max(...Object.values(o).map(v=>walk(v,d+1)),d):d; return walk(parsed,1) })()
      contentAnalysis = { parse_ok: !!parsed, root: rootName, depth }
      csvReport = [ 'metric,value', `parse_ok,${contentAnalysis.parse_ok}`, `root,${rootName}`, `depth,${depth}` ].join('\n')
    }

    const response: any = {
      success: true,
      timestamp: Date.now()/1000,
      extraction_method: 'hybrid',
      file_metadata: {
        file_info: { format: (isImage ? (dim.type||'').toUpperCase() : isText ? 'TXT' : isJson ? 'JSON' : isCsv ? 'CSV' : 'XML'), mode: isImage ? 'RGB' : undefined, size_bytes: sizeBytes, size_mb: sizeMb },
        dimensions: isImage ? { width, height, aspect_ratio: aspectRatio, megapixels } : undefined,
        exif: isImage ? exifData : undefined,
        camera_info: isImage ? { make: exifData?.Make || '', model: exifData?.Model || '', software: exifData?.Software || '' } : undefined,
      },
      visual_analysis: isImage ? { ai_analysis: visual } : undefined,
      content_analysis: !isImage ? contentAnalysis : undefined,
      csv_report: csvReport,
      summary: {
        format: isImage ? (dim.type||'').toUpperCase() : (isText ? 'TXT' : isJson ? 'JSON' : isCsv ? 'CSV' : 'XML'),
        dimensions: isImage ? `${width}x${height}` : undefined,
        file_size: `${sizeMb.toFixed(2)} MB`,
        has_exif: isImage ? (!!exifData && Object.keys(exifData).length > 0) : false,
        ai_generated: false,
        ai_description: isImage ? String(visual?.description || '') : undefined,
      }
    }
    return res.json(response)
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Server error' })
  }
})

export default router