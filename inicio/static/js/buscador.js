document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar elementos relevantes
    const searchInput = document.getElementById('product-search');
    const searchButton = document.getElementById('search-btn');
    const searchContainer = document.querySelector('.search-container');
    const cards = document.querySelectorAll('.card');
    
    // Variables para controlar el scroll
    let lastScrollPosition = 0;
    let isScrollingDown = false;
    
    // Función para realizar la búsqueda
    function searchProducts() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // Si no hay término de búsqueda, mostrar todas las tarjetas
        if (searchTerm === '') {
            cards.forEach(card => {
                card.style.display = 'flex';
            });
            return;
        }
        
        // Filtrar tarjetas según el término de búsqueda
        cards.forEach(card => {
            // Obtener el título del producto del atributo data-title o del span en main-card
            const title = (card.dataset.title || 
                          card.querySelector('.main-card span')?.textContent || '').toLowerCase();
            
            // Obtener la descripción del producto
            const description = (card.querySelector('.main-card p')?.textContent || '').toLowerCase();
            
            // Comprobar si el término de búsqueda coincide con el título o descripción
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex'; // Mostrar la tarjeta
            } else {
                card.style.display = 'none'; // Ocultar la tarjeta
            }
        });
    }
    
    // Evento para buscar al hacer clic en el botón
    searchButton.addEventListener('click', searchProducts);
    
    // Evento para buscar al presionar Enter en el campo de búsqueda
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchProducts();
        }
    });
    
    // Opcional: Búsqueda en tiempo real
    searchInput.addEventListener('input', function() {
        // Realizar búsqueda en tiempo real
        searchProducts();
    });
    
    // Controlar la visibilidad del buscador al hacer scroll
    window.addEventListener('scroll', function() {
        // Obtener posición actual de scroll
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Determinar dirección del scroll
        isScrollingDown = currentScrollPosition > lastScrollPosition;
        
        // Si estamos en la parte superior de la página, asegurarnos que el buscador sea visible
        if (currentScrollPosition < 50) {
            searchContainer.classList.remove('search-container-hidden');
            searchContainer.classList.add('search-container-visible');
        }
        // Controlar visibilidad basado en dirección del scroll (opcional)
         else {
            if (isScrollingDown) {
                searchContainer.classList.add('search-container-hidden');
                searchContainer.classList.remove('search-container-visible');
            } else {
                searchContainer.classList.remove('search-container-hidden');
                searchContainer.classList.add('search-container-visible');
            }
        } 
        
        // Actualizar última posición conocida
        lastScrollPosition = currentScrollPosition;
    });
});