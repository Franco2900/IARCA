// Modulos
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');     // Módulo para escribir, leer, borrar y renombrar archivos
const xlsx = require('xlsx');       // Módulo para trabajar con archivos excel
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json

// Metodos importados
const { logURL } = require('./utilController');
const { crearListadoDeRevistas, armarTablaDeRevistas } = require('./repositorioControllerUtils.js');
const { estadoActual, actualizarEstado } = require('../models/estadoActualizacionModel.js');

async function getRepositorio(req, res)
{
    //console.log(req.params); // Los datos de una ruta dinamica se almacenan aquí
    let repositorio = req.params.repositorio;

    logURL(`GET`, `/repositorio/${repositorio}`);

    const body = 'repositorioView';  // Vista a usar

    // Datos que va a usar la plantilla
    let cantidadRevistasRepositorio = 0;
    let cantidadPaginasDeNavegacion = 0;
    let tiempoPromedioDeActualizacion = "No hay datos";
    let tabla = "<h2>No hay datos sobre este repositorio</h2>";
    let fechaUltimaModificacion = "No hay datos";
    let actualizandose = false;

    // Si existe el archivo JSON con los datos del repositorio, se hace esto
    if ( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) ) 
    {
        // Borra la cache del archivo indicado para que cuando se lo vuevla a llamar al archivo no vuelva con datos viejos
        delete require.cache[require.resolve( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) )]; 

        let archivoJSON             = require( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) );
        cantidadRevistasRepositorio = archivoJSON.length;
        cantidadPaginasDeNavegacion = Math.ceil( cantidadRevistasRepositorio / 20 ); // Cada página de navegación tiene 20 revistas

        // Armado de la tabla de revistas con su paginación
        let listadoRevistas = crearListadoDeRevistas(archivoJSON); 
        let primeras20Revistas = [];

        for(let i = 0; i < 20; i++) 
        {
            if(i == listadoRevistas.length-1)  break;
            else                               primeras20Revistas.push( listadoRevistas[i] );
        }
 
        tabla = armarTablaDeRevistas( primeras20Revistas, 1 );

        // Averigua la fecha y hora de la ultima actualización de los datos
        let estadisticasDelArchivo = fs.statSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) );
        fechaUltimaModificacion = estadisticasDelArchivo.mtime;

        let dia      = String(fechaUltimaModificacion.getDate()).padStart(2, '0');
        let mes      = String(fechaUltimaModificacion.getMonth() + 1).padStart(2, '0');
        let anio     = fechaUltimaModificacion.getFullYear();
        let hora     = String(fechaUltimaModificacion.getHours()).padStart(2, '0');
        let minutos  = String(fechaUltimaModificacion.getMinutes()).padStart(2, '0');
        let segundos = String(fechaUltimaModificacion.getSeconds()).padStart(2, '0');

        fechaUltimaModificacion = `${dia}/${mes}/${anio} ${hora}:${minutos}:${segundos}`;
    }


    // Si existe el archivo JSON con el tiempo promedio, se hace esto
    if( fs.existsSync( path.join(__dirname, `../util/Tiempos/${repositorio}TiempoPromedio.json`) ) )
    {
        delete require.cache[require.resolve( path.join(__dirname, `../util/Tiempos/${repositorio}TiempoPromedio.json`) )]; 

        let archivoTiempo = require( path.join(__dirname, `../util/Tiempos/${repositorio}TiempoPromedio.json`) );
        tiempoPromedioDeActualizacion = archivoTiempo[0].TiempoPromedio;
    }

    // Averiguo si el repositorio esta actualizandose en este momento
    actualizandose = await estadoActual(repositorio);

    res.render('layout', { body, repositorio, cantidadRevistasRepositorio, cantidadPaginasDeNavegacion, tabla, fechaUltimaModificacion, tiempoPromedioDeActualizacion, actualizandose } ); 
}



async function getDescargarCSV(req, res)
{
    let repositorio = req.params.repositorio;

    logURL(`GET`, `/repositorio/${repositorio}/descargarCSV`);

    if( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.csv`)) ) 
        res.download( path.join(__dirname, `../util/Repositorios/${repositorio}.csv`) );

    else
        res.status(404).json( { mensaje: `El archivo ${repositorio}.csv no fue encontrado.` } );
};



async function getDescargarJSON(req, res)
{ 
    let repositorio = req.params.repositorio;

    logURL(`GET`, `/repositorio/${repositorio}/descargarJSON`);

    if( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.csv`)) ) 
        res.download( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) );

    else
        res.status(404).json( { mensaje: `El archivo ${repositorio}.json no fue encontrado.` } );
};



async function postSiguientePagina(req, res)
{ 
    let repositorio = req.params.repositorio;

    logURL(`POST`, `/repositorio/${repositorio}/siguientePagina`);

    if ( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) )
    {
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

    }
    else 
    {   
        res.status(404).json( { mensaje: `El archivo ${repositorio}.json no fue encontrado.` } );
    }

};



async function postAnteriorPagina(req, res)
{ 
    let repositorio = req.params.repositorio;

    logURL(`POST`, `/repositorio/${repositorio}/anteriorPagina`);

    if ( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) )
    {

        const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
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

    }
    else 
    {   
        res.status(404).json( { mensaje: `El archivo ${repositorio}.json no fue encontrado.` } );
    }
    
};



async function postBuscarPaginaEspecifica(req, res)
{ 
    let repositorio = req.params.repositorio;

    logURL(`POST`, `/repositorio/${repositorio}/buscarPaginaEspecifica`);

    if ( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) )
    {
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

    }
    else 
    {   
        res.status(404).json( { mensaje: `El archivo ${repositorio}.json no fue encontrado.` } );
    }

};



async function postPrimerPagina(req, res)
{ 
    let repositorio = req.params.repositorio;

    logURL(`POST`, `/repositorio/${repositorio}/primerPagina`);

    if ( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) )
    {
        const archivoJSON   = require(`../util/Repositorios/${repositorio}.json`);
        let listadoRevistas = crearListadoDeRevistas(archivoJSON); 

        let las20RevistasDelaPagina = [];

        for(let i = 0; i < 20; i++)
        {
            if(i == listadoRevistas.length)  break;
            else                             las20RevistasDelaPagina.push( listadoRevistas[i] );
        }

        res.json( { tabla: armarTablaDeRevistas( las20RevistasDelaPagina, 1 ) } );
    }
    else 
    {   
        res.status(404).json( { mensaje: `El archivo ${repositorio}.json no fue encontrado.` } );
    }

};



async function postUltimaPagina(req, res)
{ 
    let repositorio = req.params.repositorio;

    logURL(`POST`, `/repositorio/${repositorio}/ultimaPagina`);

    if ( fs.existsSync( path.join(__dirname, `../util/Repositorios/${repositorio}.json`) ) )
    {
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
    }
    else 
    {   
        res.status(404).json( { mensaje: `El archivo ${repositorio}.json no fue encontrado.` } );
    }

};



async function postActualizarCatalogo(req, res)
{
    let repositorio = req.params.repositorio;
    
    logURL(`POST`, `/repositorio/${repositorio}/actualizarCatalogo`);

    try
    {
        actualizarEstado(true, repositorio);

        console.log(`Extrayendo datos del repositorio ${repositorio}`);
        let archivoDeExtraccion = require(`../util/modulos de extraccion/${repositorio}.js`);
        await archivoDeExtraccion.extraerInfoRepositorio(); // Llamo al método de extracción dentro del archivo .js
    
        res.status(200).json( { mensaje: "Actualización exitosa" } ); 
    }
    catch(error)
    {
        console.log("ERROR EN EL SERVIDOR: ");
        console.log(error);

        res.status(500).json( { mensaje: error.message });
    }

}


//Solo para el caso especial de Dialnet en el que no podemos hacemos webscrapping o llamado a apis
async function postExcelDialnet(req, res)
{
    // Logging
    console.log('***********************************************************');
    console.log(`Ruta: POST /Dialnet/excelDialnet \n`);

    let nombreExcel = req.file.originalname;
    let rutaDestino = path.join(__dirname, nombreExcel);

    fs.writeFileSync(rutaDestino, req.file.buffer);

    const workBook = xlsx.readFile(path.join(__dirname + `/${nombreExcel}`) ); // xlsx.readFile usa fs.readFileSync
    xlsx.writeFile(workBook, path.join(__dirname + '/Revistas Dialnet.csv'), { bookType: "csv" });      // Paso el contenido en formato .xlsx a otro archivo en formato .csv

    // Modifico la información para quedarme solo con lo que quiero
    let contenido = fs.readFileSync(path.join(__dirname + '/Revistas Dialnet.csv'), 'utf-8');
    let lineas    = contenido.split('\n');  // Separo el contenido del archivo en lineas

    if(lineas[0].includes('CODIGO,')) lineas[0] = lineas[0].replace('CODIGO,', '');
    if(lineas[0].includes('TITULO,')) lineas[0] = lineas[0].replace('TITULO,', 'Título');
    if(lineas[0].includes('PAIS,'))   lineas[0] = lineas[0].replace('PAIS,', ';');
    if(lineas[0].includes('ISSN'))    lineas[0] = lineas[0].replace('ISSN', 'ISSN impresa');
    lineas[0] += ';ISSN en linea;Instituto;URL';

    for(let i = 1; i < lineas.length; i++) // Recorre todas las lineas
    { 
        for(let j = 0; j < lineas[i].length; j++) // Recorre todos los caracteres de una linea
        {
            if(isNaN(lineas[i][j])) // Elimino el campo código
            {
                //lineas[i] = lineas[i].substring(0, j) + ';' + lineas[i].substring(j+1, lineas[i].length);
                lineas[i] = lineas[i].substring(j+1, lineas[i].length) + ";;;" + "https://dialnet.unirioja.es/servlet/revista?codigo=" + lineas[i].substring(0, j);
                break;
            } 
        }

        if(lineas[i].includes(',ARG-Argentina,')) lineas[i] = lineas[i].replace(',ARG-Argentina,', ';'); // Elimino el campo país
    }


    // Con todos los datos en string, escribo la info en formato .csv y después uso el modulo csvtojson para crear el archivo .json
    let info = '';
    for(let i = 0; i < lineas.length; i++) 
    {
        if(!lineas[i].includes(';;;;') ) info += `${lineas[i]}\n`; // Algunas revistas no tienen ISSN, así que elimino dichas revistas
    }

    const csvFilePath  = path.join(__dirname + '/../util/Repositorios/Dialnet.csv')
    const jsonFilePath = path.join(__dirname + '/../util/Repositorios/Dialnet.json');

    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
    
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

    fs.writeFileSync(csvFilePath, info);
    fs.unlinkSync(path.join(__dirname + '/Revistas Dialnet.csv') ); // Elimino el archivo para que no ocupe espacio
    fs.unlinkSync(path.join(__dirname + `/${nombreExcel}`) );       // También elimino el archivo subido de Dialnet para evitar un garron legal

    console.log("Termina la extracción de datos de Dialnet");

    res.send(`
    <script>
        window.location.href = "/repositorio/Dialnet";
    </script>`); 
}


module.exports = { 
    getRepositorio, 
    getDescargarCSV, 
    getDescargarJSON,
    postSiguientePagina,
    postAnteriorPagina,
    postBuscarPaginaEspecifica,
    postPrimerPagina,
    postUltimaPagina,
    postActualizarCatalogo,
    postExcelDialnet,
};