// Módulos
const fs         = require("fs");        // Módulo para leer y escribir archivos
const puppeteer  = require("puppeteer"); // Módulo para web scrapping
const jsdom      = require("jsdom");     // Módulo para filtrar la información extraida con web scrapping
const path       = require('path');      // Módulo para trabajar con rutas
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json


// Busco cuantas páginas devuelve la consulta a Latindex (cada página tiene entre 1 y 20 revistas)
async function obtenerUrls() 
{  
  const urls = [];
  
  try 
  {
    const browser  = await puppeteer.launch({ // Inicio puppeter
      headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }); 
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    const response = await page.goto(
      "http://www.scielo.org.ar/scielo.php?script=sci_alphabetic&lng=es&nrm=iso"
    );
    const body = await response.text();

    const {
      window: { document },
    } = new jsdom.JSDOM(body);

    var filtroHTML = document.querySelectorAll("ul")[0];
    
    filtroHTML.querySelectorAll("li font a[href]").forEach((element) => {
      const href = element.getAttribute("href");
      //console.log("HREF", href);
      urls.push(href);
    });

    await page.close();
    await browser.close();
    return urls;
  } 
  catch (error) 
  {
    console.error("Error:", error);
    throw error; // Lanza el error para manejarlo en el contexto que llama a esta función
  }

}


// Extraigo la info de una revista
async function extraerInfoRevista(urls) 
{
  const browser  = await puppeteer.launch({ // Inicio puppeter
    headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  }); 
  const registros = [];

  for (const url of urls) 
  {
    const page = await browser.newPage();
    
    try 
    {
      console.log(`Procesando enlace: ${url}`);
      page.setDefaultNavigationTimeout(0);
      await page.goto(url);
        
      // Extraer los valores de issn y issn_e
      const issnMatches = await page.evaluate(() => {
        const spanElement = document.querySelector('.issn');
        const textContent = spanElement.textContent;

        // Crear patrones para extraer los ISSN
        const printPattern = /versión\s+impresa\s+ISSN\s+(....-....)/i;
        const onlinePattern = /versión\s+On-line\s+ISSN\s+(....-....)/i;

        const issnImpreso = textContent.match(printPattern);
        const issnEnLinea = textContent.match(onlinePattern);

        return [issnImpreso ? issnImpreso[1] : '', issnEnLinea ? issnEnLinea[1] : ''];
      });

      const [issnImpreso, issnEnLinea] = issnMatches; 

      // Extraer el texto de la etiqueta <span class="titulo">Salud colectiva</span>
      const titulo = await page.evaluate(() => {
        const imgElement = document.querySelector(".journalLogo img");
        return imgElement ? imgElement.alt : null;
      });

      // Extrae el valor de la etiqueta <strong>
      const instituto = await page.evaluate(() => {
        const titleElement = document.querySelector(".journalTitle");
        return titleElement ? titleElement.innerText.trim().replaceAll(";", ",").replace(/(\r\n|\n|\r)/gm, " ") : null;
      });

      console.log("Valor de ISSN:", issnImpreso);
      console.log("Valor de ISSN-e:", issnEnLinea);
      console.log("INSTITUCION:", instituto);
      console.log("REVISTA: ", titulo);
      console.log("URL: ", url);
      console.log("************************************************************************");

      registros.push({
        titulo,
        instituto,
        issnImpreso,
        issnEnLinea,
        url
      });

    } 
    catch (error) 
    {
      console.error(`Error al procesar enlace: ${url}`);
      console.error(error);
      // Continúa con el siguiente URL si hay un error
      continue;

    } 
    finally 
    {
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
    console.log("Comienza la extracción de datos de Scielo");
    const urls      = await obtenerUrls();
    const registros = await extraerInfoRevista(urls);

    console.log("REVISTAS CONSULTADAS: " + urls.length);
    console.log("REGISTROS OBTENIDOS: " + registros.length);

    // Paso los datos de los objetos a string
    let info = "Título;ISSN impresa;ISSN en linea;Instituto;URL" + "\n";
    for(let i = 0; i < registros.length; i++)
    {
      info += `${registros[i].titulo};${registros[i].issnImpreso};${registros[i].issnEnLinea};${registros[i].instituto};${registros[i].url}` + "\n";
    }

    const jsonFilePath = path.join(__dirname, '../Repositorios/Scielo.json');
    const csvFilePath  = path.join(__dirname, '../Repositorios/Scielo.csv');

    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
      
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
      
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON
  }
  catch (error)     
  {
    throw new Error('Error durante la extracción de revistas de Scielo: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
  }

}

exports.extraerInfoRepositorio = extraerInfoRepositorio;
