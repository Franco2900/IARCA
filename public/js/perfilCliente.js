const dominio = window.location.origin;

function cambiarImagen(event) 
{
    const input = event.target; // Referencia al input html

    if (input.files && input.files[0]) // Si se selecciono archivos y si se selecciona al menos un archivo
    {
        const reader = new FileReader(); // Objeto que permite leer el contenido de los archivos

        reader.onload = function (e) {   // Defino lo que se hara cuando se termine de leer el contenido del archivo
            document.getElementById('imagenPerfil').src = e.target.result; // Cambio el atributo src del elemento html con dicho ID con el resultado del archivo leido

            const formData = new FormData();
            formData.append('imagenPerfil', input.files[0]);

            console.log('Haciendo solicitud');

            // Petición al servidor usando fetch 
            fetch(`${dominio}/iarca/perfil/cambiarImagen`, 
            { 
                method: 'POST', 
                body: formData 
            })
            .then(response => response.json())
            .then(data => {
                console.log('Éxito:', data);
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
            });

        }

        reader.readAsDataURL(input.files[0]); // Leo el primer archivo
    }
}


function cambiarNombre() 
{
    const etiquetaConNombre = document.getElementById('nombre');
    const viejoNombre = etiquetaConNombre.innerText.replace('Nombre: ', '').trim();

    // Solicita nuevo nombre al usuario 
    const nuevoNombre = prompt('Introduce tu nuevo nombre: ', viejoNombre);

    if (nuevoNombre) // Si se ingresa un nombre 
    {
        const datos = { nuevoNombre: nuevoNombre.trim() };

        // Petición al servidor usando fetch 
        fetch(`${dominio}/iarca/perfil/cambiarNombre`, 
        { method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(datos) 
        })
        .then(response => response.json())
        .then(data => {
            console.log('Éxito:', data);
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error: ' + error.message);
        });
    }
}


function cambiarContrasenia() 
{
    // Solicita nueva contraseña al usuario 
    const nuevaContrasenia = prompt('Introduce tu nueva contraseña: ');

    if (nuevaContrasenia) 
    {
        const datos = { nuevaContrasenia: nuevaContrasenia };

        // Petición al servidor usando fetch 
        fetch(`${dominio}/iarca/perfil/cambiarContrasenia`, 
        { method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(datos) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) 
            {
                console.log('Éxito:', data);
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error: ' + error.message);
        });
    }
}