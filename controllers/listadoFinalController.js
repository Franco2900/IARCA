// Modulos
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');     // Módulo para escribir, leer, borrar y renombrar archivos

// Metodos importados de 'util.js'
const { logURL } = require('./utilController');
const { crearListadoDeRevistas, armarTablaDeRevistas } = require('./listadoFinalControllerUtils.js');

const { calcularTiempoPromedio } = require('../util/utilActualizacion.js');

async function getListadoFinal(req, res)
{
    logURL(`GET`, `/listadoFinal`);

    const body = 'listadoFinalView';  // Vista a usar

    // Datos que va a usar la plantilla
    let cantidadRevistas = 0;
    let cantidadPaginasDeNavegacion = 0;
    let tiempoPromedioDeActualizacion = "No hay datos";
    let tabla = "<h2>No hay datos sobre este repositorio</h2>";
    let fechaUltimaModicacion = "No hay datos";

    if ( fs.existsSync( path.join(__dirname, `../util/Listado final/Listado final.json`) ) ) // Si existe el archivo JSON, se hace esto
    {
        // Borra la cache del archivo indicado para que cuando se lo vuevla a llamar al archivo no vuelva con datos viejos
        delete require.cache[require.resolve( path.join(__dirname, `../util/Listado final/Listado final.json`) )]; 

        let archivoJSON             = require( path.join(__dirname, `../util/Listado final/Listado final.json`) );
        cantidadRevistas = archivoJSON.length;
        cantidadPaginasDeNavegacion = Math.ceil( cantidadRevistas / 20 ); // Cada página de navegación tiene 20 revistas

        // Armado de la tabla de revistas con su paginación
        let listadoRevistas = crearListadoDeRevistas(archivoJSON); 
        let primeras20Revistas = [];

        for(let i = 0; i < 20; i++) 
        {
            if(i == listadoRevistas.length-1)  break;
            else                               primeras20Revistas.push( listadoRevistas[i] );
        }

        tabla = armarTablaDeRevistas( primeras20Revistas, 1 );

        // Más datos va a usar la plantilla
        let estadisticasDelArchivo = fs.statSync( path.join(__dirname, `../util/Listado final/Listado final.json`) );
        fechaUltimaModicacion = estadisticasDelArchivo.mtime;
        fechaUltimaModicacion = `${fechaUltimaModicacion.getDate()}/${fechaUltimaModicacion.getMonth()+1}/${fechaUltimaModicacion.getFullYear()}`;
    }


    if( fs.existsSync( path.join(__dirname, `../util/Tiempos/Listado finalTiempoPromedio.json`) ) )
    {
        delete require.cache[require.resolve( path.join(__dirname, `../util/Tiempos/Listado finalTiempoPromedio.json`) )]; 

        let archivoTiempo = require( path.join(__dirname, `../util/Tiempos/Listado finalTiempoPromedio.json`) );
        tiempoPromedioDeActualizacion = archivoTiempo[0].TiempoPromedio;
    }

    res.render('layout', {body, cantidadRevistas, cantidadPaginasDeNavegacion, tabla, fechaUltimaModicacion, tiempoPromedioDeActualizacion} ); 
}



async function getDescargarCSV(req, res)
{
    logURL(`GET`, `/listadoFinal/descargarCSV`);

    if( fs.existsSync( path.join(__dirname, `../util/Listado final/Listado final.csv`)) ) 
        res.download( path.join(__dirname, `../util/Listado final/Listado final.csv`) );

    else
        res.status(404).json( { mensaje: `El archivo Listado final.csv no fue encontrado.` } );
};



async function getDescargarJSON(req, res)
{ 
    logURL(`GET`, `/listadoFinal/descargarJSON`);

    if( fs.existsSync( path.join(__dirname, `../util/Listado final/Listado final.json`)) ) 
        res.download( path.join(__dirname, `../util/Listado final/Listado final.json`) );

    else
        res.status(404).json( { mensaje: `El archivo Listado final.json no fue encontrado.` } );
};



async function postSiguientePagina(req, res)
{ 
    logURL(`POST`, `/listadoFinal/siguientePagina`);

    
    const archivoJSON   = require(`../util/Listado final/Listado final.json`);
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

    let cantidadRevistasRepositorio = archivoJSON.length;
    let cantidadPaginasDeNavegacion   = Math.ceil( cantidadRevistasRepositorio / 20 );

    let paginaActual    = req.body.paginaActual;
    let paginaSiguiente = paginaActual + 1;

    if(paginaActual < cantidadPaginasDeNavegacion) // Si todavia queda una pagina para recorrer
    {
        let las20RevistasDelaPaginaSiguiente = [];

        for(let i = paginaActual * 20; i < paginaSiguiente * 20; i++) // Recorro desde la página que me quede, las proximas 20 revistas
        {
            if(i == listadoRevistas.length)  break;
            else                             las20RevistasDelaPaginaSiguiente.push( listadoRevistas[i] );
        }

        res.json( { tabla: armarTablaDeRevistas(las20RevistasDelaPaginaSiguiente, paginaSiguiente) } );
    }
    else
    {
        res.json( { mensaje: 'Ya esta en la última página de navegación' } );
    }

};



async function postAnteriorPagina(req, res)
{ 
    logURL(`POST`, `/listadoFinal/anteriorPagina`);

    const archivoJSON   = require(`../util/Listado final/Listado final.json`);
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

    let paginaActual   = req.body.paginaActual;
    let paginaAnterior = paginaActual - 1;

    if(paginaActual > 1) // Si no estoy en la primera pagina
    {
        let las20RevistasDelaPaginaAnterior = [];

        for(let i = (paginaAnterior-1) * 20; i < paginaAnterior * 20; i++) // Recorro desde la página anterior a la anterior, las anteriores 20 revistas
        {
            las20RevistasDelaPaginaAnterior.push( listadoRevistas[i] );
        }

        res.json( { tabla: armarTablaDeRevistas(las20RevistasDelaPaginaAnterior, paginaAnterior) } );
    }
    else
    {
        res.json( { mensaje: 'Ya esta en la primera página de navegación' } );
    }

};



async function postBuscarPaginaEspecifica(req, res)
{ 
    logURL(`POST`, `/listadoFinal/buscarPaginaEspecifica`);

    const archivoJSON   = require(`../util/Listado final/Listado final.json`);
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

    let cantidadRevistasRepositorio = archivoJSON.length;
    let cantidadPaginasDeNavegacion   = Math.ceil( cantidadRevistasRepositorio / 20 );

    let paginaBuscada = Number(req.body.paginaBuscada);
    let las20RevistasDelaPagina = [];

    if( paginaBuscada >= 1   &&   paginaBuscada <= cantidadPaginasDeNavegacion )
    {
        for(let i = (paginaBuscada-1)* 20; i < paginaBuscada * 20; i++) // Recorro desde la página buscada, las proximas 20 revistas
        {
            if(i == listadoRevistas.length)  break;
            else                             las20RevistasDelaPagina.push( listadoRevistas[i] );
        }

        res.json( { tabla: armarTablaDeRevistas( las20RevistasDelaPagina, paginaBuscada ) } );
    }
    else
    {
        res.json( { mensaje: 'Esa página de navegación no existe' } );
    }

};



async function postPrimerPagina(req, res)
{ 
    logURL(`POST`, `/listadoFinal/primerPagina`);

    const archivoJSON   = require(`../util/Listado final/Listado final.json`);
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

    let las20RevistasDelaPagina = [];

    for(let i = 0; i < 20; i++)
    {
        if(i == listadoRevistas.length)  break;
        else                             las20RevistasDelaPagina.push( listadoRevistas[i] );
    }

    res.json( { tabla: armarTablaDeRevistas( las20RevistasDelaPagina, 1 ) } );
};



async function postUltimaPagina(req, res)
{ 
    logURL(`POST`, `/listadoFinal/ultimaPagina`);


    const archivoJSON   = require(`../util/Listado final/Listado final.json`);
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

    let cantidadRevistasRepositorio = archivoJSON.length;
    let cantidadPaginasDeNavegacion = Math.ceil( cantidadRevistasRepositorio / 20 );

    let las20RevistasDelaPagina = [];

    for(let i = (cantidadPaginasDeNavegacion-1)* 20; i < cantidadPaginasDeNavegacion * 20; i++)
    {
        if(i == listadoRevistas.length)  break;
        else                             las20RevistasDelaPagina.push( listadoRevistas[i] );
    }

    res.json( { tabla: armarTablaDeRevistas( las20RevistasDelaPagina, cantidadPaginasDeNavegacion ) } );
};



async function postActualizarCatalogo(req, res)
{
    logURL(`POST`, `/listadoFinal/actualizarCatalogo`);

    try
    {
        let archivoDeActualizacion = require(`../util/Listado final/listadoFinal.js`);
        
        console.log(`Actualizando el listado final`);
        await archivoDeActualizacion.crearListado(); // Llamo al método de actualización dentro del archivo .js
    
        res.status(200).json( { mensaje: "Actualización exitosa" } ); 
    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }
}


async function postBuscarRevistaPorNombre(req, res)
{
    try
    {
        logURL(`POST`, `/listadoFinal/buscarRevistaPorNombre`); // Log de consola

        const tituloRevista = req.body.tituloRevista.trim().toLowerCase();       // Revista a buscar
        const archivoJSON = require(`../util/Listado final/Listado final.json`); // Archivo JSON en el que buscar

        // Busqueda de coincidencias parciales teniendo en cuenta la posición de los carácteres
        //const resultadosFiltro = archivoJSON.filter( item => item.Título.toLowerCase().startsWith(tituloRevista) );

        // Busqueda de coincidencias parciales si contiene los caracteres
        const resultadosFiltro = archivoJSON.filter( item => item.Título.toLowerCase().includes(tituloRevista) );

        let listadoRevistas = crearListadoDeRevistas(resultadosFiltro); // Parseo el arreglo JSON a un arreglo de objetos
        tabla = armarTablaDeRevistas( listadoRevistas, 1 ); // Armo la tabla HTML
        
        res.send(tabla); // Envio la tabla HTMLS
    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }
}


async function postBuscarRevistaPorISSNimpreso(req, res)
{
    try
    {
        logURL(`POST`, `/listadoFinal/buscarRevistaPorISSNimpreso`); // Log de consola

        const issnImpreso = req.body.issnImpreso.trim().toLowerCase();           // Revista a buscar
        const archivoJSON = require(`../util/Listado final/Listado final.json`); // Archivo JSON en el que buscar

        // Busqueda de coincidencias parciales teniendo en cuenta la posición de los carácteres
        //const resultadosFiltro = archivoJSON.filter( item => item['ISSN impresa'].toLowerCase().startsWith(issnImpreso) );

        // Busqueda de coincidencias parciales si contiene los caracteres
        const resultadosFiltro = archivoJSON.filter( item => item['ISSN impresa'].toLowerCase().includes(issnImpreso) );

        let listadoRevistas = crearListadoDeRevistas(resultadosFiltro); // Parseo el arreglo JSON a un arreglo de objetos
        tabla = armarTablaDeRevistas( listadoRevistas, 1 ); // Armo la tabla HTML
        
        res.send(tabla); // Envio la tabla HTMLS
    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }
}


async function postBuscarRevistaPorISSNelectronico(req, res)
{
    try
    {
        logURL(`POST`, `/listadoFinal/buscarRevistaPorISSNelectronico`); // Log de consola

        const issnElectronico = req.body.issnElectronico.trim().toLowerCase();   // Revista a buscar
        const archivoJSON = require(`../util/Listado final/Listado final.json`); // Archivo JSON en el que buscar

        // Busqueda de coincidencias parciales teniendo en cuenta la posición de los carácteres
        //const resultadosFiltro = archivoJSON.filter( item => item['ISSN en linea'].toLowerCase().startsWith(issnElectronico) );

        // Busqueda de coincidencias parciales si contiene los caracteres
        const resultadosFiltro = archivoJSON.filter( item => item['ISSN en linea'].toLowerCase().includes(issnElectronico) );

        let listadoRevistas = crearListadoDeRevistas(resultadosFiltro); // Parseo el arreglo JSON a un arreglo de objetos
        tabla = armarTablaDeRevistas( listadoRevistas, 1 ); // Armo la tabla HTML
        
        res.send(tabla); // Envio la tabla HTMLS
    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }
}


async function postBuscarRevistaPorInstituto(req, res)
{
    try
    {
        logURL(`POST`, `/listadoFinal/buscarRevistaPorInstituto`); // Log de consola

        const instituto = req.body.instituto.trim().toLowerCase();  // Revista a buscar
        const archivoJSON = require(`../util/Listado final/Listado final.json`); // Archivo JSON en el que buscar

        // Busqueda de coincidencias parciales teniendo en cuenta la posición de los carácteres
        //const resultadosFiltro = archivoJSON.filter( item => item['Instituto/Editorial'].toLowerCase().startsWith(instituto) );

        // Busqueda de coincidencias parciales si contiene los caracteres
        const resultadosFiltro = archivoJSON.filter( item => item['Instituto/Editorial'].toLowerCase().includes(instituto) );

        let listadoRevistas = crearListadoDeRevistas(resultadosFiltro); // Parseo el arreglo JSON a un arreglo de objetos
        tabla = armarTablaDeRevistas( listadoRevistas, 1 ); // Armo la tabla HTML
        
        res.send(tabla); // Envio la tabla HTMLS
    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }
}

module.exports = { 
    getListadoFinal, 
    getDescargarCSV, 
    getDescargarJSON, 
    postSiguientePagina, 
    postAnteriorPagina,
    postBuscarPaginaEspecifica, 
    postPrimerPagina,
    postUltimaPagina,
    postActualizarCatalogo,
    postBuscarRevistaPorNombre,
    postBuscarRevistaPorISSNimpreso,
    postBuscarRevistaPorISSNelectronico,
    postBuscarRevistaPorInstituto,
};