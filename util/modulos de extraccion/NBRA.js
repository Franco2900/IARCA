// Módulos
const { request } = require('undici');
const cheerio   = require('cheerio');   // Módulo para web scrapping como puppeteer pero enfocado a la velocidad (solo sirve para sitios estaticos)
const fs        = require('fs');        // Módulo para leer y escribir archivos
const csvtojson = require('csvtojson'); // Módulo para pasar texto csv a json
const path      = require('path');      // Módulo para trabajar con rutas

// Metodos importados
const { calcularTiempoActualizacion } = require('../utilActualizacion.js');
const { actualizarEstado } = require('../../models/estadoActualizacionModel.js');

// Busco los enlaces de todas las revistas
async function buscarEnlacesARevistas() 
{
  try 
  {
    const url = 'https://www.caicyt-conicet.gov.ar/sitio/comunicacion-cientifica/nucleo-basico/revistas-integrantes/';
    const { body } = await request(url); // Hago la solicitud
    const html = await body.text();      // Obtengo el HTML del sitio web
    const $ = cheerio.load(html);        // Cargo el HTML en cheerio

    var enlaces = []; // Arreglo con los enlaces href a las revistas

    $('._self.cvplbd').each((index, element) => { // Uso jQuery para buscar los elementos HTML que quiero
      const href = $(element).attr('href');       // Obtengo el valor del atributo 'href'
      if (href) enlaces.push(href)                // Si el atributo existe y no es vacio, lo añado al arreglo
    });

  } 
  catch (error) 
  {
    console.error('Error al hacer scraping:', error);
    throw error;
  }

  enlaces = enlaces.map(str => str.replace('http', 'https'));
  return enlaces;
}



// Extraigo la info de una sola revista
async function extraerRevista(enlace) 
{
  var respuesta;

  try 
  {
    const url = enlace;

    const { body } = await request(url); // Hago la solicitud
    const html = await body.text();      // Obtengo el HTML del sitio web
    const $ = cheerio.load(html);        // Cargo el HTML en cheerio

    // Obtengo el titulo
    let titulo = $('.entry-title').text().replaceAll(";", ",").trim();

    // Obtengo los ISSN
    var issnImpresa = "";
    var issnEnLinea = "";
    var auxISSN = ""; // CASO EXCEPCIONAL: Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles
    // Algunas revistas solo tienen ISSN en linea, mientras que otras tienen ISSN en linea e impresa
        
    // Extraer los elementos <p>, <strong> y <p> dentro de <strong>
    const etiquetasP        = $(".siteorigin-widget-tinymce.textwidget").first().find("p");
    const etiquetasStrong   = $(".siteorigin-widget-tinymce.textwidget").first().find("strong");
    const etiquetasPyStrong = $(".siteorigin-widget-tinymce.textwidget").first().find("p strong");

    // Caso expecional. El ISSN no esta marcado con la etiqueta Strong. Todos los ISSN son identificados con la etiqueta Strong
    if (typeof (etiquetasP.first()) != "undefined" && etiquetasP.length == 2) 
    {
      issnEnLinea = etiquetasP.first().text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll(" (En línea)", "");
    }


    // Si no tiene etiquetas <p> y la revista solo tiene ISSN en linea
    if (etiquetasP.length === 0 && etiquetasStrong.length == 2) 
    {
      issnEnLinea = etiquetasStrong.first().text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
    }
    // Si no tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
    if (etiquetasP.length === 0 && etiquetasStrong.length > 2) 
    {
      issnImpresa = etiquetasStrong.first().text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(Impresa)");
      issnEnLinea = etiquetasStrong.eq(1).text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
    }

    // Si tiene etiquetas <p> y la revista solo tiene ISSN en linea
    if (typeof (etiquetasP.first()) != "undefined" && etiquetasPyStrong.length == 2) 
    {
      issnEnLinea = etiquetasPyStrong.first().text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
    }
    // Si tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
    if (typeof (etiquetasP.first()) != "undefined" && etiquetasPyStrong.length > 2) 
    {
      issnImpresa = etiquetasPyStrong.first().text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(Impresa)");
      issnEnLinea = etiquetasPyStrong.eq(2).text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");

      // No todas las revistas tienen el ISSN en linea bien escrito
      if (issnEnLinea == "Ver publicación" || issnEnLinea.replace(/(?:\r\n|\r|\n)/g, "") == "" /*Quita los saltos de línea*/ || etiquetasP.first().text().trim().includes("English ed.") /* Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles */) 
      {
        issnEnLinea = etiquetasPyStrong.eq(1).text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }

      // Algunas revistas tienen las etiquetas para el ISSN en linea pero no tienen nada de texto dentro
      if (issnEnLinea == "") 
      {
        issnImpresa = "";
        issnEnLinea = etiquetasPyStrong.first().text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }

      if(etiquetasP.first().text().trim().includes("English ed.") ) auxISSN = etiquetasPyStrong.eq(2).text().trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");  /* Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles */

    }
        
    // Obtengo la imagen    
    const imagen = $(".so-widget-image").attr("src"); // Para chequear a que área corresponde cada revista reviso que imagen tienen en la clase "so-widget-image"
            
    // Mapeo de URL a área
    const areas = {
      "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-BIOLÓGICAS-Y-DE-LA-SALUD-00.jpg":"Ciencias biológicas y de la salud",
      "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-AGRARIAS-INGENIERÍA-Y-MATERIALES-00.jpg":"Ciencias agrarias, ingeniería y materiales",
      "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-EXACTAS-Y-NATURALES-00.jpg":"Ciencias exactas y naturales",
      "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-SOCIALES-Y-HUMANIDADES-00.jpg":"Ciencias sociales y humanidades"
    };

    let area = areas[imagen];
    

    // Obtengo el instituto
    let instituto;
    if ( etiquetasP && etiquetasP.first() ) instituto = $(".siteorigin-widget-tinymce.textwidget").first().text().trim(); // Si no tiene etiquetas <p>
    else                               instituto = etiquetasP.first().text().trim();                               // Si tiene etiquetas <p>
        

    // Pares [buscar, reemplazar]
    const reemplazos = [
      ["English ed.", ""],
      [auxISSN, ""],
      [";", ","],
      [".", ""],
      ["(", ""],
      [")", ""],
      ["ISSN ", ""],
      [issnEnLinea, ""],
      [issnImpresa, ""],
      ["Impresa", ""],
      ["impresa", ""],
      ["lmpresa", ""], // Corrige "impresa" mal escrito
      ["En", ""],
      ["en", ""],
      ["línea", ""],
      ["linea", ""],
      ["Ver publicación", ""]
    ];

    // Aplica todas las sustituciones
    reemplazos.forEach(([buscar, reemplazo]) => {
      if (buscar !== "") instituto = instituto.replaceAll(buscar, reemplazo);
    });

    // Eliminar saltos de línea y quitar espacios a la izquierda
    instituto = instituto.replace(/(?:\r\n|\r|\n)/g, "").trimStart();

    // Si el string queda vacío (o solo con espacios) se asigna ""
    if (instituto.trim() === "")  instituto = "";

    // Muestro en consola el resultado
    console.log(`***********************************************************************************`);
    console.log(`Título: ${titulo}`);
    console.log(`ISSN impresa: ${issnImpresa}`);
    console.log(`ISSN en linea: ${issnEnLinea}`);
    console.log(`Área: ${area}`);
    console.log(`Instituto: ${instituto}`);
    console.log(`URL: ${enlace}`);
    console.log(`***********************************************************************************`);

    respuesta = `${titulo};${issnImpresa};${issnEnLinea};${area};${instituto};${enlace}` + '\n';    
  }
  catch (error) 
  {
    console.log("HUBO UN ERROR AL EXTRAER LOS DATOS");
    throw error;
  } 

  return respuesta;
}


// Extraigo la info de todas las revistas
async function extraerInfoRepositorio() 
{
  console.log("Comienza la extracción de datos de NBRA");

  try 
  {
    let tiempoEmpieza = Date.now();

    const enlaces = await buscarEnlacesARevistas();
    const cantidadRevistasParaExtraer = enlaces.length;
    console.log(`CANTIDAD DE REVISTAS PARA EXTRAER: ${cantidadRevistasParaExtraer}`);

    let info = "Título;ISSN impresa;ISSN en linea;Área;Instituto;URL\n"; // Cabecera

    let cantidadRevistasExtraidas = 0;
    let cantidadRevistasNoExtraidas = 0;

    // Función auxiliar asincronica para procesar cada enlace
    async function procesarEnlace(enlace, indice, cantidadRevistasParaExtraer) 
    {
      console.log(`EXTRAYENDO DATOS DE LA REVISTA ${indice + 1} DE ${cantidadRevistasParaExtraer}`);

      try 
      {
        const resultado = await extraerRevista(enlace);
        cantidadRevistasExtraidas++;
        return resultado;
      } 
      catch (error) 
      {
        cantidadRevistasNoExtraidas++;
        console.error(error);
        return ""; // Retorna cadena vacía en caso de error
      }

    };

    
    const loteSize = 2; // Procesa en lotes de 2

    for (let i = 0; i < cantidadRevistasParaExtraer; i += loteSize) 
    {
      const lote = enlaces.slice(i, i + loteSize); // Divido el arreglo desde el enlace en que se quedo hasta el tamaño del lote
      
      const resultadosDelLote = await Promise.all( // Mapeamos cada enlace a su tarea (con su índice real). Espera a que termine la extracción de todos los enlaces del lote para seguir con la iteración del for
        lote.map((enlace, index) => procesarEnlace(enlace, i + index, cantidadRevistasParaExtraer))
      );

      info += resultadosDelLote.filter(resultado => resultado && resultado.trim() !== "").join("");
    }

    console.log("CANTIDAD DE REVISTAS EXTRAIDAS CON EXITO:", cantidadRevistasExtraidas);
    console.log("CANTIDAD DE REVISTAS NO EXTRAIDAS:", cantidadRevistasNoExtraidas);

    const csvFilePath  = path.join(__dirname, '../Repositorios/NBRA.csv');
    const jsonFilePath = path.join(__dirname, '../Repositorios/NBRA.json');

    await fs.promises.writeFile(csvFilePath, info); // Escribo el archivo CSV
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

    calcularTiempoActualizacion(tiempoEmpieza, 'NBRA'); // Registro el tiempo que tomo la actualización
    
    console.log("Termina la extracción de datos de NBRA");
  } 
  catch (error) 
  {
    throw new Error('Error durante la extracción de revistas de NBRA: ' + error.message);
  }
  finally
  {
    actualizarEstado(false, 'NBRA'); // Indico en la base de datos que este repositorio ya termino de actualizarse
  }

}

exports.extraerInfoRepositorio = extraerInfoRepositorio;