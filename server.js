const express = require('express');
const path = require('path');
const app = express();

// Puerto configurable desde argumento o por defecto 3000
const PORT = process.argv[2] || 3000;

// Importar router principal (para las rutas HTML)
const router = require('./public/Scripts/router');

// ============================
// CONFIGURACIONES DEL SERVIDOR
// ============================

// Middleware para parsear JSON
app.use(express.json());

// Ocultar cabecera "X-Powered-By" (seguridad)
app.disable('x-powered-by');


app.use((req, res, next) => {
    // Si la ruta viene con /api, la removemos para procesamiento interno
    if (req.path.startsWith('/view')) {
        req.url = req.url.replace('/view', '');
        req.originalUrl = req.originalUrl.replace('/view', '');
    }
    next();
});

// Servir archivos estáticos (CSS, JS, imágenes, etc.) con alias "/static"
app.use('/static', express.static(path.join(__dirname, 'public'), {
  dotfiles: 'ignore',   // No mostrar archivos ocultos
  index: false,         // No mostrar index.html automático
  maxAge: '1y',         // Cache largo (1 año)
}));

// ============================
// RUTAS PRINCIPALES (HTML)
// ============================

app.use('/', router);


app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404);
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'public', 'views', '404.html'));
  }
  if (req.accepts('json')) {
    return res.json({ error: 'Ruta no encontrada', path: req.originalUrl, method: req.method });
  }
  res.type('txt').send('Not Found');
});

// ============================
// INICIO DEL SERVIDOR
// ============================

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});