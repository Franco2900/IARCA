const database = require('../database/database.js');

// Averiguo el estado de la actualizacion
async function estadoActual(repositorio)
{
    const resultado = await database.query(`
        SELECT actualizandose 
        FROM estadoactualizacion
        WHERE repositorio = ?`, [repositorio] );
    
    return resultado[0][0].actualizandose;
}


// Actualiza el estado del repositorio para saber si esta en proceso de actualización o no
async function actualizarEstado(estado, repositorio)
{
    return await database.query(`
        UPDATE estadoactualizacion 
        SET actualizandose = ?
        WHERE repositorio = ?`, [ estado, repositorio ] );
}

module.exports = { 
    estadoActual,
    actualizarEstado,
};