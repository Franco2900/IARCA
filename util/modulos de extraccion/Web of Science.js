const puppeteer  = require('puppeteer');
const fs         = require('fs');        // Módulo para leer y escribir archivos
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json
const chokidar   = require('chokidar');  // Módulo para detectar cambios en un archivo o la creación del mismo
const path       = require('path');      // Módulo para trabajar con rutas

// Variables globales
const csvFilePath  = path.join(__dirname + '/../Repositorios/Web of Science.csv');
const jsonFilePath = path.join(__dirname + '/../Repositorios/Web of Science.json');

async function extraerInfoRevistas() 
{

    //esta opcion es para ver la extraccion en el navegador, es necesario en este modulo de extraccion
    //ya que se necesita controlar la ubicacion de los componentes y orden de aparicion
    const browser = await puppeteer.launch({ 
      headless: 'new', 
      defaultViewport: null,
      args: ['--start-maximized']
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
    await page.waitForSelector('span.ng-tns-c86-11:nth-child(2)');
    // Hacer clic en la etiqueta
    await page.click('span.ng-tns-c86-11:nth-child(2)');
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
      const options = document.querySelectorAll('.mat-option-text');
      
      for (const option of options)
      {
        const text = option.textContent.trim();      
        console.log(text); // Imprimir cada texto
        if (option.textContent.trim() === 'ARGENTINA') 
        {
          const parentOption = option.closest('.mat-option');
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
    const selector = 'body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div:nth-child(11) > mat-paginator > div > div > div.mat-paginator-page-size.ng-star-inserted > mat-form-field';
    const opcion50 = '/html/body/div[5]/div[2]/div/div/div/mat-option[3]';
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
      await page.waitForSelector('.mat-card');

      // Obtiene todos los elementos que coinciden con el selector
      const elements = await page.$$('.mat-card');

      // Contador para llevar un registro del número de iteraciones
      let contador = 0;

      // Recorre cada elemento y extrae la información
      for (const element of elements) 
      {
        // Incrementa el contador
        contador++;
        // Salta los dos primeros elementos porque no corresponden a los registros que queremos
        if (contador <= 2) {
          continue;
        }
        const titulo = await element.$eval('.mat-card-title', node => node.innerText.trim());

        // Utiliza el método `$$eval` para obtener una lista de elementos que coincidan con el selector
        const valores = await element.$$eval('.search-results-value', nodes => nodes.map(node => node.innerText.trim()));

        // Utilizo expresiones regulares para extraer los números
        const issnMatches1 = valores[1].match(/^\w{4}-\w{4}$/);
        const issnMatches2 = valores[1].match(/(\w{4}-\w{4}) \/ (\w{4}-\w{4})/);
        console.log(issnMatches1, issnMatches2);
        let issnImpreso ;
        let issnEnLinea;
        // Extrae los valores específicos
        const instituto = valores[0] || '';
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
        console.log(objeto);
      }
      // Muestra la lista de objetos
      //console.log(listadoDeRevistas);
    
      // Espera a que el elemento esté presente
      await page.waitForSelector('.mat-paginator-range-label');
    
      // Obtiene el texto del elemento
      const text = await page.$eval('.mat-paginator-range-label', node => node.innerText.trim());
    
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
      const next50 = "body > cdx-app > mat-sidenav-container > mat-sidenav-content > main > can-home-page > div > div > div > mat-sidenav-container > mat-sidenav-content > app-journal-search-results > div:nth-child(3) > div:nth-child(51) > mat-paginator > div > div > div.mat-paginator-range-actions > button.mat-focus-indicator.mat-tooltip-trigger.mat-paginator-navigation-next.mat-icon-button.mat-button-base"; 
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
      
    // Con todos los datos en string, escribo la info en formato .csv y después uso el modulo csvtojson para crear el archivo .json
    fs.access(rutaArchivo, fs.constants.F_OK, (error) => { // Uso fs.access para comprobar si el archivo existe

      if(error)
      {
        console.log('El archivo con los datos de Web of Science no existe. Creandolo');

        let vigilante = chokidar.watch(csvFilePath); // Archivo que le indico que vigile

        vigilante.on('add', function() // Defino un evento que se ejecutara cuando detecte la creación del archivo
        { 
          csvtojson({delimiter: [";"],}).fromFile(csvFilePath).then((json) => // La propiedad delimiter indica porque caracter debe separar
          { 
            fs.writeFileSync(jsonFilePath, JSON.stringify(json), error => {if(error) console.log(error);})
          })
      
          vigilante.close();  // Dejo de vigilar
        });

      }
      else
      {
        console.log('El archivo con los datos de Web of Science ya existe. Actualizandolo');

        let vigilante = fs.watch(csvFilePath, function ()  // Defino un evento que se ejecutara cuando detecte un cambio en el archivo 
        { 
          csvtojson({delimiter: [";"],}).fromFile(csvFilePath).then((json) => // La propiedad delimiter indica porque caracter debe separar
          { 
            fs.writeFileSync(jsonFilePath, JSON.stringify(json), error => {if(error) console.log(error);})
          })

          vigilante.close();
        });

      }
      
    });

    fs.writeFileSync(csvFilePath, info); // Escribo el archivo

    console.log("Termina la extracción de datos de WoS");
  }
  catch(error)
  {
    throw new Error('Error durante la extracción de revistas de Web of Science: ' + error.message); // Lanza un error hacia arriba (hacia el archivo que lo llamo)
  }

  return;
}
    
exports.extraerInfoRepositorio = extraerInfoRepositorio;