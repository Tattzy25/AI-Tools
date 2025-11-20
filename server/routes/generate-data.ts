import * as express from 'express'
import { groq } from '../groq'
import { groqKey, groqModel } from '../config'

const router = express.Router()

router.post('/api/generate-data', async (req: express.Request, res: express.Response) => {
  try {
    const { horizontalHeaders, verticalHeaders, dataTypes, creativityLevel } = req.body as any
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
    const raw = resp.choices?.[0]?.message?.content || '{}'
    const clean = raw.replace(/```json?\n?|```/g, '').trim()
    let parsed: any = {}
    try { parsed = JSON.parse(clean) } catch { parsed = {} }
    const data: string[][] = Array.isArray(parsed?.data) ? parsed.data : []
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Server error' })
  }
})

export default router