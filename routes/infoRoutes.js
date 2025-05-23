// URL base: http://DOMINIO/info/

// Modulos
const router = require('express').Router(); // Permite definir rutas

// Defino las rutas de navegación del usuario
router.get( '/', require('../controllers/infoController').getInfo );

module.exports = router;