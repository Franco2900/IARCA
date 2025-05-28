// Variables de entorno
require('dotenv').config(); // Carga las variables del archivo .env en process.envs
const google = process.env.GOOGLE_PATH;

// Módulos
const puppeteer  = require('puppeteer');
const fs         = require('fs');        // Módulo para leer y escribir archivos
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json
const path       = require('path');      // Módulo para trabajar con rutas


async function extraerInfoRevistas() 
{
    const browser  = await puppeteer.launch({ // Inicio puppeter
      headless: 'new',
      defaultViewport: null,
      executablePath: google,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });
    
    const page = await browser.newPage();

    // Ir a la página de búsqueda
    page.setDefaultNavigationTimeout(120000);
    await page.goto('https://mjl.clarivate.com/search-results');
    await page.waitForTimeout(8000);
    //Cerrar las cookies
    await page.waitForSelector('#onetrust-close-btn-container button');
    await page.click('#onetrust-close-btn-container button');
    console.log('cookies cerradas');
    //Se espera a que cargue la página por completo
    await page.waitForTimeout(5000);


    //Espera a que la etiqueta con el selector específico esté presente en la página
    await page.waitForSelector('span.mat-content.ng-tns-c2690051721-12');
    // Hacer clic en la etiqueta
    await page.click('span.mat-content.ng-tns-c2690051721-12');
    console.log('clic realizado country region'); 
    // Se espera a que cargue la página por completo
    await page.waitForTimeout(2000);
  
    // Espera a que la etiqueta con el selector específico esté presente en la página
    await page.waitForSelector('#country-input')
    // Hacer clic en la etiqueta
    await page.click('#country-input')
    console.log('clic realizado #country-input');


    //Obtener el ID dinámico del país ARGENTINA
    const argentinaOption = await page.evaluate(() => {

      const options = document.querySelectorAll('span.mdc-list-item__primary-text');
      
      for (const option of options)
      {
        const text = option.textContent.trim();      
        console.log(text); // Imprimir cada texto
        if (option.textContent.trim() === 'ARGENTINA') 
        {
          const parentOption = option.closest('mat-option');
          return parentOption ? parentOption.id : null;
        }
      }

      return null;
    });
  
    if (argentinaOption) 
    {
      await page.click(`#${argentinaOption}`); // Hacer clic en el país ARGENTINA
      await page.waitForTimeout(2000); // Esperar un tiempo para que se procese la acción (puedes ajustar este tiempo según sea necesario)
      console.log(`Se hizo clic en ARGENTINA con ID: ${argentinaOption}`);
    } 
    else 
    {
      console.log('No se encontró el país ARGENTINA en la lista.');
    }

    //Se selecciona la mayor cantidad de revistas por pagina para reducir el tiempo de extraccion
    const selector = 'body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div:nth-child(11) > mat-paginator > div > div > div.mat-mdc-paginator-page-size.ng-star-inserted > mat-form-field';
    const opcion50 = '//mat-option[3]/span';
    //await page.waitForSelector('.mat-form-field');
    await page.waitForSelector(selector);
    await page.click(selector);
    console.log('clic en selector de cantidad de revistas por pagina');
        
    await page.waitForXPath(opcion50); // Esperar a que el componente esté presente en el DOM
    const [componente] = await page.$x(opcion50); // Realizar clic en el componente
    
    if (componente) 
    {
      await componente.click();
      console.log('Clic en el opcion de 50 revistas.');
    } 
    else 
    {
      console.error('No se encontró el componente en la página.');
    }
    // Lista para almacenar objetos
    const listaDeRevistas = [];
    let actual, total;

    do
    {
      // Se espera a que cargue la página por completo
      await page.waitForTimeout(5000);
      
      // Espera a que los elementos estén presentes (ajusta el selector según tu necesidad)
      //await page.waitForSelector('.mat-card');
      await page.waitForSelector('div[aria-live="polite"].mat-mdc-paginator-range-label');
      let texto = await page.$eval('div[aria-live="polite"].mat-mdc-paginator-range-label', element => element.innerText);
      //const isIncluded = texto.includes('1 – 50');
      //console.log(isIncluded)

      /*await page.waitForFunction(async () => {
        const elements = await page.$$('div[aria-live="polite"].mat-mdc-paginator-range-label');
        return elements.some(element => element.innerText.includes('1 – 50'));
      });*/
      

      // Obtiene todos los elementos que coinciden con el selector
      //const elements = await page.$$('.mat-card');
      let elements = await page.$$('mat-card.mat-mdc-card.mdc-card.card-width-special');

      // Recorre cada elemento y extrae la información
      for (let i = 0; i < elements.length; i++) 
      {
        let element = elements[i];
        let titulo = await element.$eval('mat-card-title.mat-mdc-card-title', node => node.innerText.trim());

        // Utiliza el método `$$eval` para obtener una lista de elementos que coincidan con el selector
        let valores = await element.$$eval('.search-results-value', nodes => nodes.map(node => node.innerText.trim()));

        // Utilizo expresiones regulares para extraer los números
        let issnMatches1 = valores[1].match(/^\w{4}-\w{4}$/);
        let issnMatches2 = valores[1].match(/(\w{4}-\w{4}) \/ (\w{4}-\w{4})/);
        console.log(issnMatches1, issnMatches2);
        let issnImpreso ;
        let issnEnLinea;

        // Extrae los valores específicos
        let instituto = valores[0] || '';
        if(issnMatches2)
        {
          issnImpreso = issnMatches2[1] || '';
          issnEnLinea = issnMatches2[2] || '';
        }
        else
        {
          issnImpreso = issnMatches1[0] || '';
          issnEnLinea = '';
        }

        // Crea un objeto con la información y agrégalo a la lista
        const objeto = {
          Título: titulo,
          Instituto: instituto,
          issnImpreso,
          issnEnLinea,
        };
        listaDeRevistas.push(objeto);
        // Muestra objetos
        console.log("Revista");
        console.log(objeto);
      }
      // Muestra la lista de objetos
      //console.log(listadoDeRevistas);
    
      // Espera a que el elemento esté presente
      //await page.waitForSelector('.mat-paginator-range-label');
    
      // Obtiene el texto del elemento
      //const text = await page.$eval('.mat-paginator-range-label', node => node.innerText.trim());
      const text = await page.$eval('div[aria-live="polite"].mat-mdc-paginator-range-label', node => node.innerText.trim());

      // Utilizo expresiones regulares para extraer los números
      const match = text.match(/(\d+) – (\d+) of (\d+)/);
    
      if (match) 
      {
        actual = parseInt(match[2], 10);
        total = parseInt(match[3], 10);
    
        // Muestra los valores
        console.log('Número actual:', actual);
        console.log('Número total:', total);
      } else 
      {
        console.error('No se encontraron números en el texto.');
      }  
    
      
      await page.waitForTimeout(2000);
     // const next50 = "body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div:nth-child(51) > mat-paginator > div > div > div.mat-paginator-range-actions > button.mat-focus-indicator.mat-tooltip-trigger.mat-paginator-navigation-next.mat-icon-button.mat-button-base"; 
     const next50 = "button.mat-mdc-tooltip-trigger.mat-mdc-paginator-navigation-next.mdc-icon-button.mat-mdc-icon-button.mat-unthemed.mat-mdc-button-base";
     //const next10 = "body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div:nth-child(11) > mat-paginator > div > div > div.mat-paginator-range-actions > button.mat-focus-indicator.mat-tooltip-trigger.mat-paginator-navigation-next.mat-icon-button.mat-button-base";
      if (actual !== total) await page.click(next50);
    }
    while(actual !== total);

    // Cerrar el navegador
    await browser.close();
    return listaDeRevistas; 

}



// Extraigo la info de todas las revistas de la consulta
async function extraerInfoRepositorio() 
{

  try
  {
    const listaDeRevistas = await extraerInfoRevistas();
    console.log("CANTIDAD DE REVISTAS: " + listaDeRevistas.length);

    // Paso los datos de los objetos a string
    let info = "Título;ISSN impresa;ISSN en linea;Instituto;URL" + "\n";
    for(let i = 0; i < listaDeRevistas.length; i++)
    {
      info += `${listaDeRevistas[i].Título};${listaDeRevistas[i].issnImpreso};${listaDeRevistas[i].issnEnLinea};${listaDeRevistas[i].Instituto};` + "\n";
    }
      
    const csvFilePath  = path.join(__dirname + '/../Repositorios/Web of Science.csv')
    const jsonFilePath = path.join(__dirname + '/../Repositorios/Web of Science.json');
        
    await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    
    const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
    
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

    console.log("Termina la extracción de datos de WoS");
  }
  catch(error)
  {
    throw new Error('Error durante la extracción de revistas de Web of Science: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
  }

  return;
}
    
exports.extraerInfoRepositorio = extraerInfoRepositorio;