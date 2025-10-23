const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

// Puerto configurable desde argumento o por defecto 3000
const PORT = process.argv[2] || 3000;

const isProduction_ = process.argv[3] || process.env.NODE_ENV || 'dev'

let isProduction = isProduction_ === 'production'


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
      scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-eval'"],
      scriptSrcAttr: isProduction ? ["'none'"] : ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://app.reservai-passmanager.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" },
  hidePoweredBy: true,
  frameguard: { action: 'deny' }
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

// Rate limiter específico para assets estáticos
const assetsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isProduction ? 30 : 100, // Más restrictivo en producción
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosas para assets
  message: { status: 429, error: 'Too many asset requests', retryAfter: '1 minute' }
});

// Rate limiter para archivos JavaScript y CSS específicamente
const scriptCssLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: isProduction ? 15 : 50, // Muy restrictivo en producción
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Script access limited', retryAfter: '5 minutes' }
});

// MIDDLEWARES

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

// Middleware para proteger archivos JS y CSS en producción
if (isProduction) {
  app.use('/static/Scripts', scriptCssLimiter);
  app.use('/static/estilos', scriptCssLimiter);
}

// Aplicar rate limiter a todos los assets
app.use('/static', assetsLimiter);

app.use('/static', express.static(path.join(__dirname, 'public'), {
  dotfiles: 'ignore',
  index: false,
  maxAge: isProduction ? '1y' : '1d',
  etag: false, // Deshabilitar ETags para ocultar información
  lastModified: false, // Ocultar fecha de modificación
  setHeaders: (res, filePath) => {
    // Headers de seguridad para todos los archivos estáticos
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    if (isProduction) {
      // En producción, headers más estrictos
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      
      // Para archivos JS y CSS, headers adicionales de protección
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
        res.setHeader('Referrer-Policy', 'no-referrer');
        
        // Ocultar tipo de archivo para ofuscación básica
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
      }
    } else {
      // En desarrollo, cache más corto
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Rutas con limitador más estricto (ajusta según tu app)
app.use(['/login', '/auth', '/twofa', '/verification', '/api/auth'], authLimiter);

// Middleware de protección adicional para producción
if (isProduction) {
  // Bloquear acceso directo a archivos fuente en producción
  app.use((req, res, next) => {
    const blockedExtensions = ['.map', '.ts', '.scss', '.less'];
    const blockedPaths = ['/src/', '/node_modules/', '/.git/', '/config/'];
    
    const hasBlockedExtension = blockedExtensions.some(ext => req.path.endsWith(ext));
    const hasBlockedPath = blockedPaths.some(path => req.path.includes(path));
    
    if (hasBlockedExtension || hasBlockedPath) {
      return res.status(404).send('Not Found');
    }
    
    // Log intentos sospechosos de acceso a archivos
    if (req.path.includes('..') || req.path.includes('/static/Scripts/') || req.path.includes('/static/estilos/')) {
      console.log(`[SECURITY] Suspicious access attempt: ${req.ip} -> ${req.path}`);
    }
    
    next();
  });
  
  // Middleware anti-bot para archivos sensibles
  app.use('/static/Scripts', (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousBots = ['bot', 'crawler', 'spider', 'scraper', 'wget', 'curl'];
    
    if (suspiciousBots.some(bot => userAgent.toLowerCase().includes(bot))) {
      return res.status(403).send('Access Denied');
    }
    
    next();
  });
}

// Montar router principal
app.use('/', router);

// 404 handler 
app.use((req, res) => {
  const logDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown'
  };
  
  // Log diferente según el entorno
  if (isProduction) {
    // En producción, log más detallado para análisis de seguridad
    console.log(`[404-PROD] ${JSON.stringify(logDetails)}`);
    
    // Detectar patrones sospechosos
    const suspiciousPatterns = ['/admin', '/wp-admin', '/phpmyadmin', '/.env', '/config', '/backup'];
    if (suspiciousPatterns.some(pattern => req.path.includes(pattern))) {
      console.log(`[SECURITY-ALERT] Suspicious 404: ${req.ip} -> ${req.path}`);
    }
  } else {
    console.log(`[404] ${req.method} ${req.originalUrl}`);
  }
  
  res.status(404);
  
  // En producción, no revelar información sobre rutas válidas
  if (isProduction) {
    if (req.accepts('html')) return res.send('Page not found');
    if (req.accepts('json')) return res.json({ error: 'Not found' });
    return res.type('txt').send('Not Found');
  } else {
    // En desarrollo, comportamiento original
    if (req.accepts('html')) return res.sendFile(path.join(__dirname, 'public', 'views', 'login.html'));
    if (req.accepts('json')) return res.json({ error: 'Ruta no encontrada', path: req.originalUrl });
    res.type('txt').send('Not Found');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔒 Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
  
  if (isProduction) {
    console.log('🛡️  Protecciones activas:');
    console.log('   • Rate limiting estricto para JS/CSS');
    console.log('   • Headers de seguridad avanzados');
    console.log('   • Bloqueo de archivos fuente');
    console.log('   • Anti-bot protection');
    console.log('   • Logging de seguridad');
    console.log('   • CSP mejorado');
    console.log('⚠️  Para activar modo producción: NODE_ENV=production');
  } else {
    console.log('⚠️  Modo desarrollo - Protecciones limitadas');
    console.log('   Para activar protecciones completas: NODE_ENV=production');
  }
});