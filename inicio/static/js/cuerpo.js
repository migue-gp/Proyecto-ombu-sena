

// Script para el carrusel de productos
document.addEventListener('DOMContentLoaded', function() {
    const cursor = document.getElementById('cursor');
    const leftArrow = document.getElementById('left-arrow');
    const rightArrow = document.getElementById('right-arrow');
    const cardItems = document.querySelectorAll('.card-item');

    // Configuración del desplazamiento
    const scrollAmount = 250;

    // Navegación con flechas
    leftArrow.addEventListener('click', function() {
        cursor.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    rightArrow.addEventListener('click', function() {
        cursor.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Redirección al hacer clic en las tarjetas
    cardItems.forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                window.location.href = url;
            }
        });
    });

    // Navegación con teclado para accesibilidad
    cursor.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            cursor.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowRight') {
            cursor.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    });
});



document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');
    
    // Toggle menu cuando se hace clic en el botón hamburguesa
    menuToggle.addEventListener('click', function() {
      mainMenu.classList.toggle('active');
    });
    
    // Cerrar menú cuando se hace clic en un enlace
    const menuLinks = document.querySelectorAll('.link');
    menuLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 600) {
          mainMenu.classList.remove('active');
        }
      });
    });
    
    // Cerrar menú si se hace clic fuera de él
    document.addEventListener('click', function(event) {
      const isClickInsideMenu = mainMenu.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);
      
      if (!isClickInsideMenu && !isClickOnToggle && mainMenu.classList.contains('active')) {
        mainMenu.classList.remove('active');
      }
    });
  });


// JavaScript para el menú desplegable en escritorio (para que aparezca y desaparezca al subir y bajar el scroll)
document.addEventListener("DOMContentLoaded", () => {
    const menuContainer = document.querySelector(".menu-container");
    const main = document.querySelector("main");
    let lastScrollTop = 0;

    function handleScroll() {
        // Verifica el ancho de la pantalla para aplicar solo en escritorio
        if (window.innerWidth <= 767) {
            menuContainer.classList.remove("menu-fixed", "menu-hidden");
            return;
        }

        let currentScrollTop = main.scrollTop || document.documentElement.scrollTop;

        if (currentScrollTop > 150) {
            menuContainer.classList.add("menu-fixed");
        } else {
            menuContainer.classList.remove("menu-fixed");
        }

        if (currentScrollTop > lastScrollTop) {
            menuContainer.classList.add("menu-hidden"); // Oculta al bajar
        } else {
            menuContainer.classList.remove("menu-hidden"); // Muestra al subir
        }

        lastScrollTop = currentScrollTop;
    }

    // Agrega el evento de scroll al `main` en lugar de `window`
    window.addEventListener("scroll", handleScroll);
});

// loader

window.addEventListener('load', function () {
  setTimeout(() => {
    document.getElementById('loader').style.opacity = '0';
    document.getElementById('loader').style.visibility = 'hidden';
    document.querySelector('.contenido').style.visibility = 'visible';
  }, 1000); // 1000 ms = 1 segundo
});


// buscador


