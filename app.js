// Modulos
const express    = require( 'express' );         // Modulo para la navegación web y creación del servidor
const session    = require( 'express-session' ); // Modulo para usar variables de sesions
const bodyParser = require( 'body-parser' )      // Módulo para trabajar con las solicitudes POST
const cors       = require( 'cors' );            // Módulo para permitir las solicitudes de otros navegadores web a nuestro servidor
const path       = require( 'path' );            // Módulo para trabajar con rutas de archivos y directorios


// Variables globales
const app    = express();
const puerto = 5000;


// Motor de plantillas
app.set( 'views', path.join(__dirname, 'views') ); // Indico que las vistas estan en la carpeta 'views'
app.set( 'view engine', 'ejs' );                   // Indico que motor de plantillas uso


// Middleware
app.use( bodyParser.urlencoded({ extended: true }) ); // Permite el uso de formularios HTML y pone sus datos a disposición en req.body
app.use( express.json() );                            // Permite parsear los datos que llegan al servidor como JSON
app.use( cors() );                                    // Habilita CORS (Cross-Origin Resource Sharing)


app.use(
    session({  // Permite el uso de variables de sesión
        secret: `${Math.floor(Math.random() * 101)}`,   // ID de la sesion   
        resave: false,          
        saveUninitialized: true,        
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // Duración de las cookies = 1 dia
        }
    }
));


// Rutas de atajo a archivos
app.use('/images', express.static('public/images'));
app.use('/css',    express.static('public/css'));
app.use('/js',     express.static('public/js'));
app.use('/bootstrapCSS',   express.static('node_modules/bootstrap/dist/css'));  // Bootstrap
app.use('/bootstrapJS',    express.static('node_modules/bootstrap/dist/js'));
app.use('/bootstrapICONS', express.static('node_modules/bootstrap-icons/font'));


// Rutas de navegación web
app.use('/',              require('./routes/homeRoutes.js') );
app.use('/contacto',      require('./routes/contactoRoutes.js') );
app.use('/login',         require('./routes/loginRoutes.js') );
app.use('/logout',        require('./routes/logoutRoutes.js') );
app.use('/perfil',        require('./routes/perfilRoutes.js') );
app.use('/repositorio',   require('./routes/repositorioRoutes.js') );
app.use('/info',          require('./routes/infoRoutes.js') );
app.use('/listadoFinal', require('./routes/listadoFinalRoutes.js') );


// Inicio el servidor
const servidor = app.listen(puerto, () => {
    console.log('Servidor web iniciado en el puerto ' + puerto);
});

module.exports = app;