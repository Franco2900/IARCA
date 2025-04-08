// Módulos
const fs        = require('fs');        // Módulo para leer y escribir archivos
const csvtojson = require('csvtojson')  // Módulo para pasar texto csv a json
const path      = require('path');      // Módulo para trabajar con paths

// NOTAS IMPORTANTES:
// DIALNET TIENE TODOS LOS ISSN EN ISSN IMPRESOS PORQUE NO HACE DIFERENCIA POR TIPOS DE ISSN
// SCIMAGO CREO QUE EXTRAE LOS ISSN AL REVES PERO NO HAY FORMA DE SABER SI ES UN ISSN ELECTRONICO O IMPRESO

let repositoriosWeb     = ['NBRA', 'DOAJ', 'Latindex', 'Redalyc', 'Scimago', 'Scielo', 'Web of Science', 'Biblat', 'Dialnet'];
let archivosJSON        = []; // Almaceno los archivo JSON disponibles acá
let archivosEncontrados = {};

// Busco los archivos JSON
repositoriosWeb.forEach(repositorio => {

    try 
    {
      archivosJSON.push( require(path.join(__dirname, `../Repositorios/${repositorio}.json`)) );
      archivosEncontrados[repositorio] = true; // EJ: archivosEncontrados['NBRA'] = true significa que el archivo json de NBRA esta disponible
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
    constructor(titulo, issnImpreso, issnEnLinea, instituto, url) 
    {
        this.titulo = titulo;
        this.issnImpreso = issnImpreso;
        this.issnEnLinea = issnEnLinea;
        this.instituto   = instituto;
        this.url = url;
    }

    /*toString() 
    {
        console.log(`Título: ${this.titulo}, ISSN impreso: ${this.issnImpreso}, ISSN en línea: ${this.issnEnLinea}, Instituto: ${this.instituto}, URL: ${this.url}`);
    }*/
}



// Recorro cada revista de la que hayamos extraido información y creo una lista con el título y el ISSN impreso y/o electronico.
// Una revista puede aparecer en distintos repositorios web, por eso se chequea el ISSN para que en la listado final solo pueda aparecer una vez cada revista.
async function crearListado() {

    try
    {
        // Creo una lista inicial poniendo todas las revistas de todos los repositorios web en un solo arreglo
        let revistas = archivosJSON.flat().map(revista => {
            return new Revista(revista.Título, revista['ISSN impresa'], revista['ISSN en linea'], revista['Instituto'], revista['URL']);
        });
        

        console.log("***********************************************************");
        console.log("Cantidad de revistas a filtrar: " + revistas.length);

        // Ordeno alfabeticamente las revistas según el título.
        revistas.sort((A, B) => A.titulo.localeCompare(B.titulo));

        // Recorro todas las revistas y aplico distintos filtros para que al final solo me quede una lista en la que cada revista tiene un ISSN único
        let cantidadRevistasRepetidas = 0;

        let revistasUnicas = new Set(); // Un set es un array pero sin valores repetidos
        let issnUnicos     = new Set();

        revistas.forEach(revista => {

            if 
            (
                revista.issnEnLinea !== revista.issnImpreso                  // Elimino todas las revistas que tengan lo mismo tanto en el ISSN en linea como en el ISSN impreso, ejemplo: https://www.latindex.org/latindex/Solr/Busqueda?idModBus=0&buscar=Visi%C3%B3n+de+futuro&submit=Buscar
                &&
                !(revista.issnEnLinea === '' && revista.issnImpreso === '')  // Elimino todas las revistas que tienen ambos ISSN vacios'')
                &&
                (
                    (revista.issnEnLinea !== '' && !issnUnicos.has(revista.issnEnLinea)  && !issnUnicos.has(revista.issnImpreso) )  // Elimino las revistas con el mismo ISSN electronico (dicho ISSN no debe ser '')
                    || 
                    (revista.issnImpreso  !== '' && !issnUnicos.has(revista.issnImpreso) && !issnUnicos.has(revista.issnEnLinea) ) // Elimino las revistas con el mismo ISSN impreso (dicho ISSN no debe ser '')
                )
            )
            {
                revistasUnicas.add(revista);

                if(revista.issnEnLinea !== '') issnUnicos.add(revista.issnEnLinea);
                if(revista.issnImpreso !== '') issnUnicos.add(revista.issnImpreso);
            }
            else
            {
                cantidadRevistasRepetidas++;
            }

        });


        // Una vez que me queda el listado final en el que cada revista tiene un ISSN único, lleno el listado con datos nuevos
        // En esta ocasión añado nuevos atributos: NBRA, DOAJ, Redalyc, etc. los cuales me sirven para saber si una revista se encuentra en dicho repositorio
        // Al mismo tiempo obtengo las URLs que llevan a dichos repositorios

        repositoriosWeb.forEach((repositorioNombre) =>{ // Recorro todos los repositorios
            
            revistasUnicas.forEach(revistaUnica => { // Para cada repositorio, recorro todas las revistas del listado filtrado

                let archivoJSON = require(path.join(__dirname, `../Repositorios/${repositorioNombre}.json`)); // Busco el archivo .json correspondiente al repositorio actualmente recorrido

                // Valores por defecto
                revistaUnica[repositorioNombre] = false;
                revistaUnica['URL_' + repositorioNombre] = null;

                for(let i = 0; i < archivoJSON.length; i++) // Me fijo si la revista esta en el archivo .json del repositorio
                {
                    if // Me fijo si el titulo, el ISSN o el eISSN de la revista estan en el archivo .json
                    (
                        (archivoJSON[i]['Título'] == revistaUnica.titulo) || 
                        (revistaUnica.issnEnLinea && revistaUnica.issnEnLinea !== "" && archivoJSON[i]['ISSN en linea'] == revistaUnica.issnEnLinea) || 
                        (revistaUnica.issnImpreso && revistaUnica.issnImpreso !== "" && archivoJSON[i]['ISSN impresa']  == revistaUnica.issnImpreso)
                    )
                    { // Si la revista esta esta en el archivo

                        revistaUnica[repositorioNombre] = true; // Añado la bandera correspondiente que indica que la revista pertenece a dicho repositorio

                        // Me fijo si el archivo .json tiene el campo de URL (puede no tenerlo como en el caso de WoS)
                        if(archivoJSON[i].URL && archivoJSON[i].URL !== "") revistaUnica['URL_' + repositorioNombre] = archivoJSON[i].URL;
                        else                                                revistaUnica['URL_' + repositorioNombre] = null;

                        // Si la revista tiene el campo de instituto vacio, me fijo si el archivo .json lo tiene
                        if( (!revistaUnica.instituto || revistaUnica.instituto == "") && archivoJSON[i]['Instituto'] ) revistaUnica.instituto =  archivoJSON[i]['Instituto'];

                        break; // Termino el proceso antes para hacerlo más rapido
                    }

                }

            });

        })


        // TESTEO
        repositoriosWeb.forEach((repositorioNombre) =>{
            
            revistasUnicas.forEach(revistaUnica => { 

                let archivoJSON = require(path.join(__dirname, `../Repositorios/${repositorioNombre}.json`));
            
                for(let i = 0; i < archivoJSON.length; i++)
                {
                    if
                    (
                        (archivoJSON[i]['Título'] == revistaUnica.titulo) || 
                        (revistaUnica.issnEnLinea && revistaUnica.issnEnLinea !== "" && archivoJSON[i]['ISSN en linea'] == revistaUnica.issnEnLinea) || 
                        (revistaUnica.issnImpreso && revistaUnica.issnImpreso !== "" && archivoJSON[i]['ISSN impresa']  == revistaUnica.issnImpreso)
                    )
                    {
                        if( (!revistaUnica.issnEnLinea || revistaUnica.issnEnLinea == "") && archivoJSON[i]['ISSN en linea'] ) revistaUnica.issnEnLinea = archivoJSON[i]['ISSN en linea'];
                        if( (!revistaUnica.issnImpreso || revistaUnica.issnImpreso == "") && archivoJSON[i]['ISSN impresa'] )  revistaUnica.issnImpreso = archivoJSON[i]['ISSN impresa'];
                        
                        break;
                    }
                }
            });

        })

        revistasUnicas = Array.from(revistasUnicas);
        for(let i = 0; i < revistasUnicas.length - 1; i++)  { // Recorro todas las revistas

            if // Si tengo un par ISSN-eISSN repetido
            (
                revistasUnicas[i].issnEnLinea == revistasUnicas[i+1].issnEnLinea &&
                revistasUnicas[i].issnImpreso == revistasUnicas[i+1].issnImpreso
            )
            {
                // Creo una nueva revista donde voy a combinar todos los datos y borrar el par repetido
                let nuevaRevista = new Revista(revistasUnicas[i].titulo, revistasUnicas[i].issnImpreso, revistasUnicas[i].issnEnLinea, revistasUnicas[i].instituto);
                
                repositoriosWeb.forEach((repositorioNombre) =>{
                    
                    
                    if ( revistasUnicas[i][repositorioNombre] )                   nuevaRevista[repositorioNombre]          = true;
                    if ( revistasUnicas[i]['URL_' + repositorioNombre] !== null ) nuevaRevista['URL_' + repositorioNombre] = revistasUnicas[i]['URL_' + repositorioNombre];
                
                    if ( revistasUnicas[i+1][repositorioNombre] )                   nuevaRevista[repositorioNombre]          = true;
                    if ( revistasUnicas[i+1]['URL_' + repositorioNombre] !== null ) nuevaRevista['URL_' + repositorioNombre] = revistasUnicas[i+1]['URL_' + repositorioNombre];

                })

                console.log(nuevaRevista);

                revistasUnicas.push(nuevaRevista);
                revistasUnicas.splice(i, 2);
                i = i - 2;
            }
            
        }

        // Ordeno alfabeticamente las revistas según el título.
        revistasUnicas.sort((A, B) => A.titulo.localeCompare(B.titulo));

        console.log("***********************************************************");
        console.log("Cantidad de revistas repetidas y eliminadas por el filtro: " + cantidadRevistasRepetidas);
        console.log("Cantidad de revistas en el listado final: " + revistasUnicas.size);


        // Armo el listado
        // Encabezado
        var info = "Título;ISSN impresa;ISSN en linea;Instituto/Editorial;NBRA;URL_NBRA;DOAJ;URL_DOAJ;Latindex;URL_Latindex;Redalyc;URL_Redalyc;Scimago;URL_Scimago;Scielo;URL_Scielo;WoS;URL_WoS;Biblat;URL_Biblat;Dialnet;URL_Dialnet\n";

        // Cuerpo
        revistasUnicas.forEach(revista => {
            // Los datos de la revista: Titulo, ISSN impreso, ISSN en línea, Instituto
            info += `${revista.titulo};${revista.issnImpreso};${revista.issnEnLinea};${revista.instituto}`;
            
            info += `;${revista.NBRA};${revista.URL_NBRA}`;
            info += `;${revista.DOAJ};${revista.URL_DOAJ}`;
            info += `;${revista.Latindex};${revista.URL_Latindex}`;
            info += `;${revista.Redalyc};${revista.URL_Redalyc}`;
            info += `;${revista.Scimago};${revista.URL_Scimago}`;
            info += `;${revista.Scielo};${revista.URL_Scielo}`;
            info += `;${revista['Web of Science']};${revista['URL_Web of Science']}`;
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

exports.crearListado = crearListado;