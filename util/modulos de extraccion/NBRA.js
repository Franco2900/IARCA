// Módulos
const fs        = require('fs');        // Módulo para leer y escribir archivos
const puppeteer = require('puppeteer'); // Módulo para web scrapping
const jsdom     = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const csvtojson = require('csvtojson'); // Módulo para pasar texto csv a json
const path      = require('path');      // Módulo para trabajar con rutas


// Busco los enlaces de todas las revistas
async function buscarEnlacesARevistas(tiempo) 
{
  var enlaces = [];
  const browser  = await puppeteer.launch({ // Inicio puppeter
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(tiempo);                    // Indico el tiempo limite para conectarse a un sitio web en milisegundos. Con cero quita el límite de tiempo (no es recomendable poner en 0 porque puede quedar en un bucle infinito en caso de error)
  const response = await page.goto(`http://www.caicyt-conicet.gov.ar/sitio/comunicacion-cientifica/nucleo-basico/revistas-integrantes/`); // URL del sitio web al que se le hace web scrapping
  const body = await response.text();                     // Guardo el HTML extraido en esta variable  

  const { window: { document } } = new jsdom.JSDOM(body);     // inicio JSDOM y le paso el HTML extraido

  const filtroHTML = document.getElementsByClassName("_self cvplbd"); // Hago un filtro al HTML extraido

    // DEBUGEO
    /*var titulos = "";
    for(var i = 0; i < filtroHTML.length; i++){
      titulos += filtroHTML[i].textContent.trim() + "\n";
    }

    fs.writeFile('./Revistas/auxCAICYT.csv', titulos, error => {
      if (error) console.log(error);
    })*/
    // DEBUGEO

  for (var i = 0; i < filtroHTML.length; i++) 
  {
    enlaces.push(filtroHTML[i].getAttribute("href"));        // obtengo los enlaces de las revistas
  }

  await browser.close(); // cierro puppeter
  return enlaces;
}


// Extraigo la info de una sola revista
async function extraerRevista(enlace, tiempo) 
{
  var respuesta;
  const browser  = await puppeteer.launch({ // Inicio puppeter
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });


  try 
  {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(tiempo);
    const response = await page.goto(enlace);
    const body = await response.text();
  
    const { window: { document } } = new jsdom.JSDOM(body);

    const titulo = document.getElementsByClassName("entry-title")[0].textContent.trim().replaceAll(";", ",");

    var issnImpresa = "";
    var issnEnLinea = "";
    var auxISSN = ""; // CASO EXCEPCIONAL: Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles
    // Algunas revistas solo tienen ISSN en linea, mientras que otras tienen ISSN en linea e impresa

    // Me fijo si la sección con la información tiene etiquetas <p> y <strong>
    const etiquetasP        = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p");
    const etiquetasStrong   = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("strong");
    const etiquetasPyStrong = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong");

    // Caso expecional. El ISSN no esta marcado con la etiqueta Strong. Todos los ISSN son identificados con la etiqueta Strong
    if (typeof (etiquetasP[0]) != "undefined" && etiquetasP.length == 2) 
    {
      issnEnLinea = etiquetasP[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll(" (En línea)", "");
    }

    // Si no tiene etiquetas <p> y la revista solo tiene ISSN en linea
    if (typeof (etiquetasP[0]) == "undefined" && etiquetasStrong.length == 2) 
    {
      issnEnLinea = etiquetasStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
    }
    // Si no tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
    if (typeof (etiquetasP[0]) == "undefined" && etiquetasStrong.length > 2) 
    {
      issnImpresa = etiquetasStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(Impresa)");
      issnEnLinea = etiquetasStrong[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
    }

    // Si tiene etiquetas <p> y la revista solo tiene ISSN en linea
    if (typeof (etiquetasP[0]) != "undefined" && etiquetasPyStrong.length == 2) 
    {
      issnEnLinea = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
    }
    // Si tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
    if (typeof (etiquetasP[0]) != "undefined" && etiquetasPyStrong.length > 2) 
    {
      issnImpresa = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(Impresa)");
      issnEnLinea = etiquetasPyStrong[2].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");

      // No todas las revistas tienen el ISSN en linea bien escrito
      if (issnEnLinea == "Ver publicación" || issnEnLinea.replace(/(?:\r\n|\r|\n)/g, "") == "" /*Quita los saltos de línea*/ || etiquetasP[0].textContent.trim().includes("English ed.") /* Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles */) 
      {
        issnEnLinea = etiquetasPyStrong[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }

      // Algunas revistas tienen las etiquetas para el ISSN en linea pero no tienen nada de texto dentro
      if (issnEnLinea == "") 
      {
        issnImpresa = "";
        issnEnLinea = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");
      }

      if(etiquetasP[0].textContent.trim().includes("English ed.") ) auxISSN = etiquetasPyStrong[2].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "").replaceAll("(En línea)", "");  /* Una revista tiene tres ISSN, siendo el tercer ISSN la revista en ingles */

    }
      

    var area = "";
    // Para chequear a que área corresponde cada revista reviso que imagen tienen en la clase "so-widget-image"
    const imagen = document.getElementsByClassName("so-widget-image")[0].getAttribute("src");
    switch (imagen) 
    {
      case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-BIOLÓGICAS-Y-DE-LA-SALUD-00.jpg":
        area = "Ciencias biológicas y de la salud";
        break;

      case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-AGRARIAS-INGENIERÍA-Y-MATERIALES-00.jpg":
        area = "Ciencias agrarias, ingeniería y materiales";
        break;

      case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-EXACTAS-Y-NATURALES-00.jpg":
        area = "Ciencias exactas y naturales";
        break;

      case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-SOCIALES-Y-HUMANIDADES-00.jpg":
        area = "Ciencias sociales y humanidades";
        break;

      default:
        area = "No hay area";
        break;
    }

    // Obtener la información de la institución es muy complicado porque todos tienen algo diferente
    // Elimino todo lo que no quiero hasta que solo me quede el nombre de la institución
    var instituto;
    if (typeof (etiquetasP[0]) == "undefined")  // Si no tiene etiquetas <p>
    {
      instituto = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].textContent.trim();
    }
    else // Si tiene etiquetas <p>
    {
      instituto = etiquetasP[0].textContent.trim();
    }

    if (instituto.includes("English ed."))     instituto = instituto.replaceAll("English ed.", ""); // Hay una revista que tiene un tercer ISSN de la versión en ingles. Esta no se cuenta porque no es Argentina
    if (auxISSN != "")                         instituto = instituto.replaceAll(`${auxISSN}`, "");  // Hay una revista que tiene un tercer ISSN de la versión en ingles. Esta no se cuenta porque no es Argentina
    if (instituto.includes(";"))               instituto = instituto.replaceAll(";", ",");
    if (instituto.includes("."))               instituto = instituto.replaceAll(".", "");
    if (instituto.includes("("))               instituto = instituto.replaceAll("(", "");
    if (instituto.includes(")"))               instituto = instituto.replaceAll(")", "");
    if (instituto.includes("ISSN "))           instituto = instituto.replaceAll("ISSN ", "");
    if (instituto.includes(`${issnEnLinea}`))  instituto = instituto.replaceAll(`${issnEnLinea}`, "");
    if (instituto.includes(`${issnImpresa}`))  instituto = instituto.replaceAll(`${issnImpresa}`, "");
    if (instituto.includes("Impresa"))         instituto = instituto.replaceAll("Impresa", "");
    if (instituto.includes("impresa"))         instituto = instituto.replaceAll("impresa", "");
    if (instituto.includes("lmpresa"))         instituto = instituto.replaceAll("lmpresa", ""); // Alguien en una revista puso impresa con l en vez I
    if (instituto.includes("En"))              instituto = instituto.replaceAll("En", "");
    if (instituto.includes("en"))              instituto = instituto.replaceAll("en", "");
    if (instituto.includes("línea"))           instituto = instituto.replaceAll("línea", "");
    if (instituto.includes("linea"))           instituto = instituto.replaceAll("linea", "");
    if (instituto.includes("Ver publicación")) instituto = instituto.replaceAll("Ver publicación", "");
    instituto = instituto.replace(/(?:\r\n|\r|\n)/g, ""); // Quita los saltos de línea
    instituto = instituto.trimStart(); // Quita los espacios en blanco que quedan al principio


    // Chequeo que el string que me quedo no este vacio
    var instituoVacio = true;
    for (var i = 0; i < instituto.length; i++) {
      if (instituto[i] != " ") instituoVacio = false;
    }

    if (instituoVacio) instituto = "";

    // Muestro en consola el resultado
    console.log(`***********************************************************************************`);
    console.log(`Título: ${titulo}`);
    console.log(`ISSN impresa: ${issnImpresa}`);
    console.log(`ISSN en linea: ${issnEnLinea}`);
    console.log(`Área: ${area}`);
    console.log(`Instituto: ${instituto}`);
    console.log(`URL: ${enlace}`)
    console.log(`***********************************************************************************`);

    respuesta = `${titulo};${issnImpresa};${issnEnLinea};${area};${instituto};${enlace}` + '\n';
  }
  catch (error) 
  {
    console.log("HUBO UN ERROR AL EXTRAER LOS DATOS");
    throw error;
  } 
  finally 
  {
    await browser.close();
  }

  return respuesta;
}



// Extraigo la info de todas las revistas
async function extraerInfoRepositorio() 
{
  console.log("Comienza la extracción de datos de CAICYT");

  try
  {
    const enlaces = await buscarEnlacesARevistas(60000);
    console.log(`CANTIDAD DE REVISTAS ${enlaces.length}`);

    var info = "Título;ISSN impresa;ISSN en linea;Área;Instituto;URL" + "\n"; // No usar las tildes inclinadas (` `) acá porque al ser la línea cabecera genera error al crear el archivo csv

    var revistaActual = 0;
    var cantidadRevistasExtraidas = 0;
    var cantidadRevistasNoExtraidas = 0;

    for (var i = 0; i < enlaces.length; i++) // Recorro todos los enlaces y obtengo la info de cada revista una por una
    {
      console.log(`EXTRAYENDO DATOS DE LA REVISTA ${++revistaActual} DE ${enlaces.length}`);
      
      try
      {
        info += await extraerRevista(enlaces[i], 60000);
        cantidadRevistasExtraidas++
      }
      catch(error) // Si falla la extracción de una revista por X motivo, se pasa a extraer la siguiente
      {
        cantidadRevistasNoExtraidas++;
        console.log(error);
      }
    }      

    console.log("CANTIDAD DE REVISTAS EXTRAIDAS CON EXITO: " + cantidadRevistasExtraidas);
    console.log("CANTIDAD DE REVISTAS NO EXTRAIDAS: " + cantidadRevistasNoExtraidas);

    const csvFilePath  = path.join(__dirname, '../Repositorios/NBRA.csv');
    const jsonFilePath = path.join(__dirname, '../Repositorios/NBRA.json');

    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
  
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON
  
    console.log("Termina la extracción de datos de CAICYT");

  }
  catch(error)
  {
    throw new Error('Error durante la extracción de revistas de CAICYT: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
  }

}


exports.extraerInfoRepositorio = extraerInfoRepositorio;