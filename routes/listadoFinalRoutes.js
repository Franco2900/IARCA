// URL base: http://DOMINIO/listadoFinal/

// Modulos
const router = require('express').Router(); // Permite definir rutas

// Defino las rutas de navegación del usuario
router.get ( '/',                       require('../controllers/listadoFinalController').getListadoFinal );
router.get ( '/descargarCSV',           require('../controllers/listadoFinalController').getDescargarCSV);
router.get ( '/descargarJSON',          require('../controllers/listadoFinalController').getDescargarJSON );
router.post( '/siguientePagina',        require('../controllers/listadoFinalController').postSiguientePagina );
router.post( '/anteriorPagina',         require('../controllers/listadoFinalController').postAnteriorPagina);
router.post( '/buscarPaginaEspecifica', require('../controllers/listadoFinalController').postBuscarPaginaEspecifica );
router.post( '/primerPagina',           require('../controllers/listadoFinalController').postPrimerPagina );
router.post( '/ultimaPagina',           require('../controllers/listadoFinalController').postUltimaPagina );
router.post( '/actualizarCatalogo',     require('../controllers/listadoFinalController').postActualizarCatalogo );

module.exports = router;