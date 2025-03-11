// Modulos
const axios      = require('axios');
const fs         = require('fs');
const xlsx       = require('xlsx');
const path       = require('path'); // Módulo para trabajar con rutas
const csvtojson  = require('csvtojson'); // Módulo para pasar texto csv a json

async function descargarArchivo() 
{
  const url = 'https://www.scimagojr.com/journalrank.php?country=AR&out=xls';

  try 
  {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Crear archivo XLS
    const xlsFilePath  = path.join(__dirname, '../Repositorios/Scimagojr.xls');
    fs.writeFileSync(xlsFilePath, response.data);
    console.log(`Archivo XLS creado: ${xlsFilePath}`);

    // Cargar el libro de Excel
    const libro = xlsx.readFile(xlsFilePath, { type: 'buffer' });

    // Obtener la primera hoja del libro
    const primeraHoja = libro.SheetNames[0];
    const hoja = libro.Sheets[primeraHoja];

    // Convertir la hoja a un objeto JSON
    const datos = xlsx.utils.sheet_to_json(hoja, { header: 1, raw: false, delimiter: ";" });

    // Extraer valores específicos (Title, Issn, Publisher)
    const resultados = [];

    // Contador para llevar un registro del número de iteraciones
    let contador = 0;
    for (const fila of datos) 
    {
      // Incrementa el contador
      contador++;
      // Salta el primer elemento porque no corresponde a los registros que queremos
      if (contador <= 1) 
      {
        continue;
      }
        
      // Verificar si fila[4] existe y es una cadena antes de dividir
      if (fila[4] && typeof fila[4] === 'string') 
      {
        // Separar los ISSN si hay más de uno
        const issns = fila[4].split(',').map(issn => issn.trim());

        // Formatear los ISSN
        const issnFormatted = issns[0] ? `${issns[0].substring(0, 4)}-${issns[0].substring(4)}` : '';
        const eissnFormatted = issns[1] ? `${issns[1].substring(0, 4)}-${issns[1].substring(4)}` : '';

        const objetoResultado = {
          //titulo: fila[2].replace(/;/g, ','),       // Índice 2 para el campo Title
          titulo: new String(fila[2]).replace(/;/g, ','),      
          issnImpreso: issnFormatted,   // Índice 4 para el campo Issn
          issnEnLinea: eissnFormatted, // Índice 4 para el campo eIssn
          //instituto: fila[17].replace(/;/g, ',')   // Índice 17 para el campo Publisher
          instituto: new String(fila[20]).replace(/;/g, ','),
            
          sourceId: new String(fila[1]).replace(/;/g, ','), // Le añadí esta propiedad para poder crear los URLs
        };

        resultados.push(objetoResultado);
      }

    }
    console.log(resultados);
    return resultados;
  } 
  catch (error) 
  {
    console.error('Error al descargar el archivo:', error.message);
  }

}

// Extraigo la info de todas las revistas de la consulta
async function extraerInfoRepositorio() 
{
  const listaDeRevistas = await descargarArchivo();
  console.log("CANTIDAD DE REVISTAS: " + listaDeRevistas.length);

  // Paso los datos de los objetos a string
  let info = "Título;ISSN impresa;ISSN en linea;Instituto;URL" + "\n";
  for(let i = 0; i < listaDeRevistas.length; i++)
  {
    info += `${listaDeRevistas[i].titulo};${listaDeRevistas[i].issnImpreso};${listaDeRevistas[i].issnEnLinea};${listaDeRevistas[i].instituto};https://www.scimagojr.com/journalsearch.php?q=${listaDeRevistas[i].sourceId}&tip=sid&clean=0` + "\n";
  }

  const csvFilePath  = path.join(__dirname + '/../Repositorios/Scimago.csv');
  const jsonFilePath = path.join(__dirname + '/../Repositorios/Scimago.json');

  await fs.promises.writeFile(csvFilePath, info); // Escribo la info en formato CSV. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    
  const json = await csvtojson({ delimiter: [";"] }).fromFile(csvFilePath); // Parseo de CSV a JSON directamente después de asegurarse de que el archivo CSV esté escrito
    
  await fs.promises.writeFile(jsonFilePath, JSON.stringify(json));  // Escribo el archivo JSON

  console.log("Termina la extracción de datos de Scimago");
}

exports.extraerInfoRepositorio = extraerInfoRepositorio;
