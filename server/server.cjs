const express = require('express')
const cors = require('cors')
const multer = require('multer')
const Groq = require('groq-sdk')
const dotenv = require('dotenv')
const exifr = require('exifr')
const { imageSize } = require('image-size')
const { parse } = require('csv-parse/sync')
const { XMLParser } = require('fast-xml-parser')

dotenv.config()

const app = express()
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({ origin: corsOrigins, credentials: false }))
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || ''
const groqModel = process.env.GROQ_MODEL_ID || 'meta-llama/llama-4-scout-17b-16e-instruct'
const groq = new Groq({ apiKey: groqKey })

function toDataUrl(mime, buf) {
  return `data:${mime};base64,${buf.toString('base64')}`
}

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  const allowedExtensions = ['json', 'csv', 'xml', 'jpg', 'png'];
  const fileExt = req.file.originalname.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(fileExt)) {
    return res.status(400).json({ error: 'Unsupported file type. Only JSON, CSV, XML, JPG, PNG allowed.' });
  }
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' })
    if (!groqKey) return res.status(500).json({ success: false, error: 'Missing GROQ_API_KEY' })

    const buf = req.file.buffer
    const mime = req.file.mimetype
    const isImage = !!mime && mime.startsWith('image/')
    const isText = mime === 'text/plain'
    const isJson = mime === 'application/json' || mime === 'application/ld+json'
    const isCsv = mime === 'text/csv' || mime === 'application/vnd.ms-excel'
    const isXml = mime === 'application/xml' || mime === 'text/xml'
    if (!isImage && !isText && !isJson && !isCsv && !isXml) {
      return res.status(415).json({ success: false, error: 'Unsupported media type. Allowed: image, txt, json, csv, xml.' })
    }
    const sizeBytes = buf.length
    const sizeMb = +(sizeBytes / (1024 * 1024)).toFixed(2)

    let dim = { type: '', width: 0, height: 0 }
    let width = 0, height = 0, aspectRatio = '', megapixels = 0
    let exif = {}
    let visual = undefined
    let contentAnalysis = undefined
    let csvReport = ''

    if (isImage) {
      dim = imageSize(buf)
      width = dim.width || 0
      height = dim.height || 0
      aspectRatio = `${width}:${height}`
      megapixels = +((width * height) / 1_000_000).toFixed(2)
      try { exif = await exifr.parse(buf) || {} } catch {}

      const dataUrl = toDataUrl(mime, buf)
      const messages = [
        { role: 'system', content: 'Return STRICT JSON describing the image ONLY. Include: image_description, objects_detected[{object,confidence}], color_palette[{color,hex,percentage}], text[], confidence. JSON only.' },
        { role: 'user', content: [ { type: 'text', text: 'Analyze this image.' }, { type: 'image_url', image_url: { url: dataUrl } } ] },
      ]
      const stream = await groq.chat.completions.create({ model: groqModel, messages, temperature: 1, max_completion_tokens: 4096, top_p: 1, stream: true })
      let aggregated = ''
      for await (const chunk of stream) {
        const delta = (chunk && chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || ''
        aggregated += delta
      }
      const jsonText = aggregated.replace(/```json?\n?|```/g, '').trim()
      let aiJson = {}
      try { aiJson = JSON.parse(jsonText) } catch { aiJson = {} }
      const colors = Array.isArray(aiJson.color_palette) ? aiJson.color_palette.map((c) => ({ name: String(c.color||''), percentage: Number(c.percentage||0), hex: String(c.hex||'') })) : []
      const objects = Array.isArray(aiJson.objects_detected) ? aiJson.objects_detected.map((o) => ({ name: String(o.object||''), confidence: Number(o.confidence||0) })) : []
      visual = { description: String(aiJson.image_description || ''), objects, colors, text: Array.isArray(aiJson.text) ? aiJson.text : [] }
      if (typeof aiJson.confidence === 'number') visual.confidence = Number(aiJson.confidence)
      csvReport = [ 'metric,value', `width,${width}`, `height,${height}`, `megapixels,${megapixels}`, `colors,${colors.length}`, `objects,${objects.length}` ].join('\n')
    } else if (isText) {
      const text = buf.toString('utf-8')
      const lines = text.split(/\r?\n/)
      const words = text.trim().split(/\s+/).filter(Boolean)
      contentAnalysis = { character_count: text.length, word_count: words.length, line_count: lines.length }
      csvReport = [ 'metric,value', `characters,${contentAnalysis.character_count}`, `words,${contentAnalysis.word_count}`, `lines,${contentAnalysis.line_count}` ].join('\n')
    } else if (isJson) {
      let parsed = {}
      try { parsed = JSON.parse(buf.toString('utf-8')) } catch { parsed = null }
      const isArray = Array.isArray(parsed)
      const rootType = parsed === null ? 'invalid' : isArray ? 'array' : typeof parsed === 'object' ? 'object' : typeof parsed
      const keysCount = rootType === 'object' ? Object.keys(parsed).length : 0
      const depth = (() => { const walk=(o,d)=> (o&&typeof o==='object')?Math.max(...Object.values(o).map(v=>walk(v,d+1)),d):d; return walk(parsed,1) })()
      contentAnalysis = { parse_ok: parsed !== null, root_type: rootType, keys_count: keysCount, depth }
      csvReport = [ 'metric,value', `parse_ok,${contentAnalysis.parse_ok}`, `root_type,${rootType}`, `keys_count,${keysCount}`, `depth,${depth}` ].join('\n')
    } else if (isCsv) {
      let records = []
      try { records = parse(buf.toString('utf-8'), { columns: true, skip_empty_lines: true }) } catch {}
      const rows = records.length
      const cols = rows ? Object.keys(records[0]).length : 0
      contentAnalysis = { rows, columns: cols, headers: rows ? Object.keys(records[0]) : [] }
      const header = contentAnalysis.headers
      const sampleRows = records.slice(0, 5)
      const csvLines = [ header.join(',') , ...sampleRows.map(r => header.map(h => String(r[h] ?? '')).join(',')) ]
      csvReport = csvLines.join('\n')
    } else {
      const parser = new XMLParser({ ignoreAttributes: false })
      let parsed = {}
      try { parsed = parser.parse(buf.toString('utf-8')) } catch { parsed = null }
      const rootName = parsed ? Object.keys(parsed)[0] : ''
      const depth = (() => { const walk=(o,d)=> (o&&typeof o==='object')?Math.max(...Object.values(o).map(v=>walk(v,d+1)),d):d; return walk(parsed,1) })()
      contentAnalysis = { parse_ok: !!parsed, root: rootName, depth }
      csvReport = [ 'metric,value', `parse_ok,${contentAnalysis.parse_ok}`, `root,${rootName}`, `depth,${depth}` ].join('\n')
    }

    const response = {
      success: true,
      timestamp: Date.now()/1000,
      extraction_method: 'hybrid',
      file_metadata: {
        file_info: { format: (isImage ? (dim.type||'').toUpperCase() : isText ? 'TXT' : isJson ? 'JSON' : isCsv ? 'CSV' : 'XML'), mode: isImage ? 'RGB' : undefined, size_bytes: sizeBytes, size_mb: sizeMb },
        dimensions: isImage ? { width, height, aspect_ratio: aspectRatio, megapixels } : undefined,
        exif: isImage ? exif : undefined,
        camera_info: isImage ? { make: exif.Make || '', model: exif.Model || '', software: exif.Software || '' } : undefined,
      },
      visual_analysis: isImage ? { ai_analysis: visual } : undefined,
      content_analysis: !isImage ? contentAnalysis : undefined,
      csv_report: csvReport,
      summary: {
        format: (() => {
          if (isImage) {
            return (dim.type || '').toUpperCase()
          } else if (isText) {
            return 'TXT'
          } else if (isJson) {
            return 'JSON'
          } else if (isCsv) {
            return 'CSV'
          } else {
            return 'XML'
          }
        })(),
        dimensions: isImage ? `${width}x${height}` : undefined,
        file_size: `${sizeMb.toFixed(2)} MB`,
        has_exif: isImage ? (!!exif && Object.keys(exif).length > 0) : false,

        ai_generated: false,
        ai_description: isImage ? String((visual && visual.description) || '') : undefined,
      }
    }
    return res.json(response)
  } catch (e) {
    return res.status(500).json({ success: false, error: e && e.message ? e.message : 'Server error' })
  }
})

 

app.post('/api/generate-data', async (req, res) => {
  try {
    const { horizontalHeaders, verticalHeaders, dataTypes, creativityLevel } = req.body || {}
    if (!Array.isArray(horizontalHeaders) || !Array.isArray(verticalHeaders)) {
      return res.status(400).json({ success: false, error: 'Invalid headers' })
    }
    if (!groqKey) return res.status(500).json({ success: false, error: 'Missing GROQ_API_KEY' })
    const prompt = [
      'Generate a 2D array of strings representing a table.',
      `Columns: ${JSON.stringify(horizontalHeaders)}`,
      `Rows: ${JSON.stringify(verticalHeaders)}`,
      `Types: ${JSON.stringify(dataTypes || {})}`,
      'Return STRICT JSON: {"data": [["cell11","cell12",...],[...], ...]} with length matching rows and columns.',
    ].join('\n')
    const resp = await groq.chat.completions.create({
      model: groqModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: typeof creativityLevel === 'number' ? creativityLevel : 0.5,
      max_tokens: 2000,
    })
    const raw = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '{}'
    const clean = raw.replace(/```json?\n?|```/g, '').trim()
    let parsed = {}
    try { parsed = JSON.parse(clean) } catch { parsed = {} }
    const data = Array.isArray(parsed.data) ? parsed.data : []
    return res.json({ success: true, data })
  } catch (e) {
    return res.status(500).json({ success: false, error: e && e.message ? e.message : 'Server error' })
  }
})

const port = process.env.PORT ? Number(process.env.PORT) : 5000
app.listen(port, () => {
  console.log(`Hybrid analyzer server running on http://localhost:${port}`)
})
