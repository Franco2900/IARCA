// Modulo para usar mysql
const mysql = require('mysql2/promise');

// Creo la conexión a la base de datos 
const db = mysql.createPool({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'iarca' 
});

// Exporto la conexión para que pueda ser usado en otro archivo
module.exports = db;