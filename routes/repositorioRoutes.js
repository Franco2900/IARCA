// URL base: http://DOMINIO/:repositorio/
// El : significa que es una ruta dinamica

// Modulos
const router = require('express').Router(); // Permite definir rutas

const multer = require('multer');                           // Modulo para manejar la subidad de archivos
const upload = multer({ storage: multer.memoryStorage() }); // Creo una instancia de multer

// Rutas URL de: /repositorio
// router.get('/'); No se usa
router.get ( '/:repositorio',                        require('../controllers/repositorioController').getRepositorio ); 
router.get ( '/:repositorio/descargarCSV',           require('../controllers/repositorioController').getDescargarCSV );
router.get ( '/:repositorio/descargarJSON',          require('../controllers/repositorioController').getDescargarJSON );
router.post( '/:repositorio/siguientePagina',        require('../controllers/repositorioController').postSiguientePagina );
router.post( '/:repositorio/anteriorPagina',         require('../controllers/repositorioController').postAnteriorPagina );
router.post( '/:repositorio/buscarPaginaEspecifica', require('../controllers/repositorioController').postBuscarPaginaEspecifica );
router.post( '/:repositorio/primerPagina',           require('../controllers/repositorioController').postPrimerPagina );
router.post( '/:repositorio/ultimaPagina',           require('../controllers/repositorioController').postUltimaPagina );
router.post( '/:repositorio/actualizarCatalogo',     require('../controllers/repositorioController').postActualizarCatalogo );

//Solo para el caso especial de Dialnet en el que no podemos hacemos webscrapping o llamado a apis
router.post( '/Dialnet/excelDialnet', upload.single('excelDialnet'), require('../controllers/repositorioController').postExcelDialnet ); 

module.exports = router;