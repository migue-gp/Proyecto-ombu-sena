document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');
    const menuContainer = document.querySelector(".menu-container"); // Obtén el contenedor del menú
    let lastScrollTop = 0; // Para la detección de scroll

    // --- Alternar Menú Móvil ---
    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', function() {
            mainMenu.classList.toggle('active');
            // Evita el scroll del cuerpo cuando el menú móvil está abierto
            document.body.classList.toggle('no-scroll');
        });

        // Cerrar menú cuando se hace clic en un enlace (en móvil)
        const menuLinks = document.querySelectorAll('.link');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) { // Usa 768px para consistencia con la media query CSS
                    mainMenu.classList.remove('active');
                    document.body.classList.remove('no-scroll'); // Volver a habilitar el scroll
                }
            });
        });

        // Cerrar menú si se hace clic fuera de él (en móvil)
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = mainMenu.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);

            if (!isClickInsideMenu && !isClickOnToggle && mainMenu.classList.contains('active')) {
                mainMenu.classList.remove('active');
                document.body.classList.remove('no-scroll'); // Volver a habilitar el scroll
            }
        });
    }

    // // --- Ocultar/Mostrar Menú de Escritorio al Hacer Scroll ---
    // // Escucha el scroll de la ventana, ya que el cuerpo es donde ocurre el desbordamiento para el scroll de página completa
    // window.addEventListener("scroll", function() {
    //     // Aplica solo en escritorio
    //     if (window.innerWidth > 768) { // Usa 768px para consistencia con la media query CSS
    //         let currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    //         if (currentScrollTop > 1) { // Cuando se ha hecho scroll más de 150px
    //             menuContainer.classList.add("menu-fixed"); // Mantiene fijo
    //             if (currentScrollTop > lastScrollTop) {
    //                 // Bajando el scroll
    //                 menuContainer.classList.add("menu-hidden");
    //             } else {
    //                 // Subiendo el scroll
    //                 menuContainer.classList.remove("menu-hidden");
    //             }
    //         } else {
    //             // En la parte superior de la página
    //             menuContainer.classList.remove("menu-fixed", "menu-hidden");
    //         }

    //         lastScrollTop = currentScrollTop;
    //     } else {
    //         // Asegura que las clases se eliminen al cambiar a móvil
    //         menuContainer.classList.remove("menu-fixed", "menu-hidden");
    //     }
    // });

    // Maneja el estado inicial al cargar la página y al redimensionar la ventana
    function handleResize() {
        if (window.innerWidth <= 768) {
            // En móvil, asegura que las clases de scroll de escritorio estén desactivadas
            menuContainer.classList.remove("menu-fixed", "menu-hidden");
        } else {
            // En escritorio, asegura que el menú móvil esté cerrado
            mainMenu.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Llama al cargar para establecer el estado inicial
});