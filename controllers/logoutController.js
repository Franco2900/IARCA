// Metodos importados de 'util.js'
const { logURL } = require('../util/util.js');

async function getLogout(req, res)
{
    logURL(`GET`, `/logout`);

    req.session.destroy((error) => { 
        if (error) return res.status(500).send('Error al cerrar sesión'); 
        res.redirect('/'); 
    });
    
}

module.exports = { getLogout };