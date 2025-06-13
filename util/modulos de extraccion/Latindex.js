// Variables de entorno
require('dotenv').config(); // Carga las variables del archivo .env en process.envs
const google = process.env.GOOGLE_PATH;

// Módulos
const fs        = require('fs');        // Módulo para leer y escribir archivos
const puppeteer = require('puppeteer'); // Módulo para web scrapping
const csvtojson = require('csvtojson')  // Módulo para pasar texto csv a json
const path      = require('path');      // Módulo para trabajar con los path/rutas (Es un modelo núcleo de Node.js)

// Se utiliza la función de descargar documentos de Latindex, esto es lo más cercano a una API que tiene el sitio web.
async function extraerInfoRepositorio() {

  const browser  = await puppeteer.launch({ // Inicio puppeter
    headless: 'new',
    executablePath: path.join(__dirname, google),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try 
  {
    var page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);    // Indico el tiempo limite para conectarse a un sitio web en milisegundos. Con cero quita el límite de tiempo (no es recomendable poner en 0 porque puede quedar en un bucle infinito en caso de error)
    await page.goto(`https://www.latindex.org/latindex/bAvanzada/resultado?idMod=1&tema=0&subtema=0&region=0&pais=3&critCat=0&send=Buscar&page=1`); // URL del sitio web al que se accede

    await page._client().send('Page.setDownloadBehavior',
    {
      behavior: 'allow',                        // Permito la descarga de archivos
      downloadPath: path.join(__dirname, '../Repositorios'), // Indico donde quiero descargar el archivo. La función resolve() transforma path relativos en path absolutos
    });

    await page.waitForSelector('a.export-links[data-href*="https://www.latindex.org/latindex/exportar/busquedaAvanzada/json"]'); // Espero a que se cargue el elemento
    await page.click('a.export-links[data-href*="https://www.latindex.org/latindex/exportar/busquedaAvanzada/json"]'); // Indico donde hacer click

    console.log("Solicitando datos a Latindex");
    await page._client().on('Page.downloadProgress', e => {
      if (e.state === 'completed') console.log("Solicitud completa. Procesando información"); // Le indico que si el estado de la descarga es completado, que muestre el mensaje
    });

    const archivoDescargadoPath = path.join(__dirname, '../Repositorios/Busqueda_avanzada.json');

    const archivoDescargado = require(archivoDescargadoPath)

    var info = "Título;ISSN en linea;ISSN impresa;ISSN-L;Instituto;URL" + "\n";
    for (var i = 0; i < archivoDescargado.length; i++) 
    {
      let issnElectronico = "";
      if(archivoDescargado[i].issn_e != null) issnElectronico = archivoDescargado[i].issn_e;

      let issnImpreso = "";
      if(archivoDescargado[i].issn_imp != null) issnImpreso = archivoDescargado[i].issn_imp;

      let editorial = "";
      if(archivoDescargado[i].nombre_edi != null) editorial = archivoDescargado[i].nombre_edi.replaceAll(";", ",");

      let url = "";
      if(archivoDescargado[i].folio_u != null) url = `https://www.latindex.org/latindex/ficha/${archivoDescargado[i].folio_u}`;

      info += `${archivoDescargado[i].tit_propio};${issnElectronico};${issnImpreso};${archivoDescargado[i].issn_l};${editorial};${url}` + `\n`;
    }

    const csvFilePath  = path.join(__dirname + '/../Repositorios/Latindex.csv');
    const jsonFilePath = path.join(__dirname + '/../Repositorios/Latindex.json');

    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada

    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
    
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

    // Elimino el archivo que descargue de Latindex
    if (fs.existsSync(archivoDescargadoPath) ) 
    {
      fs.unlink(archivoDescargadoPath, (error) => {
        if (error) return console.log(error);
      });
    }

    console.log("Termina la extracción de datos de Latindex");
  }
  catch(error)
  {
    throw new Error('Error durante la extracción de revistas de Latindex: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
  }

}

exports.extraerInfoRepositorio = extraerInfoRepositorio;
