// Módulos
const fs             = require('fs');        // Módulo para leer y escribir archivos
const csvtojson      = require('csvtojson')  // Módulo para pasar texto csv a json
const path           = require('path');      // Módulo para trabajar con rutas

// Metodos importados
const { calcularTiempoActualizacion } = require('../utilActualizacion.js');
const { actualizarEstado } = require('../../models/estadoActualizacionModel.js');

async function extraerInfoRepositorio(paginaActual = 1, revista = 1, info = "Título;ISSN impresa;ISSN en linea;Instituto;Editora;URL\n") 
{
    const API_URL = "https://doaj.org/api/"; 
    let tiempoEmpieza = Date.now();

    try 
    {
        const response = await fetch(`${API_URL}/search/journals/Argentina?page=${paginaActual}&pageSize=100`);
        const respuestaJSON = await response.json();  // Parseo la respuesta de la API a JSON

        // Ya que cada consulta solo puede devolver una página con un máximo de 100 revistas, me fijo cuantas páginas me falta consultar
        const cantidadPaginas = Math.ceil(respuestaJSON.total / respuestaJSON.pageSize);
        let limite = respuestaJSON.pageSize;

        // Si es la última página, me fijo cuantas revistas quedan en la página
        if(paginaActual == cantidadPaginas) limite = respuestaJSON.total - respuestaJSON.pageSize * (cantidadPaginas - 1)

        console.log(`Comienza la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);
        info = filtro(info, limite, revista, respuestaJSON);
        console.log(`Termina la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);

        revista += limite;

        if (paginaActual < cantidadPaginas) await extraerInfoRepositorio(paginaActual + 1, revista, info);
        else 
        {
            await escribirInfo(info);
            calcularTiempoActualizacion(tiempoEmpieza, 'DOAJ'); // Registro el tiempo que tomo la actualización
        }

    } 
    catch (error)     
    {
        throw new Error('Error durante la extracción de revistas de DOAJ: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
    }
    finally
    {
        actualizarEstado(false, "DOAJ"); // Indico en la base de datos que este repositorio ya termino de actualizarse
    }

}



function filtro(info, limite, revista, respuestaJSON)
{
    // Filtro la info recibida por la API
    for(let i = 0; i < limite; i++)
    {
        var titulo = respuestaJSON.results[i].bibjson.title.trim().replaceAll(";", ",");

        // No todas las revistas tienen todos los datos, así que tengo que verificar si tienen ciertos datos o no
        var eissn; // E-ISSN significa ISSN en linea
        if(typeof(respuestaJSON.results[i].bibjson.eissn) == "undefined") eissn = "";
        else                                                              eissn = respuestaJSON.results[i].bibjson.eissn.trim().replaceAll(";", ",");

        var pissn; // P-ISSN significa ISSN impresa
        if(typeof(respuestaJSON.results[i].bibjson.pissn) == "undefined") pissn = "";
        else                                                              pissn = respuestaJSON.results[i].bibjson.pissn.trim().replaceAll(";", ",");

        var nombreInstituto;
        if     (typeof(respuestaJSON.results[i].bibjson.institution)      == "undefined") nombreInstituto = "";
        else if(typeof(respuestaJSON.results[i].bibjson.institution.name) == "undefined") nombreInstituto = "";
        else nombreInstituto = respuestaJSON.results[i].bibjson.institution.name.trim().replaceAll(";", ",");

        var editora;
        if     (typeof(respuestaJSON.results[i].bibjson.publisher)      == "undefined") editora = "";
        else if(typeof(respuestaJSON.results[i].bibjson.publisher.name) == "undefined") editora = "";
        else                                                                            editora = respuestaJSON.results[i].bibjson.publisher.name.trim().replaceAll(";", ",");

        let urlRevista;
        if(eissn != "") urlRevista = "https://doaj.org/toc/" + eissn;
        else            urlRevista = "https://doaj.org/toc/" + pissn;

        info += `${titulo};${pissn};${eissn};${nombreInstituto};${editora};${urlRevista}\n`;

        // Muestro en consola la info de la revista
        console.log(`***********************************************************************************`);
        console.log(`Revista: ${revista}`)
        console.log(`***********************************************************************************`);
        console.log(`Titulo: ${titulo}`);
        console.log(`ISSN impresa: ${pissn}`);
        console.log(`ISSN en linea: ${eissn}`);
        console.log(`Instituto: ${nombreInstituto}`);
        console.log(`Editora: ${editora}`);
        console.log(`URL: ${urlRevista}`);
        console.log(`***********************************************************************************`);

        revista++;
    }

    return info;
}


async function escribirInfo(info)
{
    console.log("Escribiendo archivos");

    const csvFilePath  = path.join(__dirname, '../Repositorios/DOAJ.csv')
    const jsonFilePath = path.join(__dirname, '../Repositorios/DOAJ.json');

    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
    json.sort((A, B) => A.Título.localeCompare(B.Título)); // Ordena alfabeticamente las revistas según el título
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

    console.log("Termina la extracción de datos de DOAJ");
}



class Revista {

    constructor(titulo, pissn, eissn, nombreInstituto, editora) {
        this.titulo   = titulo;
        this.pissn    = pissn;
        this.eissn    = eissn;
        this.nombreInstituto = nombreInstituto;
        this.editora  = editora;
    }

}
    

exports.extraerInfoRepositorio = extraerInfoRepositorio;