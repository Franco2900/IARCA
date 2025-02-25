// Modulos
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');     // Módulo para escribir, leer, borrar y renombrar archivos


// Redirige a la página de login si el usuario no está logueado 
function autentificar(req, res, next) 
{
    if (req.session && req.session.nombre) return next();
    else                                   res.redirect('/login');   
}


// Genera un nombre con la fecha y hora actuales
function obtenerNombreNuevoArchivo(nombreOriginal)
{
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = ('0' + (fecha.getMonth() + 1)).slice(-2);
    const dia = ('0' + fecha.getDate()).slice(-2);
    const horas = ('0' + fecha.getHours()).slice(-2);
    const minutos = ('0' + fecha.getMinutes()).slice(-2);
    const segundos = ('0' + fecha.getSeconds()).slice(-2);

    return `${año}${mes}${dia}_${horas}${minutos}${segundos}_${nombreOriginal}`; 
};


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


// Crea un arreglo de objetos con la información de las revistas
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
        </thead>`

    if(numeroPagina > 1) numeroPagina = (numeroPagina * 20) - 19;

    for(let i = 0; i < arregloRevistas.length; i++){

        let tituloRevista;
        if(typeof(arregloRevistas[i].url) !== 'undefined') tituloRevista = `<td><a href="${arregloRevistas[i].url}" target="_blank">${arregloRevistas[i].tituloRevista}</a></td>`;
        else                                               tituloRevista = `<td>${arregloRevistas[i].tituloRevista}</td>`;

        tabla += `<tr>
                    <td class="text-center">${numeroPagina}</td>
                    ${tituloRevista}
                    <td class="text-center">${arregloRevistas[i].issnImpreso}</td>
                    <td class="text-center">${arregloRevistas[i].issnEnLinea}</td>
                    <td>${arregloRevistas[i].instituto}</td>
                 </tr>`
        
        numeroPagina++;
    }

    tabla += `</table>`

    return tabla;
}



function calcularTiempoPromedio(repositorio)
{
    let tiempoPromedio = 0;

    fs.readFile(path.join(__dirname, `../util/Tiempos/${repositorio}Tiempo.txt`), (error, datos) => { 
        if(error) console.log(error)
        else 
        {
            let tiempos = datos.toString().split(';'); // Separo los tiempos
            

            for(let i = 0; i < tiempos.length; i++)
            {
                if(i == tiempos.length-1) tiempos.splice(i, 1); // La última posición siempre esta vacia
                else
                {
                    tiempos[i] = parseInt(tiempos[i]);
                    tiempoPromedio += tiempos[i];
                }
            }

            tiempoPromedio = Math.ceil(tiempoPromedio / tiempos.length);

            // Escribo en un archivo json el resultado final
            fs.writeFile(path.join(__dirname, `../util/Tiempos/${repositorio}TiempoPromedio.json`), `[{"TiempoPromedio":${tiempoPromedio}}]`, error => 
            { 
                if(error) console.log(error);
            })
        }
    });

}


module.exports = { 
    autentificar,
    obtenerNombreNuevoArchivo,
    crearListadoDeRevistas,
    armarTablaDeRevistas,
    calcularTiempoPromedio,
};