// URL base: http://DOMINIO/contacto/

// Modulos
const router = require('express').Router(); // Permite definir rutas

// Defino las rutas de navegación del usuario
router.get( '/', require('../controllers/contactoController').getContacto );

module.exports = router;