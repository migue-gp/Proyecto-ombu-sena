        
// Función para obtener el token CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Mostrar mensajes de notificación
function mostrarMensaje(mensaje, tipo) {
    const notificacion = document.getElementById('notificacion');
    const mensajeNotificacion = document.getElementById('mensaje-notificacion');
    
    mensajeNotificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo === 'success' ? 'exito' : 'error'}`;
    notificacion.style.display = 'block';
    
    // Desaparecer después de 3 segundos
    setTimeout(() => {
        notificacion.style.display = 'none';
    }, 3000);
}

// Funciones para manejar los modales
function openAddModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function closeAddModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}

function openEditModal(id, nombre, apellido, usuario, email, rol) {
    // Llenar el formulario con los datos recibidos como parámetros
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    document.getElementById('edit_apellido').value = apellido;
    document.getElementById('edit_usuario').value = usuario;
    document.getElementById('edit_email').value = email;
    document.getElementById('edit_rol').value = rol;
    
    document.getElementById('editUserModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editUserModal').style.display = 'none';
    document.getElementById('editUserForm').reset();
}

// Función para cambiar el estado de un usuario (inhabilitar/habilitar)
function cambiarEstado(id, nuevoEstado) {
    if (confirm(`¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} este usuario?`)) {
        fetch(`/actualizar-estado-usuario/${id}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cambiar el estado del usuario');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarMensaje(data.message, 'success');
                // Recargar la página para actualizar la interfaz
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                mostrarMensaje(data.message, 'error');
            }
        })
        .catch(error => {
            mostrarMensaje(error.message, 'error');
        });
    }
}

// Función para eliminar un usuario
function eliminarUsuario(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
        fetch(`/eliminar-usuario/${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el usuario');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarMensaje(data.message, 'success');
                // Recargar la página para actualizar la interfaz
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                mostrarMensaje(data.message, 'error');
            }
        })
        .catch(error => {
            mostrarMensaje(error.message, 'error');
        });
    }
}

// Configuración de los event listeners cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Manejo del formulario para agregar usuario
    document.getElementById('addUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificar que las contraseñas coincidan
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password !== confirmPassword) {
            mostrarMensaje('Las contraseñas no coinciden', 'error');
            return;
        }
        
        // Preparar los datos para enviar al servidor
        const userData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            usuario: document.getElementById('usuario').value,
            email: document.getElementById('email').value,
            password: password,
            confirm_password: confirmPassword,
            rol: document.getElementById('rol').value
        };
        
        // Enviar los datos al servidor
        fetch('/crear-usuario/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Error al crear el usuario');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarMensaje(data.message, 'success');
                closeAddModal();

                const tablaUsuariosBody = document.querySelector('#tabla-usuarios tbody'); 
                const nuevoUsuario = data.user;
                const nuevaFila = tablaUsuariosBody.insertRow();

                let celda = nuevaFila.insertCell();
                celda.textContent = nuevoUsuario.id;

                celda = nuevaFila.insertCell();
                celda.textContent = nuevoUsuario.first_name;

                celda = nuevaFila.insertCell();
                celda.textContent = nuevoUsuario.last_name;

                celda = nuevaFila.insertCell();
                celda.textContent = nuevoUsuario.username;

                celda = nuevaFila.insertCell();
                celda.textContent = nuevoUsuario.email;

                celda = nuevaFila.insertCell();
                celda.textContent = nuevoUsuario.rol;

                // Celda para las acciones (Editar y Eliminar)0
                celda = nuevaFila.insertCell();
                const botonEditar = document.createElement('button');
                botonEditar.textContent = 'Editar';
                botonEditar.classList.add('btn', 'btn-sm', 'btn-primary');
                botonEditar.setAttribute('data-id', nuevoUsuario.id);
                botonEditar.addEventListener('click', () => openEditModal(
                    nuevoUsuario.id,
                    nuevoUsuario.first_name,
                    nuevoUsuario.last_name,
                    nuevoUsuario.username,
                    nuevoUsuario.email,
                    nuevoUsuario.rol
                ));
                celda.appendChild(botonEditar);

                const botonEliminar = document.createElement('button');
                botonEliminar.textContent = 'Eliminar';
                botonEliminar.classList.add('btn', 'btn-sm', 'btn-danger', 'ms-2');
                botonEliminar.setAttribute('data-id', nuevoUsuario.id);
                botonEliminar.addEventListener('click', () => eliminarUsuario(nuevoUsuario.id));
                celda.appendChild(botonEliminar);


                // Eliminar la recarga de la página
                // setTimeout(() => {
                //     window.location.reload();
                // }, 1000);
            } else {
                mostrarMensaje(data.message, 'error');
            }
        })
        .catch(error => {
            mostrarMensaje(error.message, 'error');
        });
    });

    // Manejo del formulario para editar usuario
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('edit_id').value;
        const newPassword = document.getElementById('edit_password').value;
        
        // Preparar los datos para enviar al servidor
        const userData = {
            id: userId,
            nombre: document.getElementById('edit_nombre').value,
            apellido: document.getElementById('edit_apellido').value,
            usuario: document.getElementById('edit_usuario').value,
            email: document.getElementById('edit_email').value,
            rol: document.getElementById('edit_rol').value
        };
        
        // Si hay nueva contraseña, incluirla
        if (newPassword) {
            userData.password = newPassword;
        }
        
        // Enviar los datos al servidor
        fetch('/actualizar-usuario/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Error al actualizar el usuario');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mostrarMensaje(data.message, 'success');
                closeEditModal();
                
            const filaUsuario = document.querySelector(`#tabla-usuarios tbody tr[data-id="${userId}"]`); // Seleccionar la fila por su data-id
            if (filaUsuario) {
                const usuarioActualizado = data.user;
                const celdas = filaUsuario.querySelectorAll('td');

                celdas[0].textContent = usuarioActualizado.id;
                celdas[1].textContent = usuarioActualizado.first_name;
                celdas[2].textContent = usuarioActualizado.last_name;
                celdas[3].textContent = usuarioActualizado.username;
                celdas[4].textContent = usuarioActualizado.email;
                celdas[5].textContent = usuarioActualizado.rol;
                // No actualizamos la celda de estado aquí, ya que la edición no suele cambiar el estado.
                // La celda de acciones también se mantiene igual.
            }


            // Eliminar la recarga de la página
            // setTimeout(() => {
            //     window.location.reload();
            // }, 1000);
            } else {
                mostrarMensaje(data.message, 'error');
            }
        })
        .catch(error => {
            mostrarMensaje(error.message, 'error');
        });
    });

    // Cerrar modales al hacer clic fuera de ellos
    window.onclick = function(event) {
        if (event.target === document.getElementById('addUserModal')) {
            closeAddModal();
        } else if (event.target === document.getElementById('editUserModal')) {
            closeEditModal();
        }
    };
});