import dotenv from 'dotenv'

dotenv.config()

export const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean)
export const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || ''
export const groqModel = process.env.GROQ_MODEL_ID || 'meta-llama/llama-4-scout-17b-16e-instruct'
export const port = process.env.PORT ? Number(process.env.PORT) : 5000