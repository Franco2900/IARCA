const puerto = 5000;


function descargarCSV(repositorio) 
{
    window.location.href = `http://localhost:${puerto}/repositorio/${repositorio}/descargarCSV`;
}


function descargarJSON(repositorio) 
{
    window.location.href = `http://localhost:${puerto}/repositorio/${repositorio}/descargarJSON`;
}


function siguientePagina(repositorio)
{
    let paginaActual   = Number(document.getElementById("paginaActual").innerText);
    let cantidadPaginasDeNavegacion = Number(document.getElementById("cantidadPaginasDeNavegacion").innerText);

    if( paginaActual < cantidadPaginasDeNavegacion )
    {
        fetch(`http://localhost:${puerto}/repositorio/${repositorio}/siguientePagina`,
        { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify( { paginaActual: paginaActual } ) 
        })
        .then( response => 
        {
            // Si la respuesta no es exitosa, lanza un error
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
            console.error('Error:', error);
        });
    }

}



function anteriorPagina(repositorio)
{
    let paginaActual   = Number(document.getElementById("paginaActual").innerText);

    if(paginaActual > 1)
    {
        fetch(`http://localhost:${puerto}/repositorio/${repositorio}/anteriorPagina`,
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
            console.error('Error:', error);
        });
    }
}


function buscarPaginaEspecifica(repositorio)
{
    let paginaBuscada = Number(document.getElementById("buscarPaginaEspecifica").value);
    let cantidadPaginasDeNavegacion = Number(document.getElementById("cantidadPaginasDeNavegacion").innerText);

    if(paginaBuscada >= 1   &&  paginaBuscada <= cantidadPaginasDeNavegacion)
    {
        fetch(`http://localhost:${puerto}/repositorio/${repositorio}/buscarPaginaEspecifica`,
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
            console.error('Error:', error);
        });
    }

}


function primerPagina(repositorio)
{
    fetch(`http://localhost:${puerto}/repositorio/${repositorio}/primerPagina`,
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
        console.error('Error:', error);
    });

}


function ultimaPagina(repositorio)
{
    let cantidadPaginasDeNavegacion = Number(document.getElementById("cantidadPaginasDeNavegacion").innerText);

    fetch(`http://localhost:${puerto}/repositorio/${repositorio}/ultimaPagina`,
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
    .catch(error => 
    {
        console.error('Error:', error);
    });

}


function actualizarCatalogo(repositorio)
{
    // Muestro el gif de reloj
    let estadoDeLaActualización = document.getElementById('estadoDeLaActualización');
    estadoDeLaActualización.innerHTML = `
        <img src="/images/style/esperando.gif" class="mx-auto d-block border border-dark" />
        <h2 style="text-align: center;">Actualizando datos. Espere por favor</h2>
    `;

    // Hago invisible el boton de actualizar catalogo
    document.getElementById("actualizarCatalogo").style.display="none"; 

    fetch(`http://localhost:${puerto}/repositorio/${repositorio}/actualizarCatalogo`,
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
        console.error('Error:', error);

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