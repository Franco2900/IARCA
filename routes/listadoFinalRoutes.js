// URL base: http://DOMINIO/listadoFinal/

// ================== MÓDULOS Y DEPENDENCIAS ==================
const router = require('express').Router(); // Permite definir rutas

// ================== MIDDLEWARES A NIVEL DE ROUTER ==================
//const { autentificarUsuario } = require('./utilRoutes.js'); // Este middleware solo afecta a rutas especificas

// ================== RUTAS DE NAVEGACIÓN DEL USUARIO ==================
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