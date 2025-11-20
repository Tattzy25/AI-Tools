import Groq from 'groq-sdk'
import { groqKey } from './config'

export const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: false })