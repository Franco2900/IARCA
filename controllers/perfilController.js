// Modulos
const path = require('path'); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');   // Módulo para escribir, leer, borrar y renombrar archivos

const { obtenerNombreNuevoArchivo, logURL } = require('../util/util.js');
const { cambiarImagen, existeUsuario, cambiarNombre, cambiarContrasenia } = require('../models/usuarioModel.js');



async function getPerfil(req, res)
{
    logURL(`GET`, `/perfil`);

    const body = 'perfilView';  // Vista a usar

    res.render('layout', {body} ); 
}



async function postCambiarImagen(req, res) 
{
    logURL(`POST`, `/perfil/cambiarImagen`);
    
    if (req.file) console.log('Archivo recibido:', req.file);
    else          return res.status(400).send('No se recibió ningún archivo.');

    const nombreViejaImagen = req.session.imagenPerfil;
    const lugarGuardadoFisicoViejaImagen = path.join(__dirname, '../public/images/perfil', nombreViejaImagen);
    
    const nombreNuevaImagen = obtenerNombreNuevoArchivo(req.file.originalname);
    const lugarGuardadoFisicoNuevaImagen = path.join(__dirname, '../public/images/perfil', nombreNuevaImagen);

    const imagenBuffer = req.file.buffer;

    try 
    {
        // Borro la vieja imagen (solo si no es la imagén de usuario por defecto)
        if(nombreViejaImagen != 'avatar unisex.webp') 
        {
            fs.unlink(lugarGuardadoFisicoViejaImagen, (err) => {
                if (err) {
                console.error('Hubo un error al intentar borrar el archivo:', err);
                return;
                }
            });
        }

        fs.writeFileSync(lugarGuardadoFisicoNuevaImagen, imagenBuffer); // Guardo la nueva imagen fisicamente

        await cambiarImagen(nombreNuevaImagen, req.session.nombre); // Modifico la imagen del usuario en la base de datos
    
        req.session.imagenPerfil = nombreNuevaImagen; // Actualizo los datos de sesion del usuario

        return res.status(200).json({ message: 'Imagen cambiada exitosamente.' }); // Envío respuesta de éxito al cliente
    }
    catch (error) 
    {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Ocurrió un error al cambiar la imagen.' }); // Envío respuesta de error al cliente
    }
    
}



async function postCambiarNombre(req, res) 
{
    logURL(`POST`, `/perfil/cambiarNombre`);

    if (req.body.nuevoNombre) console.log('Nuevo nombre recibido:', req.body.nuevoNombre);
    else                      res.status(400).send('No se recibió ningún nombre.');

    const viejoNombre = req.session.nombre;
    const nuevoNombre = req.body.nuevoNombre;

    try
    {
        if( await existeUsuario(nuevoNombre) ) return res.status(409).json({error: 'Ese nombre ya esta siendo usado por otro usuario' });  // Envío respuesta de error al cliente
        else
        {
            await cambiarNombre(nuevoNombre, viejoNombre);
            req.session.nombre = nuevoNombre; // Actualizo los datos de sesion del usuario

            return res.status(200).json({ message: 'Nombre cambiado exitosamente.' }); // Envío respuesta de éxito al cliente
        }
    }
    catch(error)
    {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Ocurrió un error al cambiar el nombre.' });  // Envío respuesta de error al cliente
    }

}


async function postCambiarContrasenia(req, res) 
{
    logURL(`POST`, `/perfil/cambiarContrasenia`);

    if (req.body.nuevaContrasenia) console.log('Nueva contraseña recibida:', req.body.nuevaContrasenia);
    else                           res.status(400).send('No se recibió ninguna contraseña.');

    const nuevaContrasenia = req.body.nuevaContrasenia;

    try
    {
        await cambiarContrasenia(nuevaContrasenia, req.session.nombre);
        req.session.contrasenia = nuevaContrasenia; // Actualizo los datos de sesion del usuario

        return res.status(200).json({ message: 'Contraseña cambiada exitosamente.' }); // Envío respuesta de éxito al cliente
    }
    catch(error)
    {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Ocurrió un error al cambiar la contraseña.' });  // Envío respuesta de error al cliente
    }

}

module.exports = { getPerfil, postCambiarImagen, postCambiarNombre, postCambiarContrasenia };