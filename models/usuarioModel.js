const database = require('../database/database.js');


// Busco un usuario por nombre y contraseña y devuelvo sus datos
async function iniciarSesion(nombre, contrasenia)
{
    const resultado = await database.query(`
        SELECT * 
        FROM usuario
        WHERE nombre = ? AND contrasenia = ?`, [nombre, contrasenia] );

    if (resultado[0].length > 0) return resultado[0][0];
    else                         return null;
}


// Verifico si ya existe el nombre de usuario
async function existeUsuario(nombre)
{
    const resultado = await database.query(`
        SELECT * 
        FROM usuario
        WHERE nombre = ?`, [nombre] );
    
    if (resultado[0][0]) return true; // Si el valor no esta vacio significa que existe un usuario con ese nombre. Se devuelve true
    else                 return false;
}


// Actualizo el campo imagen del usuario
async function cambiarImagen(nombreNuevaImagen, nombre)
{
    return await database.query(`
        UPDATE usuario 
        SET imagenPerfil = ?
        WHERE nombre = ?`, [ nombreNuevaImagen, nombre ] );
}


// Actualizo el campo nombre del usuario
async function cambiarNombre(nuevoNombre, viejoNombre)
{
    return await database.query(`
        UPDATE usuario
        SET nombre = ?
        WHERE nombre = ?`, [nuevoNombre, viejoNombre] );
}


// Actualizo el campo nombre del usuario
async function cambiarContrasenia(nuevaContrasenia, nombre)
{
    return await database.query(`
        UPDATE usuario
        SET contrasenia = ?
        WHERE nombre = ?`, [nuevaContrasenia, nombre] );
}

module.exports = { 
    iniciarSesion,
    existeUsuario,
    cambiarImagen,  
    cambiarNombre,
    cambiarContrasenia,
};