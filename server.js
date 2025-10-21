const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

// Puerto configurable desde argumento o por defecto 3000
const PORT = process.argv[2] || 3000;

// Importar router principal (ajusta ruta si es diferente)
const router = require('./public/Scripts/router');

// ============================
// Configuración de Helmet
// ============================
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrcElem: ["'self'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"], // agrega cdn si cargas scripts desde CDN
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
};

// ============================
// RATE LIMITERS
// ============================
app.set('trust proxy', 1);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todas las requests
  skipFailedRequests: false, // Contar requests fallidas también
  message: { status: 429, error: 'Too many requests, please try again later.', retryAfter: '15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todas las requests
  skipFailedRequests: false, // Contar requests fallidas también

  message: { status: 429, error: 'Demasiados intentos. Espera un momento antes de volver a intentar.', retryAfter: '15 minutos' }
});

// ============================
// MIDDLEWARES
// ============================
app.use(express.json());

// Helmet (usar opciones)
app.use(helmet(helmetOptions));

// Aplicar limitador global
app.use(globalLimiter);

// Seguridad: ocultar X-Powered-By
app.disable('x-powered-by');

app.use((req, res, next) => {
  if (req.path.startsWith('/view')) {
    req.url = req.url.replace('/view', '');
    req.originalUrl = req.originalUrl.replace('/view', '');
  }
  next();
});

app.use('/static', express.static(path.join(__dirname, 'public'), {
  dotfiles: 'ignore',
  index: false,
  maxAge: '1y',
}));

// Rutas con limitador más estricto (ajusta según tu app)
app.use(['/login', '/auth', '/twofa', '/verification', '/api/auth'], authLimiter);

// Montar router principal
app.use('/', router);

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404);
  if (req.accepts('html')) return res.sendFile(path.join(__dirname, 'public', 'views', 'login.html'));
  if (req.accepts('json')) return res.json({ error: 'Ruta no encontrada', path: req.originalUrl });
  res.type('txt').send('Not Found');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});