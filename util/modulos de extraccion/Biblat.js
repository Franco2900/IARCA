// Módulos
const fs         = require('fs');        // Módulo para leer y escribir archivos
const puppeteer  = require('puppeteer'); // Módulo para web scrapping
const jsdom      = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json
const path       = require('path');      // Módulo para trabajar con rutas

// Variables de entorno
let google = process.env.GOOGLE_PATH;
if ( !path.isAbsolute(google) ) google = path.join(__dirname, google); // Si la ruta de google no es absoluta, entonces es una ruta relativa y le añado lo que le falta (Linux usa una ruta absoluta mientras que Windows usa una ruta relativa)

// Metodos importados
const { calcularTiempoActualizacion } = require('../util.js');
const { actualizarEstado } = require('../../models/estadoActualizacionModel.js');

// Busco cuantas páginas devuelve la consulta a Biblat
async function obtenerPaths() 
{
  try 
  {
    const browser  = await puppeteer.launch({ // Inicio puppeter
      headless: 'new',
      executablePath: google,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }); 
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    await page.goto('https://biblat.unam.mx/es/');

    // Para consultar las revistas de argentina, se debe indicar tal pais en un componente dinamico
    // Espero a que el selector esté presente en la página
    await page.waitForSelector('path.highcharts-point.highcharts-name-argentina.highcharts-key-ar');
    await page.waitForTimeout(2000);
    // Comprobar si el selector está presente
    const selectorExists = await page.evaluate(() => {
      return !!document.querySelector('path.highcharts-point.highcharts-name-argentina.highcharts-key-ar');
    });

    if (!selectorExists) {
      console.log('El selector no está presente en la página.');
      return [];
    }

    await page.click(
      'path.highcharts-point.highcharts-name-argentina.highcharts-key-ar'
    );
    // Espero a que el selector esté presente en la página
    await page.waitForSelector('div.dataTables_scrollBody');
    await page.waitForTimeout(3000);

    //reviso la tabla de revistas argentina y genero los paths
    const hrefs = await page.evaluate(() => {
      const hrefArray = [];
      const rows = document.querySelectorAll('#bodyRevista tr');

      rows.forEach(row => {
        const hrefElement = row.querySelector('td.sorting_1 a');
        if (hrefElement) {
          const href = hrefElement.getAttribute('href');
          hrefArray.push('https://biblat.unam.mx/es/'+href);
        }
      });

      return hrefArray;
    });
    //console.log('PATHs cantidad obtenidos:', hrefs.length);

    await browser.close();

    return hrefs;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Lanza el error para manejarlo en el contexto que llama a esta función
  }
}


// Busco los enlaces de cada revista que devuelva la consulta a Latindex
async function buscarEnlacesARevistas(paths) {
  try {
    //const paths = await obtenerPaths();
    const browser  = await puppeteer.launch({ // Inicio puppeter
      headless: 'new',
      executablePath: google,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }); 
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(7000); // Establece un tiempo de espera predeterminado

    const enlaces = [];

    for (const path of paths) {
      console.log('PATH:', path);
      try {
        await page.goto(path);
        await page.waitForSelector('a.registro.cboxElement', { timeout: 5000 }); // Espera a que aparezca el siguiente enlace
        
        const href = await page.evaluate(() => {
          const aElement = document.querySelector('a.registro.cboxElement');
          return aElement ? aElement.getAttribute('href') : null;
        });

        console.log('Href del siguiente enlace:', href);
        enlaces.push(href);
      } catch (error) {
        console.error('Error en page.goto para el path:', path, error.message);
        // Continúa con el siguiente path si hay un error de tiempo de espera
        //Aqui, deberia almacenar el path para luego reintentar la extraccion
        continue;
      }
    }

    //console.log('ENLACES Cantidad obtenida:', enlaces.length);
    await browser.close();
    return enlaces;
  } catch (error) {
    console.error('Error obteniendo enlaces:', error);
    throw error;
  }
}


// Extraigo la info de una revista
async function extraerInfoRevista(enlaces) 
{
  const browser  = await puppeteer.launch({ // Inicio puppeter
    headless: 'new',
    executablePath: google,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }); 
  const registros = [];

  for (const enlace of enlaces) {
    const page = await browser.newPage();

    try {
      console.log(`Procesando enlace: ${enlace}`);

      const response = await page.goto(enlace); 
      const body     = await response.text();   
            
    const { window: { document } } = new jsdom.JSDOM(body); 
        
    //var filtroHTML  = document.getElementById("rev-linea");
    var filtro2HTML = document.getElementsByClassName("table table-striped ")[0];
    const tabla1    = filtro2HTML.querySelectorAll("tbody tr td");
   var titulo    = null;
   var issn      = null;
   
   for ( i =0; i<tabla1.length;i++){
    //console.log("CONTENIDO: "+tabla1[i].textContent)
     if (tabla1[i].textContent === "Revista:") titulo = tabla1[i+1].textContent ;
     if (tabla1[i].textContent === "ISSN:") issn = tabla1[i+1].textContent ;
    }
    
      //console.log("REGISTROS: "+revista+" "+issn);
      registros.push({ titulo, issn, enlace });
    } catch (error) {
      console.error(`Error al procesar enlace: ${enlace}`);
      console.error(error);
      // Continúa con el siguiente path si hay un error de tiempo de espera
      continue;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return registros;
}

// Extraigo la info de todas las revistas de la consulta
async function extraerInfoRepositorio() 
{
  try
  {
    console.log("Comienza la extracción de datos de Biblat");
    let tiempoEmpieza = Date.now();

    const paths = await obtenerPaths();
    const enlaces = await buscarEnlacesARevistas(paths);
    //const enlaces = ['https://biblat.unam.mx/es/revista/salud-colectiva/articulo/concentracion'];
    const registros = await extraerInfoRevista(enlaces);

    console.log("CANTIDAD DE REVISTAS: " + paths.length);
    console.log("REVISTAS CONSULTADAS: " + enlaces.length);
    console.log("REGISTROS OBTENIDOS: " + registros.length);


    // Paso los datos de los objetos a string
    let cantidadRevistasSinISSN = 0;
    let info = "Título;ISSN impresa;ISSN en linea;Instituto;URL" + "\n";
    for(let i = 0; i < registros.length; i++){

      if(registros[i].issn != null) {
        info += `${registros[i].titulo};${registros[i].issn};;;${registros[i].enlace}` + "\n"; // Elimino las revistas que no tengan ISSN
      } 
      else{
        cantidadRevistasSinISSN++;
      }
    } 

    console.log("Cantidad de revistas eliminadas por no tener ISSN: " + cantidadRevistasSinISSN);

    const jsonFilePath = path.join(__dirname + '/../Repositorios/Biblat.json');
    const csvFilePath  = path.join(__dirname + '/../Repositorios/Biblat.csv');

    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito      
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

    calcularTiempoActualizacion(tiempoEmpieza, 'Biblat'); // Registro el tiempo que tomo la actualización
    
    console.log("Termina la extracción de datos de Biblat");
  }
  catch(error)
  {
    throw new Error('Error durante la extracción de revistas de Biblat: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
  }
  finally
  {
    actualizarEstado(false, "Biblat"); // Indico en la base de datos que este repositorio ya termino de actualizarse
  }

}

exports.extraerInfoRepositorio = extraerInfoRepositorio;
