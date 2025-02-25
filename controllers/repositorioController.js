// Modulos
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');     // Módulo para escribir, leer, borrar y renombrar archivos

// Metodos exportados de 'util.js'
const { crearListadoDeRevistas, armarTablaDeRevistas, calcularTiempoPromedio } = require('../util/util.js');


async function getRepositorio(req, res) // A ESTE MÉTODO LE FALTA UN TRY-CATCH EN CASO DE QUE NO SE ENCUENTREN LOS ARCHIVOS QUE NECESITA
{
    //console.log(req.params); // Los datos de una ruta dinamica se almacenan aquí
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio} \n`);

    const usuario = req.session;
    const body = 'repositorioView';  // Vista a usar

    // Datos que va a usar la plantilla
    let archivoJSON      = require( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) );
    let cantidadRevistasRepositorio = archivoJSON.length;
    let cantidadPaginasDeNavegacion = Math.ceil( cantidadRevistasRepositorio / 20 ); // Cada página de navegación tiene 20 revistas

    // Armado de la tabla de revistas con su paginación
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 
    let primeras20Revistas = [];

    for(let i = 0; i < 20; i++) 
    {
        if(i == listadoRevistas.length-1)  break;
        else                               primeras20Revistas.push( listadoRevistas[i] );
    }

    let tabla = armarTablaDeRevistas( primeras20Revistas, 1 );

    // Más datos va a usar la plantilla
    let estadisticasDelArchivo = fs.statSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) );
    let fechaUltimaModicacion = estadisticasDelArchivo.mtime;
    fechaUltimaModicacion = `${fechaUltimaModicacion.getDate()}/${fechaUltimaModicacion.getMonth()+1}/${fechaUltimaModicacion.getFullYear()}`;

    let archivoTiempo = require( path.join(__dirname, `../util/Tiempos/${repositorio}TiempoPromedio.json`) );
    let tiempoPromedioDeActualizacion = archivoTiempo[0].TiempoPromedio;

    res.render('layout', { usuario, body, repositorio, cantidadRevistasRepositorio, cantidadPaginasDeNavegacion, tabla, fechaUltimaModicacion, tiempoPromedioDeActualizacion } ); 
}



async function postDescargarCSV(req, res)
{
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/descargarCSV \n`);

    res.download( path.join(__dirname, `../util/Repositorios/${repositorio}.csv`) );
};



async function postDescargarJSON(req, res)
{ 
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/descargarJSON \n`);

    res.download( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) );
};



async function postSiguientePagina(req, res)
{ 
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/siguientePagina \n`);

    
    const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
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
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/anteriorPagina \n`);


    const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
    let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

    let paginaActual    = req.body.paginaActual;
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
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/buscarPaginaEspecifica \n`);


    const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
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
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/primerPagina \n`);


    const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
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
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/ultimaPagina \n`);


    const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
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
    let repositorio = req.params.repositorio;

    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: GET /repositorio/${repositorio}/actualizarCatalogo \n`);

    try
    {
        let tiempoEmpieza = Date.now();

        archivoDeExtraccion = require(`../util/modulos de extraccion/${repositorio}.js`);
        
        console.log(`Extrayendo datos del repositorio ${repositorio}`);
        await archivoDeExtraccion.extraerInfoRepositorio(); // Llamo al método de extracción dentro del archivo .js

        // Si el archivo JSON ya existe y solo se actualiza, se ejecuta esto
        if( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) ) 
        { 
            // Cuando detecta una modificación en el archivo indicado, se ejecuta la función
            let vigilante = fs.watch( path.join(__dirname, `../util/Repositorios/${repositorio}.json`), () => { 
                
                vigilante.close();
                let tiempoTermina = Date.now();
                let segundos = Math.ceil( ( tiempoTermina - tiempoEmpieza) / 1000 );
    
                console.log(`Se tardo ${segundos} segundos en extraer los datos`);

                fs.appendFile(path.join(__dirname, `../util/Tiempos/${repositorio}Tiempo.txt`), `${segundos};`, error => 
                { 
                    if(error) console.log(error);
                })

                calcularTiempoPromedio(repositorio);

                res.status(200).json( { mensaje: "Actualización exitosa" } ); 
            });

        }

    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }

}


module.exports = { 
    getRepositorio, 
    postDescargarCSV, 
    postDescargarJSON,
    postSiguientePagina,
    postAnteriorPagina,
    postBuscarPaginaEspecifica,
    postPrimerPagina,
    postUltimaPagina,
    postActualizarCatalogo
};