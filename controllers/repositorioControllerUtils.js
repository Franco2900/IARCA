// ACÁ HAY FUNCIONES QUE SOLO UTILIZA EL ARCHIVO repositorioController.js

// Clase para pasar el texto de los archivos JSON a objetos
class Revista {
    
    constructor(tituloRevista, issnImpreso, issnEnLinea, instituto, url) {
        this.tituloRevista = tituloRevista;
        this.issnImpreso   = issnImpreso;
        this.issnEnLinea   = issnEnLinea;
        this.instituto     = instituto;
        this.url           = url;
    }

    toString() {
        console.log(`Título: ${this.tituloRevista}, ISSN impreso: ${this.issnImpreso}, ISSN en linea: ${this.issnEnLinea}, Instituto: ${this.instituto}, URL: ${this.url}`);
    }
}


// Parseo el arreglo JSON a un arreglo de objetos
function crearListadoDeRevistas( archivoJSON ){

    var revistas = [];
    
    for (var i = 0; i < archivoJSON.length; i++)
    {
        if (archivoJSON[i].Título == "HUBO UN ERROR") revistas.push(new Revista("HUBO UN ERROR") );
        else                                          revistas.push(new Revista(archivoJSON[i].Título, archivoJSON[i]['ISSN impresa'], archivoJSON[i]['ISSN en linea'], archivoJSON[i]['Instituto'], archivoJSON[i]['URL']));
    }

    return revistas;
}


// Crea una tabla HTML con el arreglo de revistas pasado, sin importar el tamaño del arreglo
function armarTablaDeRevistas( arregloRevistas, numeroPagina ){

    // Encabezado de la tabla
    let tabla = 
    `<table id="tablaRevistas" border="1" class="table table-light table-striped table-bordered">
        <thead>
            <tr>
                <th class="text-center">N° Revista</th>
                <th class="text-center">Titulo</th>
                <th class="text-center">ISSN impreso</th>
                <th class="text-center">ISSN electronico</th>
                <th class="text-center">Instituto/Editorial</th>
            </tr>
        </thead>`;

    // Calculo desde que número debería empezar a contar el número de la revista, ej: si estoy en la página 1 empieza a contar desde la revista 1 hasta la revista 20, si estoy en la página 2 empieza a contar desde la revista 21 hasta la revista 40
    let numeroRevista = 1;
    if(numeroPagina > 1) numeroRevista = (numeroPagina * 20) - 19;

    // Con el arreglo que recibo, armo el cuerpo de la tabla
    for(let i = 0; i < arregloRevistas.length; i++){

        let tituloRevista;
        if(!arregloRevistas[i].url == 0 ) tituloRevista = `<td><a href="${arregloRevistas[i].url}" target="_blank">${arregloRevistas[i].tituloRevista}</a></td>`;
        else                              tituloRevista = `<td>${arregloRevistas[i].tituloRevista}</td>`;

        tabla += `<tr>
                    <td class="text-center">${numeroRevista}</td>
                    ${tituloRevista}
                    <td class="text-center">${arregloRevistas[i].issnImpreso}</td>
                    <td class="text-center">${arregloRevistas[i].issnEnLinea}</td>
                    <td>${arregloRevistas[i].instituto}</td>
                 </tr>`
        
        numeroRevista++;
    }

    tabla += `</table>` // Fin de la tabla

    return tabla; // Devuelvo la tabla HTML
}


module.exports = { 
    crearListadoDeRevistas,
    armarTablaDeRevistas,
};