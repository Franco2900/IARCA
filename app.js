// ================== MÓDULOS Y DEPENDENCIAS ==================
const express      = require( 'express' );         // Modulo para la navegación web y creación del servidor
const session      = require( 'express-session' ); // Modulo para usar variables de sesions
const bodyParser   = require( 'body-parser' )      // Módulo para trabajar con las solicitudes POST
const cors         = require( 'cors' );            // Módulo para permitir las solicitudes de otros navegadores web a nuestro servidor
const path         = require( 'path' );            // Módulo para trabajar con rutas de archivos y directorios
const randomstring = require( 'randomstring' );    // Modulo para generar string al azar

// ================== CONFIGURACIÓN DE LA APP ==================
const app = express();  // Inicialización de la aplicación Express

// Variables de entorno
require('dotenv').config(); // Carga las variables del archivo .env en process.env
const puerto  = process.env.PUERTO;
const dominio = process.env.DOMINIO;


// ================== CONFIGURACIÓN DEL MOTOR DE PLANTILLAS ==================
app.set( 'views', path.join(__dirname, 'views') ); // Indico que las vistas estan en la carpeta 'views'
app.set( 'view engine', 'ejs' );                   // Indico que motor de plantillas uso


// ================== MIDDLEWARES GLOBALES ================== 
// Los middlewares en Express son funciones que se ejecutan antes de que una solicitud 
// llegue a una ruta específica. Estos se aplican a **todas** las solicitudes de la aplicación

app.use( bodyParser.urlencoded({ extended: true }) ); // Permite el uso de formularios HTML y pone sus datos a disposición en req.body
app.use( express.json() );                            // Permite parsear los datos que llegan al servidor como JSON
app.use( cors() );                                    // Habilita CORS (Cross-Origin Resource Sharing)


// Defino la sesión
app.use(session({                    
    secret: randomstring.generate(), // Clave secreta usada para firmar y validar la cookie de sesión.
    resave: false,                   // Evita que la sesión se guarde de nuevo en el servidor si no ha sido modificada.
    saveUninitialized: false,        // No guarda sesiones de usuarios no autenticados
    cookie: {
        maxAge: 1000 * 60 * 60 * 24  // Duración de la cookie de sesión: 1 dia
    }
}));


// Variables que se usan en la vista
app.use((req, res, next) => {
    res.locals.usuario = req.session; // Asigna la información del usuario a res.locals para que esté disponible en todas las vistas.
    next(); 
});


// ================== MIDDLEWARES PARA RUTAS ESPECÍFICAS ==================
// Algunos middlewares solo se aplican a ciertas rutas, permitiendo modificar 
// su comportamiento sin afectar a toda la aplicación. 

// ================== ARCHIVOS ESTÁTICOS ==================
// Express envia los archivos en estas rutas directamente sin pasar por lógica adicional del servidor.
app.use('/iarca/images',         express.static( path.join(__dirname, 'public/images')) ); 
app.use('/iarca/css',            express.static( path.join(__dirname, 'public/css')) );
app.use('/iarca/js',             express.static( path.join(__dirname, 'public/js')) );
app.use('/iarca/bootstrapCSS',   express.static( path.join(__dirname, 'node_modules/bootstrap/dist/css')) );  
app.use('/iarca/bootstrapJS',    express.static( path.join(__dirname, 'node_modules/bootstrap/dist/js')) );
app.use('/iarca/bootstrapICONS', express.static( path.join(__dirname, 'node_modules/bootstrap-icons/font')) );

// ================== RUTAS DE NAVEGACIÓN DEL USUARIO ==================
app.use('/iarca/',              require('./routes/homeRoutes.js') );
app.use('/iarca/contacto',      require('./routes/contactoRoutes.js') );
app.use('/iarca/login',         require('./routes/loginRoutes.js') );
app.use('/iarca/logout',        require('./routes/logoutRoutes.js') );
app.use('/iarca/perfil',        require('./routes/perfilRoutes.js') );
app.use('/iarca/repositorio',   require('./routes/repositorioRoutes.js') );
app.use('/iarca/info',          require('./routes/infoRoutes.js') );
app.use('/iarca/listadoFinal',  require('./routes/listadoFinalRoutes.js') );


// ================== INICIO DEL SERVIDOR ==================
const servidor = app.listen(puerto, () => {
    console.info(`Aplicación iniciada en el puerto: ${puerto}`);
    console.info(`Servidor corriendo en el dominio: ${dominio}`);
});

module.exports = app;