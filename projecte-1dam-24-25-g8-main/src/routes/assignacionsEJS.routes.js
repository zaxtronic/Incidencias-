const express = require('express');
const router = express.Router();
const Actuacio = require('../models/Actuacio');
const Tecnic = require('../models/Tecnic');
const Incidencia = require('../models/Incidencia');

// Mostrar formulari d'assignació
router.get('/assignar/:id_incidencia', async (req, res) => {
  try {
    const { id_incidencia } = req.params;
    const tecnics = await Tecnic.findAll();
    const incidencia = await Incidencia.findByPk(id_incidencia);

    if (!incidencia) {
      return res.status(404).send('Incidència no trobada');
    }

    res.render('incidencies/assign', { tecnics, incidencia });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al carregar el formulari');
  }
});

// Rebre assignació (crear actuació)
router.post('/assignar/:id_incidencia', async (req, res) => {
  try {
    const { id_incidencia } = req.params;
    const { id_tecnic, descripcio } = req.body; // Usamos descripcio como en el form

    if (!id_tecnic) {
      return res.status(400).send('Has de seleccionar un tècnic');
    }

    await Actuacio.create({
      id_tecnic,
      descripcio: descripcio || '',
      data_actuacio: new Date(),
      finalitza_actuacio: false,
      id_incidencia
    });

    res.redirect('/incidencies');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al assignar tècnic');
  }
});

module.exports = router;
