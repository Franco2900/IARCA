// Modulos
var express = require('express');
var router  = express.Router();

const multer = require('multer');                           // Modulo para manejar la subidad de archivos
const upload = multer({ storage: multer.memoryStorage() }); // Creo una instancia de multer

// Métodos del controller
const { 
    getRepositorio, 
    getDescargarCSV, getDescargarJSON, 
    postSiguientePagina, postAnteriorPagina,
    postBuscarPaginaEspecifica,
    postPrimerPagina, postUltimaPagina,
    postActualizarCatalogo,
    postExcelDialnet,
} 
= require('../controllers/repositorioController');

// Rutas URL de: /repositorio
// router.get('/'); No se usa
router.get('/:repositorio',               getRepositorio); // El : significa que es una ruta dinamica
router.get('/:repositorio/descargarCSV',  getDescargarCSV);
router.get('/:repositorio/descargarJSON', getDescargarJSON);
router.post('/:repositorio/siguientePagina',        postSiguientePagina);
router.post('/:repositorio/anteriorPagina',         postAnteriorPagina);
router.post('/:repositorio/buscarPaginaEspecifica', postBuscarPaginaEspecifica);
router.post('/:repositorio/primerPagina',           postPrimerPagina);
router.post('/:repositorio/ultimaPagina',           postUltimaPagina);
router.post('/:repositorio/actualizarCatalogo',     postActualizarCatalogo);

router.post('/Dialnet/excelDialnet', upload.single('excelDialnet'), postExcelDialnet); //Solo para el caso especial de Dialnet en el que no podemos hacemos webscrapping o llamado a apis

module.exports = router;