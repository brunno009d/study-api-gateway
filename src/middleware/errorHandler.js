const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'service_unavailable',
      message: 'Upstream service is not available',
      service: err.address
    })
  }

  res.status(err.status || 500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Something went wrong'
  })
}

export default errorHandler
