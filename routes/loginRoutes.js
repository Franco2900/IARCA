// Modulos
var express = require('express');
var router  = express.Router();

// Métodos del controller
const { getLogin, postLogin } = require('../controllers/loginController');

// Rutas URL de: /login
router.get('/', getLogin);
router.post('/', postLogin);

module.exports = router;