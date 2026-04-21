# Dependencias
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Producción 
FROM node:20-alpine AS runner
WORKDIR /app

# Definir variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Copiar solo lo necesario de la etapa anterior
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Exponer el puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]