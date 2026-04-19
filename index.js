const express = require('express'); // Importamos la librería
const userProxy = require('./src/proxy/proxy');
const app = express(); // Creamos la aplicación
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use('/api/users', userProxy); // Usamos el proxy para redirigir las solicitudes

app.listen(port, () => {
  console.log(`API Gateway escuchando en el puerto ${port}`);
});