// Módulos del núcleo de Node.JS o módulos externos
const fs             = require('fs');        // Módulo para leer y escribir archivos
const puppeteer      = require('puppeteer'); // Módulo para web scrapping
const jsdom          = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const XMLHttpRequest = require('xhr2');      // Módulo para comunicarse con las APIs

// Módulos de web scraping (hechos por nosotros)
const Latindex = require('./modulos de extraccion/Latindex.js');
const CAICYT   = require('./modulos de extraccion/CAICYT.js');
const Biblat   = require('./modulos de extraccion/Biblat.js');
const Redalyc  = require('./modulos de extraccion/Redalyc.js');
const Scielo  = require('./modulos de extraccion/Scielo.js');
const WoS  = require('./modulos de extraccion/WoS.js');
const Scimagojr  = require('./modulos de extraccion/Scimago.js');

// APIs (los brindan los sitios web)
const DOAJ = require('./modulos de extraccion/DOAJ.js');


// Extracción de datos
//CAICYT.extraerInfoCAICYT();
//CAICYT.sanarDatos();
//CAICYT.actualizarDatos();
//Redalyc.extraerInfoRedalyc();
//Latindex.extraerInfoLatindex();
//Latindex.extraerInfoLatindexLite();
DOAJ.extraerInfoDOAJ();
//Biblat.extraerInfoBiblat();
//Scielo.extraerInfoScielo();
//WoS.extraerInfoWoS();
//Scimagojr.extraerInfoScimagojr();
