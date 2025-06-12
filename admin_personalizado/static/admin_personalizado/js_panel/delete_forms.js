// admin_personalizado/static/admin_personalizado/js_panel/delete_forms.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('delete_forms.js cargado. (Versión con clase is-active y manejo unificado)');

    const deleteModal = document.getElementById('delete-confirmation-modal');

    if (!deleteModal) {
        console.warn('El modal de confirmación de eliminación (#delete-confirmation-modal) no se encontró en la página. El script no funcionará para este modal.');
        return;
    }

    const closeDeleteModalButton = deleteModal.querySelector('.close-button');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');
    let objectNameToDeleteSpan = document.getElementById('object-name-to-delete'); // Let para poder re-obtener
    let modalDeleteMessageParagraph = document.getElementById('modal-delete-message'); // Let para poder re-obtener

    let currentDeleteUrl = '';
    let isGlobalDelete = false;

    // Función para abrir el modal
    function openDeleteModal(objectName, deleteUrl, isGlobal = false) {
        isGlobalDelete = isGlobal;
        currentDeleteUrl = deleteUrl;

        // Siempre reinicia el HTML del párrafo para asegurar la estructura base
        if (modalDeleteMessageParagraph) {
            modalDeleteMessageParagraph.innerHTML = `¿Estás seguro de que quieres eliminar <strong id="object-name-to-delete"></strong>?`;
            // Re-obtener la referencia al span después de cambiar innerHTML
            objectNameToDeleteSpan = document.getElementById('object-name-to-delete'); 
            if (objectNameToDeleteSpan) {
                objectNameToDeleteSpan.style.display = 'inline'; // Por defecto visible
            }
        }


        if (isGlobal) {
            if (modalDeleteMessageParagraph) {
                modalDeleteMessageParagraph.textContent = objectName; // El mensaje completo ya viene en objectName
            }
            if (objectNameToDeleteSpan) {
                objectNameToDeleteSpan.style.display = 'none'; // Ocultar el span si es global
            }
        } else { // Es una eliminación individual
            if (objectNameToDeleteSpan) {
                objectNameToDeleteSpan.textContent = objectName; // Solo actualiza el nombre del objeto
                objectNameToDeleteSpan.style.display = 'inline';
            }
        }

        deleteModal.classList.add('is-active');
    }

    // Exponer la función openDeleteModal globalmente
    window.openDeleteModal = openDeleteModal;

    // Función para cerrar el modal
    function closeDeleteModal() {
        deleteModal.classList.remove('is-active');
        currentDeleteUrl = '';
        isGlobalDelete = false;

        // Reiniciar el mensaje a su estado por defecto
        if (modalDeleteMessageParagraph) {
            modalDeleteMessageParagraph.innerHTML = `¿Estás seguro de que quieres eliminar <strong id="object-name-to-delete">este elemento</strong>?`;
            objectNameToDeleteSpan = document.getElementById('object-name-to-delete'); // Re-obtener la referencia
            if (objectNameToDeleteSpan) {
                objectNameToDeleteSpan.style.display = 'inline';
            }
        }
    }

    // Asignar listeners de cierre
    if (closeDeleteModalButton) {
        closeDeleteModalButton.addEventListener('click', closeDeleteModal);
    }
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', closeDeleteModal);
    }
    window.addEventListener('click', function(event) {
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });

    // Lógica para confirmar la eliminación (AHORA UNIFICADA)
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', async function(event) {
            event.preventDefault();

            if (isGlobalDelete) {
                const changelistForm = document.getElementById('changelist-form');
                if (changelistForm) {
                    // Disparar un evento que indique que se debe enviar el formulario global
                    const confirmGlobalDeleteEvent = new CustomEvent('confirmGlobalDelete');
                    changelistForm.dispatchEvent(confirmGlobalDeleteEvent);
                }
                closeDeleteModal(); // Cierra el modal después de disparar el evento

            } else if (currentDeleteUrl) {
                // Lógica de eliminación individual (POST)
                const csrftoken = getCookie('csrftoken');

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = currentDeleteUrl;

                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrftoken;
                form.appendChild(csrfInput);

                // Django espera un campo 'post'='yes' para confirmar la eliminación
                const postInput = document.createElement('input');
                postInput.type = 'hidden';
                postInput.name = 'post'; 
                postInput.value = 'yes';
                form.appendChild(postInput);

                document.body.appendChild(form);
                form.submit(); // Envía el formulario para la eliminación individual
                closeDeleteModal(); // Cierra el modal después de enviar
            } else {
                console.error('No se pudo determinar la URL de eliminación.');
                closeDeleteModal();
            }
        });
    }

    // Listener para los botones de eliminación individuales (de la columna de acciones)
    document.querySelectorAll('a.action-delete, a.custom-delete-button').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();

            const deleteUrl = this.dataset.deleteUrl || this.href;
            let objectName = this.dataset.objectName || 'este elemento';

            if (!this.dataset.objectName && this.classList.contains('action-delete')) {
                let currentRow = this.closest('tr');
                if (currentRow) {
                    const objectLink = currentRow.querySelector('th a');
                    if (objectLink) {
                        objectName = objectLink.textContent.trim();
                    } else {
                        const firstDataCell = currentRow.querySelector('td:not(.action-checkbox)');
                        if (firstDataCell) {
                            objectName = firstDataCell.textContent.trim();
                        }
                    }
                }
            }
            openDeleteModal(objectName, deleteUrl, false); // Es una eliminación individual
        });
    });

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
});