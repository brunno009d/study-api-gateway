import app from './src/app.js'
import config from './src/config/index.js'

app.listen(config.port, () => {
  console.log(`API Gateway running on port ${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`Health check: http://localhost:${config.port}/health`)
})
