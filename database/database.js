// Variables de entorno
require('dotenv').config(); // Carga las variables de .env en process.env

// Modulos
const mysql = require('mysql2/promise'); // Permite usar mysql

// Creo la conexión a la base de datos 
const db = mysql.createPool({ 
    host:     process.env.DB_HOST, 
    user:     process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME
});

module.exports = db;