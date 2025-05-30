// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const Usuari = require('../models/usuari'); // Ajusta la ruta
const { logger } = require('../logger'); // Opcional

// GET /auth/login - Mostra el formulari de login
router.get('/login', (req, res) => {
    if (req.session.isAuthenticated) {
        return res.redirect('/index'); // Si ja està logat, redirigeix a l'inici
    }
    res.render('auth/login', { 
        title: 'Iniciar Sessió', 
        error: null,
        message: null // Per a missatges flash (ex: "Logout exitós")
    });
});

// POST /auth/login - Processa el login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).render('auth/login', {
            title: 'Iniciar Sessió',
            error: 'Nom d\'usuari i contrasenya són obligatoris.',
            message: null
        });
    }

    try {
        const usuari = await Usuari.findOne({ where: { username } });
        if (!usuari) {
            logger.warn(`Intent de login fallit: Usuari no trobat - ${username}`, { username });
            return res.status(401).render('auth/login', {
                title: 'Iniciar Sessió',
                error: 'Credencials invàlides.',
                message: null
            });
        }

        const passwordCorrecte = await usuari.compararPassword(password);
        if (!passwordCorrecte) {
            logger.warn(`Intent de login fallit: Contrasenya incorrecta - ${username}`, { username });
            return res.status(401).render('auth/login', {
                title: 'Iniciar Sessió',
                error: 'Credencials invàlides.',
                message: null
            });
        }

        // Login exitós: Configura la sessió
        req.session.isAuthenticated = true;
        req.session.userId = usuari.id_usuari;
        // Pots emmagatzemar més dades de l'usuari a la sessió si cal, però compte amb la mida
        // req.session.user = { id: usuari.id_usuari, username: usuari.username, rol: usuari.rol, nom: usuari.nom };

        logger.info(`Login exitós: ${usuari.username}`, { userId: usuari.id_usuari, username: usuari.username });
        
        // Guarda la sessió abans de redirigir (bona pràctica)
        req.session.save(err => {
            if (err) {
                console.error("Error guardant sessió:", err);
                // Gestiona l'error, potser redirigir a una pàgina d'error
                return res.status(500).render('auth/login', {
                    title: 'Iniciar Sessió',
                    error: 'Error del servidor durant el login.',
                    message: null
                });
            }
            res.redirect('/index'); // Redirigeix a la pàgina d'inici o a un dashboard
        });

    } catch (err) {
        logger.error('Error durant el procés de login', { error: err.message, stack: err.stack });
        res.status(500).render('auth/login', {
            title: 'Iniciar Sessió',
            error: 'S\'ha produït un error inesperat.',
            message: null
        });
    }
});

// GET /auth/logout - Tanca la sessió
router.get('/logout', (req, res, next) => {
    const username = req.session.user ? req.session.user.username : 'Usuari desconegut';
    req.session.destroy(err => {
        if (err) {
            logger.error('Error al tancar la sessió', { error: err.message, username });
            // Potser és millor redirigir a una pàgina d'error o gestionar-ho d'una altra manera
            return next(err); // Passa l'error al gestor d'errors global
        }
        logger.info(`Logout exitós: ${username}`, { username });
        res.clearCookie('connect.sid'); // Nom per defecte de la cookie de sessió amb express-session
        // Pots passar un missatge a la pàgina de login usant query params o flash messages
        res.redirect('/auth/login?message=Sessió tancada correctament');
    });
});

module.exports = router;