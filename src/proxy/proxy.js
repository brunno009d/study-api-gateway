import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'

export const createProxy = (targetUrl, pathPrefix) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${pathPrefix}`]: ''
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req)
        console.log(`[PROXY] ${req.method} /api/${pathPrefix}${req.path} → ${targetUrl}`)
      },
      proxyRes: (proxyRes, req) => {
        console.log(`[PROXY] Response ${proxyRes.statusCode} ← ${targetUrl}${req.path}`)
      },
      error: (err, req, res) => {
        console.error(`[PROXY ERROR] No se pudo conectar a ${targetUrl}:`, err.message)
        res.status(503).json({
          error: 'service_unavailable',
          message: `Service ${pathPrefix} is currently unavailable`
        })
      }
    }
  })
}
