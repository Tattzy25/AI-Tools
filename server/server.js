const express = require('express')
const cors = require('cors')
const multer = require('multer')
const Groq = require('groq-sdk')
const dotenv = require('dotenv')
const exifr = require('exifr')
const { imageSize } = require('image-size')

dotenv.config()

const app = express()
app.use(cors({ origin: ['http://localhost:5173'], credentials: false }))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || ''
const groq = new Groq({ apiKey: groqKey })

function toDataUrl(mime, buf) {
  return `data:${mime};base64,${buf.toString('base64')}`
}

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' })
    if (!groqKey) return res.status(500).json({ success: false, error: 'Missing GROQ_API_KEY' })

    const buf = req.file.buffer
    const mime = req.file.mimetype
    if (!mime || !mime.startsWith('image/')) {
      return res.status(415).json({ success: false, error: 'Unsupported media type. Please upload an image.' })
    }
    const sizeBytes = buf.length
    const sizeMb = +(sizeBytes / (1024 * 1024)).toFixed(2)

    const dim = imageSize(buf)
    const width = dim.width || 0
    const height = dim.height || 0
    const aspectRatio = `${width}:${height}`
    const megapixels = +((width * height) / 1_000_000).toFixed(2)
    let exif = {}
    try { exif = await exifr.parse(buf) || {} } catch {}

    const dataUrl = toDataUrl(mime, buf)

    const messages = [
      { role: 'system', content: 'You are a senior master level authoritarian extracting metadata from user provided images , Your final outcome is json only' },
      { role: 'user', content: [ { type: 'text', text: 'What is the metadata for this image?' }, { type: 'image_url', image_url: { url: dataUrl } } ] },
      { role: 'assistant', content: '' },
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
    for await (const chunk of stream) {
      const delta = (chunk && chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || ''
      aggregated += delta
    }

    const jsonText = aggregated.replace(/```json?\n?|```/g, '').trim()
    let aiJson = {}
    try { aiJson = JSON.parse(jsonText) } catch { aiJson = {} }

    const colors = Array.isArray(aiJson.color_palette)
      ? aiJson.color_palette.map((c) => ({ name: String(c.color||''), percentage: Number(c.percentage||0), hex: String(c.hex||'') }))
      : []
    const objects = Array.isArray(aiJson.objects_detected)
      ? aiJson.objects_detected.map((o) => ({ name: String(o.object||''), confidence: Number(o.confidence||0) }))
      : []

    const response = {
      success: true,
      timestamp: Date.now()/1000,
      extraction_method: 'hybrid',
      file_metadata: {
        file_info: { format: (dim.type||'').toUpperCase(), mode: 'RGB', size_bytes: sizeBytes, size_mb: sizeMb },
        dimensions: { width, height, aspect_ratio: aspectRatio, megapixels },
        exif: exif,
        camera_info: { make: exif.Make || '', model: exif.Model || '', software: exif.Software || '' },
      },
      visual_analysis: {
        ai_analysis: {
          description: String(aiJson.image_description || ''),
          objects,
          colors,
          text: Array.isArray(aiJson.text) ? aiJson.text : [],
          confidence: Number(aiJson.confidence || 0.9),
        },
        ai_model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      },
      summary: {
        format: (dim.type||'').toUpperCase(),
        dimensions: `${width}x${height}`,
        file_size: `${sizeMb.toFixed(2)} MB`,
        has_exif: !!exif && Object.keys(exif).length > 0,
        ai_generated: false,
        ai_description: String(aiJson.image_description || ''),
      }
    }

    return res.json(response)
  } catch (e) {
    return res.status(500).json({ success: false, error: e && e.message ? e.message : 'Server error' })
  }
})

const port = process.env.PORT ? Number(process.env.PORT) : 5000
app.listen(port, () => {
  console.log(`Hybrid analyzer server running on http://localhost:${port}`)
})