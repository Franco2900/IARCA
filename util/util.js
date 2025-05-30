// ================== MÓDULOS Y DEPENDENCIAS ==================
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');     // Módulo para escribir, leer, borrar y renombrar archivos


// ================== VARIABLES DE ENTORNO ==================
require('dotenv').config(); // Carga las variables del archivo .env en process.env
const puerto  = process.env.PUERTO;
const dominio = process.env.DOMINIO;


// ================== FUNCIONES ÚTILES ==================
// Estas son funciones que son utilizadas por múltiples archivos.


// Redirige a la página de login si el usuario no está logueado 
function autentificarUsuario(req, res, next) 
{
    if (req.session && req.session.nombre) return next();
    else                                   res.redirect('/login');   
}


// Genera un nombre con la fecha y hora actuales
function obtenerNombreNuevoArchivo(nombreOriginal)
{
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = ('0' + (fecha.getMonth() + 1)).slice(-2);
    const dia = ('0' + fecha.getDate()).slice(-2);
    const horas = ('0' + fecha.getHours()).slice(-2);
    const minutos = ('0' + fecha.getMinutes()).slice(-2);
    const segundos = ('0' + fecha.getSeconds()).slice(-2);

    return `${año}${mes}${dia}_${horas}${minutos}${segundos}_${nombreOriginal}`; 
};


// Calcula el tiempo promedio que le toma a un repositorio actualizarse
function calcularTiempoPromedio(repositorio)
{
    let tiempoPromedio = 0;

    fs.readFile(path.join(__dirname, `../util/Tiempos/${repositorio}Tiempo.txt`), (error, datos) => { 
        if(error) console.log(error)
        else 
        {
            let tiempos = datos.toString().split(';'); // Separo los tiempos
            

            for(let i = 0; i < tiempos.length; i++)
            {
                if(i == tiempos.length-1) tiempos.splice(i, 1); // La última posición siempre esta vacia
                else
                {
                    tiempos[i] = parseInt(tiempos[i]);
                    tiempoPromedio += tiempos[i];
                }
            }

            tiempoPromedio = Math.ceil(tiempoPromedio / tiempos.length);

            // Escribo en un archivo json el resultado final
            fs.writeFile(path.join(__dirname, `../util/Tiempos/${repositorio}TiempoPromedio.json`), `[{"TiempoPromedio":${tiempoPromedio}}]`, error => 
            { 
                if(error) console.log(error);
            })
        }
    });

}


// Indica la URL en la que se encuentra el usuario web actualmente
function logURL(metodo, ruta) {
    console.log('***********************************************************');
    console.log(`URL actual: ${metodo} ${dominio}:${puerto}/iarca${ruta} \n`);
}


module.exports = { 
    autentificarUsuario,
    obtenerNombreNuevoArchivo,
    calcularTiempoPromedio,
    logURL,
};