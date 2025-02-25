async function getContacto(req, res)
{
    // Logging
    console.log('***********************************************************');
    console.log('Ruta: GET /contacto \n');

    const usuario = req.session;
    const body = 'contactoView';  // Vista a usar

    res.render('layout', {usuario, body} ); 
}

module.exports = { getContacto };