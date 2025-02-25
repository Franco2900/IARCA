// Modulos
var express = require('express');
var router  = express.Router();

// Métodos del controller
const { 
    getRepositorio, 
    postDescargarCSV, postDescargarJSON, 
    postSiguientePagina, postAnteriorPagina,
    postBuscarPaginaEspecifica,
    postPrimerPagina, postUltimaPagina,
    postActualizarCatalogo } = require('../controllers/repositorioController');

// Rutas URL de: /repositorio
// router.get('/'); No se usa
router.get('/:repositorio',               getRepositorio); // El : significa que es una ruta dinamica
router.post('/:repositorio/descargarCSV',           postDescargarCSV);
router.post('/:repositorio/descargarJSON',          postDescargarJSON);
router.post('/:repositorio/siguientePagina',        postSiguientePagina);
router.post('/:repositorio/anteriorPagina',         postAnteriorPagina);
router.post('/:repositorio/buscarPaginaEspecifica', postBuscarPaginaEspecifica);
router.post('/:repositorio/primerPagina',           postPrimerPagina);
router.post('/:repositorio/ultimaPagina',           postUltimaPagina);
router.post('/:repositorio/ultimaPagina',           postUltimaPagina);
router.post('/:repositorio/actualizarCatalogo',     postActualizarCatalogo);

module.exports = router;