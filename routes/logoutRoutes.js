// Modulos
var express = require('express')
var router = express.Router()

// Rutas de: /logout
router.get('/', (req, res) => {

    // Logging
    console.log('***********************************************************');
    console.log('Ruta: GET /logout \n');

    req.session.destroy((error) => { 
        if (error) return res.status(500).send('Error al cerrar sesión'); 
        res.redirect('/'); 
    });

});

module.exports = router;

// NOTA: logout no tiene controller porque es solo para cerrar la sesion del usuario