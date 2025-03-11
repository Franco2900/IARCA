const puerto = 5000;


function descargarCSV() 
{
    fetch(`http://localhost:${puerto}/listadoFinal/descargarCSV`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.blob(); // Convierte la respuesta en un Blob (binary large object) para la descarga
    })
    .then(blob => {
        const link = document.createElement('a'); // Crea un enlace para descargar el archivo
        link.href = window.URL.createObjectURL(blob);
        link.download = `Listado final.json`;
        link.click(); // Hace click en el enlace
    })
    .catch(error => {
    
        alert("Error al descargar el archivo: " + error.message);
        console.error(error);
    });
}



function descargarJSON() 
{
    fetch(`http://localhost:${puerto}/listadoFinal/descargarJSON`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.blob(); // Convierte la respuesta en un Blob (binary large object) para la descarga
    })
    .then(blob => {
        const link = document.createElement('a'); // Crea un enlace para descargar el archivo
        link.href = window.URL.createObjectURL(blob);
        link.download = `Listado final.json`;
        link.click(); // Hace click en el enlace
    })
    .catch(error => {
    
        alert("Error al descargar el archivo: " + error.message);
        console.error(error);
    });
}



function siguientePagina()
{
    let paginaActual                = Number(document.getElementById("paginaActual").innerText);
    let cantidadPaginasDeNavegacion = Number(document.getElementById("cantidadPaginasDeNavegacion").innerText);

    if( paginaActual < cantidadPaginasDeNavegacion )
    {
        fetch(`http://localhost:${puerto}/listadoFinal/siguientePagina`,
        { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify( { paginaActual: paginaActual } ) 
        })
        .then( response => 
        {
            // Si la respuesta no es exitosa, lanza un mensaje de error y se va al catch
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

            return response.json();
        })
        .then( data => {

            console.log(data);

            document.getElementById("tablaRevistas").innerHTML = data.tabla;
            document.getElementById("paginaActual").innerText = ++paginaActual;
        })
        .catch(error => 
        {
            console.error(error);
        });
    }

}



function anteriorPagina()
{
    let paginaActual = Number(document.getElementById("paginaActual").innerText);

    if(paginaActual > 1)
    {
        fetch(`http://localhost:${puerto}/listadoFinal/anteriorPagina`,
        { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify( { paginaActual: paginaActual } ) 
        })
        .then( response => 
        {
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

            return response.json();
        })
        .then( data => 
        {
            console.log(data);

            document.getElementById("tablaRevistas").innerHTML = data.tabla;
            document.getElementById("paginaActual").innerText = --paginaActual;
        })
        .catch(error => 
        {
            console.error(error);
        });
    }
}



function buscarPaginaEspecifica()
{
    let paginaBuscada               = Number(document.getElementById("buscarPaginaEspecifica").value);
    let cantidadPaginasDeNavegacion = Number(document.getElementById("cantidadPaginasDeNavegacion").innerText);

    if(paginaBuscada >= 1   &&  paginaBuscada <= cantidadPaginasDeNavegacion)
    {
        fetch(`http://localhost:${puerto}/listadoFinal/buscarPaginaEspecifica`,
        { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify( { paginaBuscada: paginaBuscada } ) 
        })
        .then( response => 
        {
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    
            return response.json();
        })
        .then( data => 
        {
            console.log(data);

            document.getElementById("tablaRevistas").innerHTML = data.tabla;
            document.getElementById("paginaActual").innerText = paginaBuscada;
        })
        .catch(error => 
        {
            console.error(error);
        });
    }

}



function primerPagina()
{    
    let paginaActual   = Number(document.getElementById("paginaActual").innerText);

    if( paginaActual != 1 )
    {
        fetch(`http://localhost:${puerto}/listadoFinal/primerPagina`,
        { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
        })
        .then( response => 
        {
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

            return response.json();
        })
        .then( data => 
        {
            console.log(data);

            document.getElementById("tablaRevistas").innerHTML = data.tabla;
            document.getElementById("paginaActual").innerText = 1;
        })
        .catch(error => 
        {
            console.log(error);
        });
    }
}



function ultimaPagina()
{
    let paginaActual   = Number(document.getElementById("paginaActual").innerText);
    let cantidadPaginasDeNavegacion = Number(document.getElementById("cantidadPaginasDeNavegacion").innerText);

    if( paginaActual < cantidadPaginasDeNavegacion )
    {
        fetch(`http://localhost:${puerto}/listadoFinal/ultimaPagina`,
        { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
        })
        .then( response => 
        {
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

            return response.json();
        })
        .then( data => 
        {
            console.log(data);

            document.getElementById("tablaRevistas").innerHTML = data.tabla;
            document.getElementById("paginaActual").innerText  = cantidadPaginasDeNavegacion;
        })
        .catch( error => 
        {
            console.log(error);
        });
    }

}



function actualizarCatalogo()
{
    // Muestro el gif de reloj
    let estadoDeLaActualización = document.getElementById('estadoDeLaActualización');
    estadoDeLaActualización.innerHTML = `
        <img src="/images/style/esperando.gif" class="mx-auto d-block border border-dark" />
        <h2 style="text-align: center;">Actualizando datos. Espere por favor</h2>
    `;

    // Hago invisible el boton de actualizar catalogo
    document.getElementById("actualizarCatalogo").style.display="none"; 

    fetch(`http://localhost:${puerto}/listadoFinal/actualizarCatalogo`,
    { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
    })
    .then( response => 
    {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        
        return response.json();
    })
    .then( data => 
    {
        console.log(data);
    
       location.reload();
    })
    .catch(error => 
    {
        console.error(error);

        // Muestro mensaje de error al usuario
        estadoDeLaActualización.innerHTML = 
        `<h4 style="text-align: center;">   
            Hubo un error al actualizar los datos. Esto puede deberse a un problema con su conexión a internet 
            o a que el repositorio web de donde se extrae la información no esta disponible. Intentelo de nuevo más tarde.
        </h4>`;

        // Hago visible de vuelta el boton de actualizar
        document.getElementById("actualizarCatalogo").style.display="block"; 
    });

}