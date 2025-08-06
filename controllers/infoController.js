// Metodos importados de 'util.js'
const { logURL } = require('./utilController');

async function getInfo(req, res)
{
    logURL(`GET`, `/info`);

    const body = 'infoView';  // Vista a usar

    res.render('layout', {body} ); 
}

module.exports = { getInfo };