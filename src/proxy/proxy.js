const { createProxyMiddleware } = require('http-proxy-middleware')

const createProxy = (targetUrl, pathPrefix) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,

    // Remueve el prefijo de la ruta antes de reenviar
    // Ej: /api/curriculum/subjects → /subjects
    pathRewrite: {
      [`^/api/${pathPrefix}`]: ''
    },

    on: {
      // Log de cada request proxeado
      proxyReq: (proxyReq, req) => {
        console.log(`[PROXY] ${req.method} /api/${pathPrefix}${req.path} → ${targetUrl}`)
      },

      // Log de cada respuesta
      proxyRes: (proxyRes, req) => {
        console.log(`[PROXY] Response ${proxyRes.statusCode} ← ${targetUrl}${req.path}`)
      },

      // Error al conectar con el microservicio
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

module.exports = { createProxy }