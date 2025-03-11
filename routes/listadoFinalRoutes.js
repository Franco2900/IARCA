// Modulos
var express = require('express');
var router  = express.Router();

// Métodos del controller
const 
{ 
    getListadoFinal, 
    getDescargarCSV, getDescargarJSON,
    postSiguientePagina, postAnteriorPagina,
    postBuscarPaginaEspecifica,
    postPrimerPagina, postUltimaPagina,
    postActualizarCatalogo,
} 
 = require('../controllers/listadoFinalController');

// Rutas URL de: /listadoFinal
router.get( '/',              getListadoFinal );
router.get( '/descargarCSV',  getDescargarCSV);
router.get( '/descargarJSON', getDescargarJSON);
router.post('/siguientePagina',        postSiguientePagina);
router.post('/anteriorPagina',         postAnteriorPagina);
router.post('/buscarPaginaEspecifica', postBuscarPaginaEspecifica);
router.post('/primerPagina',           postPrimerPagina);
router.post('/ultimaPagina',           postUltimaPagina);
router.post('/actualizarCatalogo',     postActualizarCatalogo);

module.exports = router;