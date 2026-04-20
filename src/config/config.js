require('dotenv').config();

const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  services: {
    user:       process.env.USER_SERVICE_URL,
    curriculum: process.env.CURRICULUM_SERVICE_URL,
    grades:     process.env.GRADES_SERVICE_URL,
    calendar:   process.env.CALENDAR_SERVICE_URL,
    notes:      process.env.NOTES_SERVICE_URL,
    ai:         process.env.AI_SERVICE_URL,
  }
}


// Validar que el JWT secret esté configurado
if (!config.supabase.jwtSecret) {
  console.error('ERROR: SUPABASE_JWT_SECRET no está definido en .env')
  process.exit(1)
}

module.exports = config