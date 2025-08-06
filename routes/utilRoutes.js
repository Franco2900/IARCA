// ================== FUNCIONES ÚTILES ==================
// Estas son funciones que son utilizadas por múltiples archivos de tipo Routes


// Redirige a la página de login si el usuario no está logueado 
function autentificarUsuario(req, res, next) 
{
    if (req.session && req.session.nombre) return next();
    else                                   res.redirect('/iarca/login');   
}

module.exports = { 
    autentificarUsuario,
};