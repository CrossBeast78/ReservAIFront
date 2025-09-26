const express = require('express');
const path = require('path');
const router = express.Router();

// Definir rutas
router.get('/', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/login.html")));
router.get('/login', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/login.html")));
router.get('/inicio', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/inicio.html")));
router.get('/register', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/register.html")));
router.get('/verify_email', (req, res) => res.sendFile(path.resolve(__dirname + "/../views/verify_email.html")));


module.exports = router;