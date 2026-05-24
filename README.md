# PopStudy - API Gateway (`ps-api-gateway`)

Este componente forma parte del ecosistema de **PopStudy** y actúa como el único punto de entrada para las peticiones de los clientes. Se encarga de la redirección (proxying) de peticiones a los microservicios correspondientes, la verificación centralizada de la autenticación mediante Supabase Auth y la aplicación de políticas de límite de peticiones (Rate Limiting) para proteger los recursos del sistema.

Está construido sobre **Node.js** y **Express** utilizando **http-proxy-middleware** para el reenvío dinámico de tráfico.

---

## 🛠️ Tecnologías Utilizadas

- **Runtime:** Node.js (v18+)
- **Framework Web:** Express.js (v5)
- **Middleware de Proxy:** `http-proxy-middleware` (v3)
- **Autenticación:** Supabase Auth (validación centralizada con `@supabase/supabase-js`)
- **Limitación de Peticiones:** `express-rate-limit` (v8)
- **Herramientas de Desarrollo:** Nodemon, Dotenv, Cors, Morgan

---

## 📁 Estructura del Proyecto

El gateway sigue una organización limpia por responsabilidades:

```text
ps-api-gateway/
├── src/
│   ├── config/          # Configuración global del Gateway (lectura de env)
│   ├── middleware/      # Middlewares (autenticación JWT, control de rate limit, manejo de errores)
│   ├── proxy/           # Configuración del proxy inverso y reescritura de rutas
│   ├── routes/          # Definición y mapeo de rutas hacia microservicios
│   └── app.js           # Configuración general de Express (CORS, Morgan, Rutas)
├── index.js             # Punto de entrada del servidor
├── dockerfile           # Configuración de Docker para producción
├── .env.example         # Plantilla de variables de entorno
└── package.json         # Dependencias y scripts del proyecto
```

---

## ⚙️ Configuración del Entorno

Para ejecutar el servicio localmente, crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
# --- CONFIGURACIÓN GENERAL ---
PORT=8080
NODE_ENV=development

# --- SUPABASE (Secrets) ---
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_JWT_SECRET=tu_supabase_jwt_secret

# --- URLs DE MICROSERVICIOS ---
# Si usas Docker Compose, se resuelven mediante los nombres de servicio de Docker.
# Si corres los servicios localmente con 'npm run dev', define las direcciones locales:
USER_SERVICE_URL=http://localhost:3001
CURRICULUM_SERVICE_URL=http://localhost:3002
GRADES_SERVICE_URL=http://localhost:3003
CALENDAR_SERVICE_URL=http://localhost:3004
NOTES_SERVICE_URL=http://localhost:3005
AI_SERVICE_URL=http://localhost:3006
```

### Explicación de Variables:
- **`PORT`**: Puerto local en el cual se levantará el Gateway (por defecto `8080`).
- **`NODE_ENV`**: Entorno de ejecución (`development` o `production`).
- **`SUPABASE_URL`** y **`SUPABASE_ANON_KEY`**: Utilizados para inicializar el cliente de Supabase que valida la validez de las solicitudes.
- **`SUPABASE_JWT_SECRET`**: Clave secreta de JWT utilizada para validar la firma de los tokens.
- **`XXX_SERVICE_URL`**: Direcciones URL del resto de los microservicios del sistema.

---

## 🚀 Instrucciones de Ejecución

### Ejecución Local

1. Instalar las dependencias:
   ```bash
   npm install
   ```

2. Correr en modo desarrollo (con recarga automática mediante Nodemon):
   ```bash
   npm run dev
   ```

3. Correr en modo producción:
   ```bash
   npm start
   ```

### Ejecución con Docker

Puedes compilar y ejecutar el contenedor usando el `dockerfile` provisto:

1. Construir la imagen de Docker:
   ```bash
   docker build -t ps-api-gateway .
   ```

2. Ejecutar el contenedor:
   ```bash
   docker run -p 8080:8080 --env-file .env ps-api-gateway
   ```

---

## 🛣️ Endpoints y Ruteo (Proxy)

El API Gateway expone una ruta de estado propia y enruta el resto del tráfico a los respectivos microservicios, removiendo el prefijo `/api/xxxx` correspondiente antes de reenviar.

### Salud del Gateway
- `GET /health` - Retorna el estado y marca de tiempo del Gateway.

### Enrutamiento de Microservicios

| Prefijo de Ruta | Microservicio de Destino | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/*` | `USER_SERVICE_URL` | Autenticación, Login y Registro | Pública |
| `/api/users/*` | `USER_SERVICE_URL` | Perfiles de usuario y contexto | Requerida (JWT) |
| `/api/curriculum/*` | `CURRICULUM_SERVICE_URL` | Mallas, asignaturas y ramos | Requerida (JWT) |
| `/api/grades/*` | `GRADES_SERVICE_URL` | Notas, ponderaciones e hitos | Requerida (JWT) |
| `/api/courses/*` | `GRADES_SERVICE_URL` | Cursos y asignaturas cursadas | Requerida (JWT) |
| `/api/calendar/*` | `CALENDAR_SERVICE_URL` | Calendario académico y eventos | Requerida (JWT) |
| `/api/notes/*` | `NOTES_SERVICE_URL` | Apuntes, notas y material de estudio | Requerida (JWT) |
| `/api/ai/*` | `AI_SERVICE_URL` | Asistente de inteligencia artificial | Requerida (JWT) |

---

## 🔐 Autenticación y Seguridad

### Validación de Tokens
Todas las rutas protegidas (es decir, todas menos las que comiencen con `/api/auth` y `/health`) requieren la cabecera de autorización estándar:
```
Authorization: Bearer <token_jwt>
```
El middleware de autenticación del Gateway valida este token contra Supabase Auth. Si es válido, inyecta cabeceras personalizadas al request antes de redirigirlo al microservicio:
* `x-user-id`: ID de usuario autenticado en Supabase.
* `x-user-role`: Rol del usuario en Supabase (usualmente `authenticated`).

### Control de Flujo (Rate Limiting)
Se aplican diferentes límites de uso por dirección IP para evitar abusos y ataques DoS:
* **Autenticación (`/api/auth/*`)**: Ventana de 15 minutos, máximo 20 peticiones.
* **Servicio de IA (`/api/ai/*`)**: Ventana de 1 minuto, máximo 5 peticiones (debido al alto costo operacional del servicio).
* **General (Demás rutas protegidas)**: Ventana de 1 minuto, máximo 60 peticiones.

---

## 📄 Licencia

ISC
