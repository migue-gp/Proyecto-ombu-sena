// bar_filtros.js
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('filterModal');
    const openBtn = document.getElementById('openFilterModal');
    const closeBtn = document.querySelector('.close-button'); // Selector más genérico, ahora que tiene la clase en HTML
    const applyBtn = document.getElementById('applyFiltersButton');
    const resetBtn = document.getElementById('resetFiltersButton');
    const filterInputForms = document.querySelectorAll('.filter-form-input'); // Selecciona todos los formularios de input de filtro

    // Función para aplicar la clase 'active-filter' a los filtros activos
    function highlightActiveFilters() {
        const currentParams = new URLSearchParams(window.location.search);

        document.querySelectorAll('.modal-filters-body a').forEach(link => {
            const linkParams = new URLSearchParams(link.href.split('?')[1] || '');
            const listItem = link.closest('li');

            if (listItem) {
                listItem.classList.remove('active-filter');
            }

            let isLinkActive = true; 

            // Si el enlace tiene parámetros
            if (linkParams.toString()) {
                // Comprueba si todos los parámetros del enlace están presentes y coinciden en la URL actual
                linkParams.forEach((linkValue, linkKey) => {
                    if (!currentParams.has(linkKey) || currentParams.get(linkKey) !== linkValue) {
                        isLinkActive = false;
                    }
                });
                // Comprueba que no haya otros filtros activos en la URL actual (excepto 'q' y 'p')
                currentParams.forEach((currentValue, currentKey) => {
                    if (currentKey !== 'q' && currentKey !== 'p' && !linkParams.has(currentKey)) {
                        isLinkActive = false;
                    }
                });
            } else { // Si el enlace es para "Todo" / "Todas" (no tiene parámetros de filtro)
                let hasAnyFilterActive = false;
                currentParams.forEach((currentValue, currentKey) => {
                    if (currentKey !== 'q' && currentKey !== 'p') { // Excluye 'q' y 'p'
                        hasAnyFilterActive = true;
                    }
                });
                isLinkActive = !hasAnyFilterActive; // Si no hay ningún filtro activo (excepto 'q' y 'p'), este es el activo
            }

            if (isLinkActive && listItem) {
                listItem.classList.add('active-filter');
            }
        });

        // También resalta los campos de input si tienen un valor aplicado
        filterInputForms.forEach(form => {
            const input = form.querySelector('input[type="number"], input[type="date"]');
            if (input && currentParams.get(input.name)) {
                input.classList.add('active-filter-input');
            } else if (input) {
                input.classList.remove('active-filter-input');
            }
        });
    }

    // Llama a la función al cargar la página
    highlightActiveFilters();

    // Función para abrir el modal
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            if (modal) {
                modal.classList.add('is-active');
                highlightActiveFilters(); // Recalcular al abrir
            }
        });
    }

    // Función para cerrar el modal al hacer clic en la "x"
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) {
                modal.classList.remove('is-active');
            }
        });
    }

    // Función para cerrar el modal al hacer clic fuera del contenido del modal
    if (modal) {
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.classList.remove('is-active');
            }
        });
    }

    // Lógica del botón "Aplicar Filtros"
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            if (modal) {
                modal.classList.remove('is-active');
            }

            // Recopilar todos los parámetros de los formularios de input y construir la URL
            const newParams = new URLSearchParams(window.location.search);
            let currentUrl = window.location.pathname;

            // Eliminar filtros de input existentes antes de aplicar los nuevos
            filterInputForms.forEach(form => {
                form.querySelectorAll('input[type="number"], input[type="date"]').forEach(input => {
                    newParams.delete(input.name);
                });
                form.querySelectorAll('input[type="hidden"]').forEach(input => {
                    newParams.delete(input.name); // Asegura que los hidden que no sean 'q' o 'p' se limpien
                });
            });
            
            // Añadir los nuevos valores de los inputs
            filterInputForms.forEach(form => {
                form.querySelectorAll('input[type="number"], input[type="date"]').forEach(input => {
                    if (input.value) {
                        newParams.set(input.name, input.value);
                    } else {
                        newParams.delete(input.name);
                    }
                });
                form.querySelectorAll('input[type="hidden"]').forEach(input => {
                     // Solo mantener q y p, el resto son gestionados por los inputs principales
                    if (input.name !== 'q' && input.name !== 'p') {
                        newParams.set(input.name, input.value);
                    }
                });
            });

            // Reconstruir la URL
            const currentSearch = newParams.toString();
            window.location.href = currentUrl + (currentSearch ? '?' + currentSearch : '');
        });
    }

    // Lógica del botón "Reiniciar Filtros"
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (modal) {
                modal.classList.remove('is-active');
            }
            // Eliminar todos los parámetros de filtro, excepto 'q' (búsqueda)
            const currentUrl = new URL(window.location.href);
            const searchParam = currentUrl.searchParams.get('q');
            let newUrl = currentUrl.origin + currentUrl.pathname;
            if (searchParam) {
                newUrl += `?q=${searchParam}`;
            }
            window.location.href = newUrl;
        });
    }

    // Cerrar el modal con la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal && modal.classList.contains('is-active')) {
            modal.classList.remove('is-active');
        }
    });
});