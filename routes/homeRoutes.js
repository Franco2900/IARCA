// Modulos
var express = require('express');
var router  = express.Router();

// Métodos del controller
const { getHome } = require('../controllers/homeController');

// Rutas URL de: /
router.get('/', getHome);

module.exports = router;