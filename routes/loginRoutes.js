// URL base: http://DOMINIO/login/

// Modulos
const router = require('express').Router(); // Permite definir rutas

// Defino las rutas de navegación del usuario
router.get ('/', require('../controllers/loginController').getLogin );
router.post('/', require('../controllers/loginController').postLogin );

module.exports = router;