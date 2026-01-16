import express from 'express'
import fetch from 'node-fetch'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'

// Load .dev.vars into process.env when running the local Express server.
// This mirrors README instructions for local development.
try {
  const devVarsPath = path.resolve(process.cwd(), '.dev.vars')
  if (fs.existsSync(devVarsPath)) {
    const raw = fs.readFileSync(devVarsPath, 'utf8')
    raw.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) return
      const key = match[1]
      let val = match[2] || ''
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = val
      }
    })
  }
} catch (e) {
  console.warn('Failed to load .dev.vars:', e instanceof Error ? e.message : e)
}

// Inline minimal CORS headers (matching Cloudflare functions)
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Access-Password, X-Custom-LLM',
  'Access-Control-Expose-Headers': 'X-Quota-Exempt',
}

// Inline access password validator compatible with worker version
function validateAccessPassword(request: Request | Express.Request, env: Record<string, string> = {}) {
  // Express request header access
  // @ts-ignore
  const headers = (request as any).headers || (request as any).rawHeaders
  // try to get header
  // @ts-ignore
  const password = (request as any).headers?.['x-access-password'] || (request as any).get?.('X-Access-Password')
  const configuredPassword = env.ACCESS_PASSWORD

  if (!configuredPassword) {
    return { valid: true, exempt: false }
  }

  if (password) {
    if (password === configuredPassword) {
      return { valid: true, exempt: true }
    }
    return { valid: false, exempt: false }
  }

  return { valid: true, exempt: false }
}

const app = express()
app.use(bodyParser.json())

function setCors(res: express.Response) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v as string))
}

app.options('/api/*', (_req, res) => {
  setCors(res)
  res.sendStatus(204)
})

app.post('/api/chat', async (req, res) => {
  setCors(res)
  try {
    const env = process.env as unknown as Record<string, string>
    const { valid } = validateAccessPassword(req as unknown as Request, env as unknown as Record<string, string>)
    if (!valid) return res.status(401).json({ error: '访问密码错误' })

    const body = req.body
    const llmConfig = body.llmConfig

    const effectiveEnv: Record<string, string> = { ...(process.env as Record<string, string>) }
    if (llmConfig && llmConfig.apiKey) {
      effectiveEnv.AI_PROVIDER = llmConfig.provider || effectiveEnv.AI_PROVIDER
      effectiveEnv.AI_BASE_URL = llmConfig.baseUrl || effectiveEnv.AI_BASE_URL
      effectiveEnv.AI_API_KEY = llmConfig.apiKey
      effectiveEnv.AI_MODEL_ID = llmConfig.modelId || effectiveEnv.AI_MODEL_ID
    }

    const provider = effectiveEnv.AI_PROVIDER || 'openai'

    // Provide sensible defaults for provider base URLs when not set
    if (!effectiveEnv.AI_BASE_URL) {
      if (provider === 'anthropic') {
        effectiveEnv.AI_BASE_URL = 'https://api.anthropic.com/v1'
      } else {
        effectiveEnv.AI_BASE_URL = 'https://api.openai.com/v1'
      }
    }

    if (provider === 'anthropic') {
      if (!effectiveEnv.AI_API_KEY) {
        return res.status(400).json({ error: 'Anthropic API key not configured (AI_API_KEY)' })
      }
      const resp = await fetch(`${effectiveEnv.AI_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveEnv.AI_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: effectiveEnv.AI_MODEL_ID, messages: body.messages }),
      })
      const data = await resp.json()
      return res.json({ content: data.content?.[0]?.text || '' })
    }

    if (!effectiveEnv.AI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured (AI_API_KEY)' })
    }

    const resp = await fetch(`${effectiveEnv.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveEnv.AI_API_KEY || ''}`,
      },
      body: JSON.stringify({ model: effectiveEnv.AI_MODEL_ID, messages: body.messages }),
    })
    const data = await resp.json()
    return res.json({ content: data.choices?.[0]?.message?.content || '' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' })
  }
})

app.post('/api/parse-url', async (req, res) => {
  setCors(res)
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: '请提供有效的 URL' })

    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) return res.status(502).json({ error: `无法获取页面内容: ${response.status}` })
    const html = await response.text()
    return res.json({ success: true, data: { title: url, content: html, excerpt: '', siteName: new URL(url).hostname, url } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err instanceof Error ? err.message : '解析失败' })
  }
})

app.get('/api/health', (_req, res) => {
  setCors(res)
  res.json({ status: 'ok' })
})

const port = process.env.LOCAL_API_PORT ? Number(process.env.LOCAL_API_PORT) : 5173
app.listen(port, () => console.log(`Local API server listening on http://localhost:${port}`))
