const app = require('./src/app')
const config = require('./src/config')

app.listen(config.port, () => {
  console.log(`API Gateway running on port ${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`Health check: http://localhost:${config.port}/health`)
})