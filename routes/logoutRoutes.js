// URL base: http://DOMINIO/logout/

// Modulos
const router = require('express').Router(); // Permite definir rutas

// Defino las rutas de navegación del usuario
router.get ('/', require('../controllers/logoutController').getLogout );

module.exports = router;