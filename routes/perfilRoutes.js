// URL base: http://DOMINIO/perfil/

// Modulos
const router = require('express').Router(); // Permite definir rutas

const multer = require('multer');                           // Modulo para manejar la subidad de archivos
const upload = multer({ storage: multer.memoryStorage() }); // Creo una instancia de multer

// Métodos de util.js
const { autentificarUsuario } = require('../util/util.js');

// Rutas URL de: /perfil
router.get ( '/',                   autentificarUsuario, require('../controllers/perfilController.js').getPerfil );
router.post( '/cambiarImagen',      upload.single('imagenPerfil'), require('../controllers/perfilController.js').postCambiarImagen );
router.post( '/cambiarNombre',      require('../controllers/perfilController.js').postCambiarNombre );
router.post( '/cambiarContrasenia', require('../controllers/perfilController.js').postCambiarContrasenia );

module.exports = router;