// Modulos
var express = require('express');
var router  = express.Router();

// Métodos del controller
const { getInfo } = require('../controllers/infoController');

// Rutas URL de: /info
router.get('/', getInfo);

module.exports = router;