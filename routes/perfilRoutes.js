// Modulos
var express = require('express');
var router  = express.Router();

const multer = require('multer');                           // Modulo para manejar la subidad de archivos
const upload = multer({ storage: multer.memoryStorage() }); // Creo una instancia de multer

// Métodos del controller
const { getPerfil, postCambiarImagen, postCambiarNombre, postCambiarContrasenia } = require('../controllers/perfilController.js');

// Métodos de util.js
const { autentificar } = require('../util/util.js');

// Rutas URL de: /perfil
router.get('/', autentificar, getPerfil);
router.post('/cambiarImagen', upload.single('imagenPerfil'), postCambiarImagen);
router.post('/cambiarNombre', postCambiarNombre);
router.post('/cambiarContrasenia', postCambiarContrasenia);

module.exports = router;