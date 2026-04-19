const { createProxyMiddleware } = require('http-proxy-middleware');

// Definimos a dónde apunta cada microservicio
const options = {
  target: 'http://localhost:3001', // Dirección del microservicio de destino
  changeOrigin: true,
  pathRewrite: {
    [`^/api/users`]: '', // Limpiamos la ruta para el microservicio
  },
};

const userProxy = createProxyMiddleware(options);

module.exports = userProxy;