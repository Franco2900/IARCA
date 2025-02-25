const fs             = require('fs');        // Módulo para leer y escribir archivos
const XMLHttpRequest = require('xhr2');      // Módulo para comunicarse con las APIs
const csvtojson      = require('csvtojson')  // Módulo para pasar texto csv a json
var mysql            = require('mysql')      // Módulo para trabajar con la base de datos MySQL

/*
var conexion = mysql.createConnection({ // Creo una conexión a la base de datos
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'basedepracticasbarc'
})

conexion.connect(function (error) { // Me conecto a la base de datos
    
    if (error) console.log('Problemas de conexion con mysql')
    else 
    {
        console.log('Se inicio conexión');

        // Con la función query introducimos los comandos SQL
        // Siempre que llamamos a query debemos pasarle, además del string con el comando SQL, un segundo parámetro que se trata de una función que se llama en caso de error

        // Si existe la tabla, la borro. Esto lo hago para actualizar los datos correctamente
        conexion.query('DROP TABLE IF EXISTS articulo', (error, resultado) => 
        {
        if (error) console.log(error)
        })
        
        // Creo la tabla si no existe
        conexion.query(  
            `CREATE TABLE IF NOT EXISTS DOAJ 
            (
                ID               INT PRIMARY KEY AUTO_INCREMENT,
                ISSN_impreso     VARCHAR(50),
                ISSN_electronico VARCHAR(50),
                Instituto        VARCHAR(50)
            )`, 
            function (error, resultado) {
            if (error) 
            {
                console.log(error)
                return
            }
            // NOTA: No importa como escribamos las tablas. En MySQL se pasan automaticamente a minusculas (lo mismo pasa con las bases de datos)
        })
    }
})
*/


function extraerInfoRepositorio(paginaActual = 1, revista = 1, info = "Título;ISSN impresa;ISSN en linea;Instituto;Editora;URL\n")
{    
    const API_URL = "https://doaj.org/api/"; // URL a la que vamos a pedir los datos

    const xhttp = new XMLHttpRequest(); // Creo un objeto de la clase XMLHttpRequest para poder hacer el intercambio de datos

    xhttp.open("GET", `${API_URL}/search/journals/Argentina?page=${paginaActual}&pageSize=100`, true); // Crea la solicitud al servidor
    xhttp.send();   // Envía la solicitud al servidor

    // Recibo la respuesta del servidor
    xhttp.onreadystatechange = function() // El atributo onreadystatechange define una función que se invoca cada vez que cambia el atributo readyState
    {      
        // El atributo readyState es el estado de un objeto de la clase XMLHttpRequest, y el atributo status define el estado de una solicitud al servidor
        if (this.readyState == 4 && this.status == 200) // cuando esta condición se cumple, significa que la respuesta del servidor ya se recibió y que no hubo problemas
        { 
            // response es la respuesta del servidor
            const respuestaJSON = JSON.parse(this.response); // Las APIs se suelen comunicar en JSON, así que parseo la respuesta a JSON
        
            // Ya que cada consulta solo puede devolver una página con un máximo de 100 revistas, me fijo cuantas páginas me falta consultar
            var cantidadPaginas = Math.ceil(respuestaJSON.total/respuestaJSON.pageSize);
            var limite          = respuestaJSON.pageSize;

            if(paginaActual == cantidadPaginas) 
            {
                auxCantidadPaginas = cantidadPaginas
                limite = respuestaJSON.total - (respuestaJSON.pageSize * (--auxCantidadPaginas));
            }
            
            console.log(`Comienza la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);
            console.log(`PÁGINA: ${paginaActual}`);
            info = filtro(info, limite, revista, respuestaJSON);
            console.log(`Termina la extracción de datos de la página ${paginaActual} de ${cantidadPaginas}`);

            revista += limite

            // Si no termine de consultar todas las páginas, vuelvo a hacer la consulta pero en la página siguiente y con la info que ya obtuvimos
            if(paginaActual != cantidadPaginas) extraerInfoRepositorio(++paginaActual, revista, info);
            
            if(paginaActual == cantidadPaginas) escribirInfo(info);
        }
    };
    
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


        /*const registro = {
            ISSN_impreso:      pissn,
            ISSN_electronico:  eissn,
            Instituto:         nombreInstituto
        }
        
        // Inserto la nueva revista
        conexion.query('INSERT INTO doaj SET ?', registro, function (error, resultado) {
            if (error) 
            {
              console.log(error)
              return
            }
        })*/

        revista++;
    }

    return info;
}


function escribirInfo(info)
{
    // Escribo la info en el archivo .csv
    fs.writeFileSync('../Repositorios/DOAJ.csv', info, error => 
    { 
        if(error) console.log(error);
    })


    setTimeout(function () { // Lo que esta acá se va a ejecutar después de 5 segundos porque tarda en crearse el archivo .csv. Mientras tanto se ejecuta el código que hay despues de esto

        // Parseo de CSV a JSON
        csvtojson({delimiter: [";"],}).fromFile('../Repositorios/DOAJ.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
        { 
            fs.writeFile('../Repositorios/DOAJ.json', JSON.stringify(json), error => 
            { 
                if(error) console.log(error);
            })
        })
        
        //setTimeout(() => ordenamiento(), 20000); // ANDA PERO LO DEJO COMENTADO PARA QUE VAYA MÁS RÁPIDO

    }, 5000);

    //ESTO ES PARA DEBUGEAR, GUARDA EL JSON CRUDO EN UN TXT ASI LO PONEMOS DESPUES EN JSONVIEWER
    /*fs.writeFile('./Revistas/DOAJ.txt', this.response, error => 
    { 
        if(error) console.log(error);
    })*/
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

function ordenamiento()
{
    var revistas = [];
    var archivoJSON = require('../Revistas/DOAJ.json');
    
     // Paso el texto a objetos para poder hacer el ordenamiento por alfabeto
    for(let i = 0; i < archivoJSON.length; i++){
        revistas.push(new Revista(archivoJSON[i].Título, archivoJSON[i]['ISSN impresa'], archivoJSON[i]['ISSN en linea'], archivoJSON[i]['Instituto'], archivoJSON[i]['Editora']) );
    }

    // Ordeno alfabeticamente las revistas según el título
    for (let i = 1; i < revistas.length; i++) 
    {
        for (let j = 0; j < revistas.length - 1; j++) 
        {
            if (revistas[j].titulo.toLowerCase() > revistas[j + 1].titulo.toLowerCase()) 
            {
                let auxRevista  = new Revista();
                auxRevista      = revistas[j];
                revistas[j]     = revistas[j + 1];
                revistas[j + 1] = auxRevista;
            }
        }
    }

    info = "Título;ISSN impresa;ISSN en linea;Instituto;Editora\n";
    for(let i = 0; i < revistas.length; i++){
        info += `${revistas[i].titulo};${revistas[i].pissn};${revistas[i].eissn};${revistas[i].nombreInstituto};${revistas[i].editora}\n`;
    }

    // Creo otra vez el archivo, pero esta vez con los datos ordenados
    fs.writeFile('./SGE_Arg/Revistas/DOAJ.csv', info, error => { 
        if(error) console.log(error);
    })

    setTimeout(function () 
    {
        csvtojson({delimiter: [";"],}).fromFile('./SGE_Arg/Revistas/DOAJ.csv').then((json) => 
        { 
            fs.writeFile('./SGE_Arg/Revistas/DOAJ.json', JSON.stringify(json), error => 
            { 
                if(error) console.log(error);
            })
        })
    }, 5000);
}


exports.extraerInfoRepositorio = extraerInfoRepositorio;