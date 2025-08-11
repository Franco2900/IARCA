// ================== MÓDULOS Y DEPENDENCIAS ==================
const path = require( 'path' ); // Módulo para trabajar con rutas de archivos y directorios
const fs   = require('fs');     // Módulo para escribir, leer, borrar y renombrar archivos

// ================== FUNCIONES ÚTILES ==================
// Estas son funciones que son utilizadas por múltiples archivos.

// Calcula el tiempo que le tomo al repositorio actualizarse
function calcularTiempoActualizacion(tiempoEmpieza, repositorio)
{
    let tiempoTermina = Date.now();
    let segundos = Math.ceil( ( tiempoTermina - tiempoEmpieza) / 1000 );
        
    console.log(`Se tardo ${segundos} segundos en extraer los datos`);
    
    // Si existe el archivo de tiempo, se actualiza el archivo
    if( fs.existsSync( path.join(__dirname, `Tiempos/${repositorio}Tiempo.txt`) ) ) 
    { 
        fs.appendFileSync(path.join(__dirname, `Tiempos/${repositorio}Tiempo.txt`), `${segundos};`, error => 
        { 
            if(error) console.log(error);
        })
    }
    // Si no existe el archivo de tiempo, se lo crea
    else
    {
        fs.writeFileSync(path.join(__dirname, `Tiempos/${repositorio}Tiempo.txt`), `${segundos};`, error => 
        { 
            if(error) console.log(error);
        })
    }

    calcularTiempoPromedio(repositorio);
}


// Calcula el tiempo PROMEDIO que le toma a un repositorio actualizarse
function calcularTiempoPromedio(repositorio)
{
    let tiempoPromedio = 0;

    fs.readFile(path.join(__dirname, `Tiempos/${repositorio}Tiempo.txt`), (error, datos) => { 
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
            fs.writeFile(path.join(__dirname, `Tiempos/${repositorio}TiempoPromedio.json`), `[{"TiempoPromedio":${tiempoPromedio}}]`, error => 
            { 
                if(error) console.log(error);
            })
        }
    });

}


module.exports = { 
    calcularTiempoActualizacion,
    calcularTiempoPromedio
};