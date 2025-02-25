async function getInfo(req, res)
{
    // Logging
    console.log('***********************************************************');
    console.log('Ruta: GET /info \n');

    const usuario = req.session;
    const body = 'infoView';  // Vista a usar

    res.render('layout', {usuario, body} ); 
}

module.exports = { getInfo };