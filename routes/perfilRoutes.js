// URL base: http://DOMINIO/perfil/

// ================== MÓDULOS Y DEPENDENCIAS ==================
const router = require('express').Router(); // Permite definir rutas

const multer = require('multer');                           // Modulo para manejar la subidad de archivos
const upload = multer({ storage: multer.memoryStorage() }); // Creo una instancia de multer

// ================== MIDDLEWARES A NIVEL DE ROUTER ==================
// Los middlewares definidos en un router.use en vez un app.use solo afectan a las rutas definidas por dicho router
// No afecta globalmente ni a otros routers
//router.use( require('./utilRoutes.js').autentificarUsuario );

// ================== RUTAS DE NAVEGACIÓN DEL USUARIO ==================
// Rutas URL de: /perfil
router.get ( '/',                   require('../controllers/perfilController.js').getPerfil );
router.post( '/cambiarImagen',      upload.single('imagenPerfil'), require('../controllers/perfilController.js').postCambiarImagen );
router.post( '/cambiarNombre',      require('../controllers/perfilController.js').postCambiarNombre );
router.post( '/cambiarContrasenia', require('../controllers/perfilController.js').postCambiarContrasenia );

module.exports = router;