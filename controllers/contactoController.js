// Metodos importados de 'util.js'
const { logURL } = require('./utilController');

async function getContacto(req, res)
{
    logURL(`GET`, `/contacto`);

    const body = 'contactoView';  // Vista a usar

    res.render('layout', {body} ); 
}

module.exports = { getContacto };