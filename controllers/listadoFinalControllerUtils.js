// ACÁ HAY FUNCIONES QUE SOLO UTILIZA EL ARCHIVO listadoFinalController.js

// Clase para pasar el texto de los archivos JSON a objetos
class Revista {
    
    constructor
    (
        tituloRevista, issnImpreso, issnEnLinea, instituto, 
        nbra,     url_nbra,
        doaj,     url_doaj,
        latindex, url_latindex,
        redalyc,  url_redalyc,
        scimago,  url_scimago,
        scielo,   url_scielo,
        wos,      url_wos,
        biblat,   url_biblat,
        dialnet,  url_dialnet,
    ) 
    {
        this.tituloRevista = tituloRevista;
        this.issnImpreso   = issnImpreso;
        this.issnEnLinea   = issnEnLinea;
        this.instituto     = instituto;

        this.nbra          = nbra;     this.url_nbra      = url_nbra;
        this.doaj          = doaj;     this.url_doaj      = url_doaj;
        this.latindex      = latindex; this.url_latindex  = url_latindex;
        this.redalyc       = redalyc;  this.url_redalyc   = url_redalyc;
        this.scimago       = scimago;  this.url_scimago   = url_scimago;
        this.scielo        = scielo;   this.url_scielo    = url_scielo;
        this.wos           = wos;      this.url_wos       = url_wos;
        this.biblat        = biblat;   this.url_biblat    = url_biblat;
        this.dialnet       = dialnet;  this.url_dialnet   = url_dialnet;
    }

    /*toString() {
        console.log(`Título: ${this.tituloRevista}, ISSN impreso: ${this.issnImpreso}, ISSN en linea: ${this.issnEnLinea}, Instituto: ${this.instituto}, URL: ${this.url}`);
    }*/
}



// Crea un arreglo de objetos con la información de las revistas
function crearListadoDeRevistas( archivoJSON ){

    var revistas = [];

    try
    {
        for (var i = 0; i < archivoJSON.length; i++)
        {
            if (archivoJSON[i].Título == "HUBO UN ERROR") revistas.push(new Revista("HUBO UN ERROR") );
            else 
            {                                         
                revistas.push( new Revista(
                    archivoJSON[i].Título, 
                    archivoJSON[i]['ISSN impresa'], 
                    archivoJSON[i]['ISSN en linea'], 
                    archivoJSON[i]['Instituto/Editorial'], 

                    archivoJSON[i]['NBRA'],          archivoJSON[i]['URL_NBRA'],
                    archivoJSON[i]['DOAJ'],            archivoJSON[i]['URL_DOAJ'],
                    archivoJSON[i]['Latindex'],        archivoJSON[i]['URL_Latindex'],
                    archivoJSON[i]['Redalyc'],         archivoJSON[i]['URL_Redalyc'],
                    archivoJSON[i]['Scimago'],         archivoJSON[i]['URL_Scimago'],
                    archivoJSON[i]['Scielo'],          archivoJSON[i]['URL_Scielo'],
                    archivoJSON[i]['WoS'],             archivoJSON[i]['URL_WoS'],
                    archivoJSON[i]['Biblat'],          archivoJSON[i]['URL_Biblat'],
                    archivoJSON[i]['Dialnet'],         archivoJSON[i]['URL_Dialnet'],
                ) );
            }
        }
    }
    catch (error) 
    {
        console.error("Error al crear el listado de revistas:", error);
    }

    return revistas;
}



function armarTablaDeRevistas( arregloRevistas, numeroPagina ){

    let tabla = 
    `<table id="tablaRevistas" border="1" class="table table-light table-striped table-bordered">
        <thead>
            <tr>
                <th class="text-center">N° Revista</th>
                <th class="text-center">Titulo</th>
                <th class="text-center">ISSN impreso</th>
                <th class="text-center">ISSN electronico</th>
                <th class="text-center">Instituto/Editorial</th>

                <th class="text-center">NBRA</th>
                <th class="text-center">DOAJ</th>
                <th class="text-center">Latindex</th>
                <th class="text-center">Redalyc</th>
                <th class="text-center">Scimago</th>
                <th class="text-center">Scielo</th>
                <th class="text-center">Web of Science</th>
                <th class="text-center">Biblat</th>
                <th class="text-center">Dialnet</th>

            </tr>
        </thead>
    `
    
    if(numeroPagina > 1) numeroPagina = (numeroPagina * 20) - 19;

    let repositorios = ['nbra', 'doaj', 'latindex', 'redalyc', 'scimago', 'scielo', 'wos', 'biblat', 'dialnet'];

    for(let i = 0; i < arregloRevistas.length; i++)
    {
        tabla += `<tr>
                    <td class="text-center">${numeroPagina}</td>
                    <td>${arregloRevistas[i].tituloRevista}</td>
                    <td class="text-center">${arregloRevistas[i].issnImpreso}</td>
                    <td class="text-center">${arregloRevistas[i].issnEnLinea}</td>
                    <td>${arregloRevistas[i].instituto}</td>`

        repositorios.forEach(repositorio => {

            if( arregloRevistas[i][repositorio] === "true" && arregloRevistas[i][`url_${repositorio}`] !== "null" )
                tabla += `<td class="text-center"><a href="${arregloRevistas[i][`url_${repositorio}`]}" target="_blank"> X </a></td>`;
            
            else if ( arregloRevistas[i][repositorio] === "true" && arregloRevistas[i][`url_${repositorio}`] === "null" )
                tabla += `<td class="text-center"> X </td>`;
            else

                tabla += `<td></td>`;

        })
        
        tabla += `</tr>`
        numeroPagina++;
    }

    tabla += `</table>`

    return tabla;
}


module.exports = { 
    crearListadoDeRevistas,
    armarTablaDeRevistas,
};