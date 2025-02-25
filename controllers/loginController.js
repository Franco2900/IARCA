const { iniciarSesion } = require('../models/usuarioModel');

async function getLogin(req, res)
{
    // Logging
    console.log('***********************************************************');
    console.log('Ruta: GET /login \n');

    const usuario = req.session;
    const body = 'loginView';  // Vista a usar

    res.render('layout', {usuario, body} ); 
}


async function postLogin(req, res) 
{
    console.log('***********************************************************');
    console.log('Ruta: POST /login \n');
    console.log('Datos ingresados por el usuario');
    console.log(req.body);

    try 
    {
        const usuario = await iniciarSesion(req.body.nombre, req.body.contrasenia);

        // Si existe, el usuario inicia sesion
        if (usuario) 
        {
            req.session.nombre       = usuario.nombre;
            req.session.contrasenia  = usuario.contrasenia;
            req.session.imagenPerfil = usuario.imagenPerfil;

            res.send(`
                <script>
                    window.location.href = "/";
                </script>`);
        } 

        // Si no existe, le informo al usuario del error
        else 
        {
            res.send(`
                <script>
                    alert("Nombre o contraseña incorrectos");
                    window.location.href = "/login/";
                </script>`);
        }

    } 
    catch (error) 
    {
        res.status(500).send();
        console.log(error);
    }
}

module.exports = { getLogin, postLogin };