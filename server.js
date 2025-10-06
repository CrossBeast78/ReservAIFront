const express = require('express');
const path = require('path');
const app = express();
const PORT = process.argv[2] || 3000
const router = require('./public/Scripts/router');

router.use((req, res, next) => {
    // Si la ruta viene con /api, la removemos para procesamiento interno
    if (req.path.startsWith('/view')) {
        req.url = req.url.replace('/view', '');
        req.originalUrl = req.originalUrl.replace('/view', '');
    }
    next();
});

// Ruta para servir el HTML
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(router);
app.use(express.static('app'));
app.use(express.static(path.join(__dirname, "public")));
app.use('/views', express.static('views'));
app.use('/public', express.static('public'));



app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
