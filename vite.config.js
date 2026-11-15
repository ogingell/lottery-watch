import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development there is no Vercel, so serve api/lottery.js from the dev server.
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/lottery', async (req, res) => {
      const { default: handler } = await server.ssrLoadModule('/api/lottery.js')
      res.status = (code) => { res.statusCode = code; return res }
      res.json = (body) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)) }
      handler(req, res)
    })
  },
})

export default defineConfig({
  plugins: [react(), devApi()],
  server: { port: 5220 },
})
