// ================== VARIABLES DE ENTORNO ==================
require('dotenv').config(); // Carga las variables del archivo .env en process.env
const puerto  = process.env.PUERTO;
const dominio = process.env.DOMINIO;

// ================== FUNCIONES ÚTILES ==================
// Estas son funciones que son utilizadas por múltiples archivos de tipo Controller

// Indica la URL en la que se encuentra el usuario web actualmente
function logURL(metodo, ruta) {
    console.log('***********************************************************');
    console.log(`URL actual: ${metodo} ${dominio}:${puerto}/iarca${ruta} \n`);
}

module.exports = { 
    logURL,
};