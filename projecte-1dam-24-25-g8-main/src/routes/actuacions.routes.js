// src/routes/actuacions.routes.js

const express = require('express');
const router = express.Router();
const Actuacio = require('../models/Actuacio'); // Ajusta la ruta si és diferent
const Tecnic = require('../models/Tecnic');     // Ajusta la ruta si és diferent
const Incidencia = require('../models/Incidencia'); // Ajusta la ruta si és diferent
// const { logger } = require('../logger'); // Si vols utilitzar el logger aquí

// RUTA QUE FALTA: GET /actuacions/new - Formulari per crear una nova actuació
router.get('/new', async (req, res) => {
    try {
        const tecnics = await Tecnic.findAll({ order: [['nom', 'ASC']] });
        const incidencies = await Incidencia.findAll({
            // Pots filtrar les incidències que es mostren, ex: només les obertes o en procés
            // where: { estat: ['Oberta', 'En procès'] }, 
            order: [['id_incidencia', 'DESC']]
        });

        res.render('actuacions/new', { // La teva plantilla EJS ha d'estar a views/actuacions/new.ejs
            title: 'Afegir Nova Actuació',
            tecnics,
            incidencies,
            actuacio: {}, // Passa un objecte buit si la plantilla ho espera per a valors inicials
            error: null     // Passa null si no hi ha error inicial
        });
    } catch (err) {
        console.error("Error carregant formulari per a nova actuació:", err);
        // logger.error("Error carregant formulari per a nova actuació:", { error: err.message, stack: err.stack });
        res.status(500).render('error', { // Assegura't de tenir una plantilla error.ejs
            title: "Error",
            message: "No s'ha pogut carregar el formulari per afegir una nova actuació.",
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});

// RUTA EXISTENT (exemple): POST /actuacions/create - Crear una nova actuació
// Assegura't que aquesta ruta existeix i funciona correctament.
// Si la ruta per crear és '/create' i no '/new' amb POST, l'action del formulari a new.ejs ha de ser '/actuacions/create'
router.post('/create', async (req, res) => { // O '/new' si el formulari envia a POST /actuacions/new
    try {
        const { id_tecnic, finalitza_actuacio, data_actuacio, descripcio, id_incidencia, temps_invertit } = req.body;

        // Validacions bàsiques (pots fer-les més robustes)
        if (!id_tecnic || !data_actuacio || !descripcio || !id_incidencia || !temps_invertit) {
            const tecnics = await Tecnic.findAll({ order: [['nom', 'ASC']] });
            const incidencies = await Incidencia.findAll({ order: [['id_incidencia', 'DESC']] });
            return res.status(400).render('actuacions/new', {
                title: 'Afegir Nova Actuació',
                error: 'Tots els camps marcats amb * són obligatoris.',
                tecnics,
                incidencies,
                // Passa les dades prèvies per omplir el formulari de nou
                actuacio: { id_tecnic, finalitza_actuacio, data_actuacio, descripcio, id_incidencia, temps_invertit } 
            });
        }

        await Actuacio.create({
            id_tecnic,
            finalitza_actuacio: finalitza_actuacio === 'true',
            data_actuacio,
            descripcio,
            id_incidencia,
            temps_invertit
        });
        
        // Opcional: Si l'actuació finalitza la incidència, actualitza l'estat de la incidència
        if (finalitza_actuacio === 'true') {
            const incidenciaAfectada = await Incidencia.findByPk(id_incidencia);
            if (incidenciaAfectada) {
                incidenciaAfectada.estat = 'Resolta'; // O 'Tancada' segons el teu flux
                await incidenciaAfectada.save();
            }
        }

        res.redirect('/actuacions'); // O a on vulguis anar després de crear
    } catch (err) {
        console.error("Error creant actuació:", err);
        // logger.error("Error creant actuació:", { error: err.message, stack: err.stack, body: req.body });
        const tecnics = await Tecnic.findAll({ order: [['nom', 'ASC']] });
        const incidencies = await Incidencia.findAll({ order: [['id_incidencia', 'DESC']] });
        res.status(500).render('actuacions/new', {
            title: 'Afegir Nova Actuació',
            error: "S'ha produït un error en crear l'actuació.",
            tecnics,
            incidencies,
            actuacio: req.body
        });
    }
});


// === ALTRES RUTES DEL TEU actuacions.routes.js ===
// ... (les teves rutes per llistar, editar, actualitzar, eliminar actuacions) ...

// Exemple de la ruta per llistar actuacions (GET /actuacions/)
router.get('/', async (req, res) => {
    try {
        const actuacions = await Actuacio.findAll({
            include: [
                { model: Tecnic, as: 'tecnic', attributes: ['nom'] }, // Assegura't que l'alias 'tecnic' és correcte
                { model: Incidencia, attributes: ['id_incidencia', 'descripcio'] }
            ],
            order: [['data_actuacio', 'DESC']]
        });
        res.render('actuacions/list', { // La teva plantilla ha d'estar a views/actuacions/list.ejs
            title: "Llistat d'Actuacions",
            actuacions,
            error: null
        });
    } catch (err) {
        console.error("Error carregant llistat d'actuacions:", err);
        res.status(500).render('error', {
            title: "Error",
            message: "No s'ha pogut carregar el llistat d'actuacions.",
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});


// ... (les teves rutes POST per /:id_actuacio/edit i /:id_actuacio/delete que ja tens) ...
// ASSEGURA'T QUE LA RUTA GET PER EDITAR TAMBÉ EXISTEIX SI LA NECESSITES
router.get('/:id_actuacio/edit', async (req, res) => {
    try {
        const actuacio = await Actuacio.findByPk(req.params.id_actuacio);
        if (!actuacio) {
            return res.status(404).render('404', { title: 'Actuació no trobada', url: req.originalUrl });
        }
        const tecnics = await Tecnic.findAll({ order: [['nom', 'ASC']] });
        const incidencies = await Incidencia.findAll({ order: [['id_incidencia', 'DESC']] });

        res.render('actuacions/edit', {
            title: 'Editar Actuació',
            actuacio,
            tecnics,
            incidencies,
            error: null
        });
    } catch (err) {
        console.error(`Error carregant edició d'actuació ${req.params.id_actuacio}:`, err);
        res.status(500).render('error', {
            title: "Error",
            message: "No s'ha pogut carregar el formulari d'edició d'actuació.",
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});

// Les teves rutes POST existents
router.post('/:id_actuacio/edit', async (req, res) => { // O la teva ruta /update
    try {
        const { id_actuacio } = req.params;
        const { id_tecnic, finalitza_actuacio, data_actuacio, descripcio, id_incidencia, temps_invertit } = req.body;

        const actuacioAActualitzar = await Actuacio.findByPk(id_actuacio);
        if (!actuacioAActualitzar) {
            return res.status(404).render('404', { title: 'Actuació no trobada', url: req.originalUrl });
        }

        await actuacioAActualitzar.update({
            id_tecnic,
            finalitza_actuacio: finalitza_actuacio === 'true',
            data_actuacio,
            descripcio,
            id_incidencia,
            temps_invertit
        });
        
        if (finalitza_actuacio === 'true') {
             const incidenciaAfectada = await Incidencia.findByPk(id_incidencia);
             if (incidenciaAfectada) {
                incidenciaAfectada.estat = 'Resolta';
                await incidenciaAfectada.save();
             }
        }
        res.redirect('/actuacions');
    } catch (err) {
        console.error("Error actualitzant actuació:", err);
        const { id_actuacio } = req.params;
        // Intenta recarregar les dades per al formulari en cas d'error
        const actuacio = await Actuacio.findByPk(id_actuacio) || req.body; // Fallback a req.body
        const tecnics = await Tecnic.findAll({ order: [['nom', 'ASC']] });
        const incidencies = await Incidencia.findAll({ order: [['id_incidencia', 'DESC']] });
        res.status(500).render('actuacions/edit', {
            title: 'Editar Actuació',
            error: "S'ha produït un error en actualitzar l'actuació.",
            actuacio,
            tecnics,
            incidencies
        });
    }
});

router.post('/:id_actuacio/delete', async (req, res) => {
    try {
        const { id_actuacio } = req.params;
        const actuacio = await Actuacio.findByPk(id_actuacio);
        if (!actuacio) {
            return res.status(404).render('404', { title: 'Actuació no trobada', url: req.originalUrl });
        }
        await actuacio.destroy();
        res.redirect('/actuacions');
    } catch (err) {
        console.error("Error eliminant actuació:", err);
        res.status(500).redirect('/actuacions'); 
    }
});


module.exports = router;