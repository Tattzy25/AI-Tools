import app from './app'
import { port } from './config'

app.listen(port, () => {
  console.log(`Hybrid analyzer server running on http://localhost:${port}`)
})