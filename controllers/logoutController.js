// Metodos importados de 'util.js'
const { logURL } = require('./utilController');

async function getLogout(req, res)
{
    logURL(`GET`, `/logout`);

    req.session.destroy((error) => { 
        if (error) return res.status(500).send('Error al cerrar sesión'); 
        res.redirect('/iarca/'); 
    });
    
}

module.exports = { getLogout };