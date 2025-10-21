const express = require('express');
const path = require('path');
const router = express.Router();

router.use((req, res, next) => {
    // Si la ruta viene con /api, la removemos para procesamiento interno
    if (req.path.startsWith('/view')) {
        req.url = req.url.replace('/view', '');
        req.originalUrl = req.originalUrl.replace('/view', '');
    }
    next();
});


// Definir rutas
router.get('/', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/login.html")));
router.get('/login', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/login.html")));
router.get('/inicio', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/inicio.html")));
router.get('/register', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/register.html")));
router.get('/QR', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/QR.html")));
router.get('/verify_email', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/verify_email.html")));
router.get('/twofa', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/twofa.html")));
router.get('/inicioAdmin', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/inicioAdmin.html")));
router.get('/404', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/404.html")));
router.get('/terms', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/terms.html")));

module.exports = router;