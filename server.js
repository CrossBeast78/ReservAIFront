const express = require('express');
const path = require('path');
const app = express();
const PORT = process.argv[2] || 3000
const router = require('./public/Scripts/router');

// Ruta para servir el HTML
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(router);
app.use(express.static('app'));
app.use(express.static(path.join(__dirname, "public")));
app.use('/views', express.static('views'));
app.use('/public', express.static('public'));



app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
