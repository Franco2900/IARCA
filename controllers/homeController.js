// Modulos
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');

// Metodos importados de 'util.js'
const { logURL } = require('./utilController');

async function getHome(req, res)
{
    logURL(`GET`, `/`);

    const body = 'homeView';  // Vista a usar

    // Calculo los datos a usar en la tabla de estado de los repositorios
    let repositorios = ['NBRA', 'Latindex', 'DOAJ', 'Redalyc', 'Biblat', 'Scimago', 'Scielo', 'Web of Science', 'Dialnet'];
    let cantidadRevistas = {};
    let sumatoriaCantidadRevistas = 0;
    let fechaUltimaModificacion = {};
    let estado = {};
    let colorEstado = {};
    let cantidadListadoFinal = require( path.join(__dirname, `../util/Listado final/Listado final.json`) ).length;

    for(let i = 0; i < repositorios.length; i++)
    {
        try
        {
            // Reviso los archivos JSON uno por uno
            let archivoJSON = require( path.join(__dirname, `../util/Repositorios/${repositorios[i]}.json`) ); 

            // CALCULO DE LA CANTIDAD DE REVISTAS
            cantidadRevistas[ `${repositorios[i]}` ] = archivoJSON.length;  // Agrego el dato de la cantidad de revistas en el objeto simple
            sumatoriaCantidadRevistas += archivoJSON.length;
        
            // CALCULO LA FECHA DE ULTIMA ACTUALIZACIÓN DEL ARCHIVO
            let estadisticasDelArchivo = fs.statSync( path.join(__dirname, `../util/Repositorios/${repositorios[i]}.json`) ); // Me devuelve datos estadisticos del archivo
            let fechaModicacion = estadisticasDelArchivo.mtime; // mtime = modification time
            fechaUltimaModificacion[ `${repositorios[i]}` ] = `${fechaModicacion.getDate()}/${fechaModicacion.getMonth()+1}/${fechaModicacion.getFullYear()}`; // getMonth() devuelve un valor entre 0 y 11, siendo 0 el mes de Enero; por eso se le suma uno
            
            // CALCULO EL ESTADO DE LOS ARCHIVOS (verde: actualizado, amarillo: desactualizado, rojo: datos inexistentes)
            let fechaActual = new Date();
    
            let diferenciaDeTiempo = (fechaActual.getFullYear() - fechaModicacion.getFullYear() ) * 12; // A la diferencia en años la multiplicamos por 12 para tener la diferencia en meses
            diferenciaDeTiempo += fechaActual.getMonth()+1;     // Le sumo los meses que ya pasaron de este año
            diferenciaDeTiempo -= fechaModicacion.getMonth()+1; // Le resto los meses que ya pasaron del año de modificación
            diferenciaDeTiempo *= 30  // A la diferencia en meses la multiplicamos por 30 para tener la diferencia en días
            
            if(diferenciaDeTiempo > 365) 
            {
                estado[ `${repositorios[i]}` ] = 'Datos desactualizados';
                colorEstado[ `${repositorios[i]}` ] = 'yellow';
            }
            else 
            {
                estado[ `${repositorios[i]}` ] = 'Datos al día';
                colorEstado[ `${repositorios[i]}` ] = 'green';
            }

        }
        catch(error)
        {
            console.log(error);

            estado[ `${repositorios[i]}` ] = 'No hay datos disponibles';
            colorEstado[ `${repositorios[i]}` ] = 'red';
        }
    }


    res.render('layout', {body, cantidadRevistas, sumatoriaCantidadRevistas, cantidadListadoFinal, fechaUltimaModificacion, estado, colorEstado } ); 
}

module.exports = { getHome };