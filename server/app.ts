import * as express from 'express'
import cors from 'cors'
import analyzeRouter from './routes/analyze'
import generateDataRouter from './routes/generate-data'
import { corsOrigins } from './config'

const app = express()
app.use(cors({ origin: corsOrigins, credentials: false }))
app.use(express.json())
app.use(analyzeRouter)
app.use(generateDataRouter)

export default app