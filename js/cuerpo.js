 // Script para la barra de navegación fija
 window.addEventListener('scroll', function() {
    const header = document.getElementById('navbar');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Script para el carrusel de productos
document.addEventListener('DOMContentLoaded', () => {
    // --- Carrusel ---
    const cursor = document.getElementById('cursor');
    const leftArrow = document.getElementById('left-arrow');
    const rightArrow = document.getElementById('right-arrow');
    const cardItems = document.querySelectorAll('.card-item');

    // Ancho de un ítem (220px) + gap (20px)
    const itemWidth = 240;

    // Función para desplazar el carrusel
    function scrollCarousel(direction) {
        const currentScroll = cursor.scrollLeft;
        let newScroll;

        if (direction === 'left') {
            newScroll = currentScroll - itemWidth;
        } else {
            newScroll = currentScroll + itemWidth;
        }

        cursor.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });
    }

    // Actualizar estado de los botones
    function updateButtonStates() {
        leftArrow.disabled = cursor.scrollLeft <= 0;
        rightArrow.disabled = cursor.scrollLeft >= cursor.scrollWidth - cursor.clientWidth;
    }

    // Eventos de los botones
    leftArrow.addEventListener('click', () => {
        scrollCarousel('left');
        updateButtonStates();
    });

    rightArrow.addEventListener('click', () => {
        scrollCarousel('right');
        updateButtonStates();
    });

    // Actualizar estado inicial
    updateButtonStates();

    // Actualizar al desplazar manualmente
    cursor.addEventListener('scroll', updateButtonStates);

    // Hacer los ítems clicables con anclajes
// Hacer los ítems clicables con anclajes o redirecciones
cardItems.forEach(card => {
    card.addEventListener('click', () => {
        const anchor = card.getAttribute('data-anchor');
        const url = card.getAttribute('data-url');

        if (url) {
            // Redirigir a la URL si existe
            window.location.href = url;
        } else if (anchor) {
            // Desplazar a la sección si existe un anclaje
            const section = document.querySelector(anchor);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

    // Navegación con teclado
    cursor.setAttribute('tabindex', '0');
    cursor.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            scrollCarousel('left');
            updateButtonStates();
        } else if (e.key === 'ArrowRight') {
            scrollCarousel('right');
            updateButtonStates();
        }
    });

    // --- Barra de navegación ---
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');

    // Reducir la barra de navegación
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('shrink');
        } else {
            navbar.classList.remove('shrink');
        }
    }

    // Inicializar estado
    handleScroll();
    window.addEventListener('scroll', handleScroll);

    // Menú hamburguesa
    menuToggle.addEventListener('click', () => {
        mainMenu.classList.toggle('show');
    });

    // Cerrar menú al hacer clic en un enlace
    const menuLinks = document.querySelectorAll('.link');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 600) {
                mainMenu.classList.remove('show');
            }
        });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = mainMenu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle && mainMenu.classList.contains('show')) {
            mainMenu.classList.remove('show');
        }
    });
});