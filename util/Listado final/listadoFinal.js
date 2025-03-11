// Módulos
const fs        = require('fs');        // Módulo para leer y escribir archivos
const csvtojson = require('csvtojson')  // Módulo para pasar texto csv a json
const path      = require('path');      // Módulo para trabajar con paths

// NOTAS IMPORTANTES:
// DIALNET TIENE TODOS LOS ISSN EN ISSN IMPRESOS PORQUE NO HACE DIFERENCIA POR TIPOS DE ISSN
// SCIMAGO CREO QUE EXTRAE LOS ISSN AL REVES PERO NO HAY FORMA DE SABER SI ES UN ISSN ELECTRONICO O IMPRESO
// HAY UN IF QUE QUITE DEL FILTRO. SOLUCIONAR LOS DOS PROBLEMAS ANTERIORES ANTES DE VOLVER A PONERLO

let repositoriosWeb     = ['CAICYT', 'DOAJ', 'Latindex', 'Redalyc', 'Scimago', 'Scielo', 'Web of Science', 'Biblat', 'Dialnet'];
let archivosJSON        = []; // Almaceno los archivo JSON disponibles acá
let archivosEncontrados = {};

// Busco los archivos JSON
repositoriosWeb.forEach(repositorio => {

    try 
    {
      archivosJSON.push( require(path.join(__dirname, `../Repositorios/${repositorio}.json`)) );
      archivosEncontrados[repositorio] = true;
      console.log(`Repositorio web incluido en el listado: ${repositorio}`);
    } 
    catch (error) 
    {
      archivosJSON.push([]); // Para que archivosJSON tenga la misma longitud que repositoriosWeb
      archivosEncontrados[repositorio] = false;
      console.log(`Hay un problema con el archivo del repositorio web ${repositorio}`);
      console.log(error);
    }

});


// Clase para pasar el texto de los archivos JSON a objetos y así poder hacer el ordenamiento
class Revista 
{
    constructor(titulo, issnImpreso, issnEnLinea, instituto) 
    {
        this.titulo = titulo;
        this.issnImpreso = issnImpreso;
        this.issnEnLinea = issnEnLinea;
        this.instituto   = instituto;
        
        // Estos atributos son para saber en que repositorios web se encuentra la revista
        this.CAICYT      = false;
        this.DOAJ        = false;
        this.Latindex    = false;
        this.Redalyc     = false;
        this.Scimago     = false;
        this.Scielo      = false;
        this.WoS         = false;
        this.Biblat      = false;
        this.Dialnet     = false;
    }

    toString() 
    {
        console.log(`Título: ${this.titulo}, ISSN impreso: ${this.issnImpreso}, ISSN en línea: ${this.issnEnLinea}, Instituto: ${this.instituto}`);
        console.log(`Repositorios: CAICYT: ${this.CAICYT}, DOAJ: ${this.DOAJ}, Latindex: ${this.Latindex}, Redalyc: ${this.Redalyc}, Scimago: ${this.Scimago}, Scielo: ${this.Scielo}, WoS: ${this.WoS}, Biblat: ${this.Biblat}, Dialnet: ${this.Dialnet}`);
    }
}


// Actualiza las variables de los atributos en función de los archivos JSON
function actualizarRepositorios(revista, repositorio, archivoJSON) 
{
    archivoJSON.forEach(item => {
        if (item.Título === revista.titulo) {
            revista[repositorio] = true;
        }
    });
}


// Recorro cada revista de la que hayamos extraido información y creo una lista con el título y el ISSN impreso y/o electronico.
// Una revista puede aparecer en distintos repositorios web, por eso se chequea el ISSN para que en la lista solo pueda aparecer una vez cada revista.
async function crearListado() {

    try
    {
        // Creo una lista inicial poniendo todas las revistas de todos los repositorios web en un solo arreglo
        let revistas = archivosJSON.flat().map(revista => {
            return new Revista(revista.Título, revista['ISSN impresa'], revista['ISSN en linea'], revista['Instituto']);
        });

        console.log("***********************************************************");
        console.log("Cantidad de revistas a filtrar: " + revistas.length);

        // Ordeno alfabeticamente las revistas según el título.
        revistas.sort((A, B) => A.titulo.localeCompare(B.titulo));

        let cantidadRevistasRepetidas = 0;

        let revistasUnicas         = new Set(); // Un set es un array pero sin valores repetidos
        let issnElectronicosUnicos = new Set(); 
        let issnImpresosUnicos     = new Set();
        let infoRevistasEliminadas = "";

        revistas.forEach(revista => {

            if (revista.issnEnLinea !== revista.issnImpreso &&                 // Elimino todas las revistas que tengan lo mismo tanto en el ISSN en linea como en el ISSN impreso, ejemplo: https://www.latindex.org/latindex/Solr/Busqueda?idModBus=0&buscar=Visi%C3%B3n+de+futuro&submit=Buscar
                !(revista.issnEnLinea === '' && revista.issnImpreso === '') && // Elimino todas las revistas que tienen ambos ISSN vacios
                (revista.issnEnLinea === '' || !issnElectronicosUnicos.has(revista.issnEnLinea)) &&  // Elimino las revistas con el mismo ISSN electronico (dicho ISSN no debe ser '')
                (revista.issnImpreso === '' || !issnImpresosUnicos.has(revista.issnImpreso))         // Elimino las revistas con el mismo ISSN impreso (dicho ISSN no debe ser '')
                //!issnElectronicosUnicos.has(revista.issnImpreso) &&            // Elimino las revistas que tengan el ISSN en linea repetido pero en el campo de ISSN impreso
                //!issnImpresosUnicos.has(revista.issnEnLinea)                   // Elimino las revistas que tengan el ISSN impreso repetido pero en el campo de ISSN en linea
                )
            {
                revistasUnicas.add(revista);
                issnElectronicosUnicos.add(revista.issnEnLinea); // Añado el ISSN a un set para asegurarme con el if de que no haya un ISSN repetido
                issnImpresosUnicos.add(revista.issnImpreso);

                //console.log(`Revista añadida: ${revista.titulo}, \nISSN impreso: ${revista.issnImpreso}, \nISSN en línea: ${revista.issnEnLinea}, \nInstituto: ${revista.instituto}\n`)
            
                // Actualiza las variables de los atributos en función de los archivos JSON
                repositoriosWeb.forEach((repositorio, index) => {
                    if (archivosEncontrados[repositorio]) {
                        actualizarRepositorios(revista, repositorio, archivosJSON[index]);
                    }
                });
            
            }
            else
            {
                cantidadRevistasRepetidas++;

                let razonEliminacion = "";

                if (revista.issnEnLinea === revista.issnImpreso)                   razonEliminacion = "ISSN impreso y en línea son iguales";
                else if (revista.issnEnLinea === '' && revista.issnImpreso === '') razonEliminacion = "ISSN impreso y en línea están vacíos";
                else if (revista.issnEnLinea !== '' && issnElectronicosUnicos.has(revista.issnEnLinea)) razonEliminacion = "ISSN en línea repetido";
                else if (revista.issnImpreso !== '' && issnImpresosUnicos.has(revista.issnImpreso))     razonEliminacion = "ISSN impreso repetido";
                //else if (issnElectronicosUnicos.has(revista.issnImpreso))          razonEliminacion = "ISSN en línea repetido en el campo de ISSN impreso";
                //else if (issnImpresosUnicos.has(revista.issnEnLinea))              razonEliminacion = "ISSN impreso repetido en el campo de ISSN en línea";
                
                //console.log(`Revista eliminada: ${revista.titulo}, \nISSN impreso: ${revista.issnImpreso}, \nISSN en línea: ${revista.issnEnLinea}, \nInstituto: ${revista.instituto}`);
                //console.log(`Motivo de eliminación: ${razonEliminacion}\n`);

                infoRevistasEliminadas += `Revista eliminada: ${revista.titulo}, \nISSN impreso: ${revista.issnImpreso}, \nISSN en línea: ${revista.issnEnLinea}, \nInstituto: ${revista.instituto}\n`;
                infoRevistasEliminadas += `Motivo de eliminación: ${razonEliminacion}\n\n`;
            }

        });

        fs.writeFile(path.join(__dirname, "revistasAñadidas.json"), JSON.stringify(Array.from(revistasUnicas)), (err) => {
            if (err) console.error('Error al escribir el archivo:', err);
            else     console.log('Archivo escrito exitosamente');
        });

        fs.writeFile(path.join(__dirname, "revistasEliminadas.txt"), infoRevistasEliminadas, (err) => {
            if (err) console.error('Error al escribir el archivo:', err);
            else     console.log('Archivo escrito exitosamente');
        });


        // Agrego los URLs de las revistas (creo nuevas propiedades que no estaban en el constructor ya que este esta hecho para que funcione con todos los archivos .json)
        // NOTA: SI ALGUNO TIRA COMO RESULTADO UNDEFINED ES PORQUE TODAVÍA NO SE EXTRAE EL CAMPO URL DE DICHO repositorio WEB
        revistasUnicas.forEach(revista => {
            revista.URL_CAICYT   = revista.CAICYT   ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "CAICYT") : "";
            revista.URL_DOAJ     = revista.DOAJ     ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "DOAJ") : "";
            revista.URL_Latindex = revista.Latindex ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Latindex") : "";
            revista.URL_Redalyc  = revista.Redalyc  ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Redalyc") : "";
            revista.URL_Scimago  = revista.Scimago  ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Scimago") : "";
            revista.URL_Scielo   = revista.Scielo   ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Scielo") : "";
            revista.URL_WoS      = revista.WoS      ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Web of Science") : "";
            revista.URL_Biblat   = revista.Biblat   ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Biblat") : "";
            revista.URL_Dialnet  = revista.Dialnet  ? buscarURL(revista.issnEnLinea, revista.issnImpreso, "Dialnet") : "";
        });


        console.log("***********************************************************");
        console.log("Cantidad de revistas repetidas y eliminadas por el filtro: " + cantidadRevistasRepetidas);
        console.log("Cantidad de revistas en el listado final: " + revistasUnicas.size);


        // Armo el listado
        // Encabezado
        var info = "Título;ISSN impresa;ISSN en linea;Instituto/Editorial;CAICYT;URL_CAICYT;DOAJ;URL_DOAJ;Latindex;URL_Latindex;Redalyc;URL_Redalyc;Scimago;URL_Scimago;Scielo;URL_Scielo;WoS;URL_WoS;Biblat;URL_Biblat;Dialnet;URL_Dialnet\n";

        // Cuerpo
        revistasUnicas.forEach(revista => {
            // Los datos de la revista: Titulo, ISSN impreso, ISSN en línea, Instituto
            info += `${revista.titulo};${revista.issnImpreso};${revista.issnEnLinea};${revista.instituto}`;
            
            info += `;${revista.CAICYT};${revista.URL_CAICYT}`;
            info += `;${revista.DOAJ};${revista.URL_DOAJ}`;
            info += `;${revista.Latindex};${revista.URL_Latindex}`;
            info += `;${revista.Redalyc};${revista.URL_Redalyc}`;
            info += `;${revista.Scimago};${revista.URL_Scimago}`;
            info += `;${revista.Scielo};${revista.URL_Scielo}`;
            info += `;${revista.WoS};${revista.URL_WoS}`;
            info += `;${revista.Biblat};${revista.URL_Biblat}`;
            info += `;${revista.Dialnet};${revista.URL_Dialnet}`;
            
            info += "\n";
        });        

        
        const csvFilePath  = path.join(__dirname, 'Listado final.csv');
        const jsonFilePath = path.join(__dirname, 'Listado final.json');
        
        await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    
        const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
    
        await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON
        
    }
    catch(error)
    {
        console.log(error);
    }

}

function buscarURL(issnEnLinea, issnImpreso, nombreArchivoJSON)
{
    let URL = "";
    let archivoJSON = require(path.join(__dirname, `../Repositorios/${nombreArchivoJSON}.json`))

    for(let i = 0; i < archivoJSON.length; i++)
    {
        //console.log(archivoJSON[i].issnEnLinea + "; ISSN en linea: " +  issnEnLinea);
        //console.log(archivoJSON[i].issnImpreso + "; ISSN impreso: " + issnImpreso);
        if(archivoJSON[i]['ISSN en linea'] == issnEnLinea || archivoJSON[i]['ISSN impresa'] == issnImpreso)
        {
            URL = archivoJSON[i].URL; 
            i = archivoJSON.length;
        }
    }

    return URL;
}

exports.crearListado = crearListado;