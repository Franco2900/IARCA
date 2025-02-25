// Modulos
var express = require('express');
var router  = express.Router();

// Métodos del controller
const { getContacto } = require('../controllers/contactoController');

// Rutas URL de: /contacto
router.get('/', getContacto);

module.exports = router;