document.addEventListener('DOMContentLoaded', function() {
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userMenu = document.querySelector('.user-menu');
    const userMenuContainer = document.querySelector('.user-menu-container'); // Importante: Referencia al contenedor

    userMenuToggle.addEventListener('click', function() {
        userMenu.classList.toggle('show');
    });

    // Esto permite cerrar 
    document.addEventListener('click', function(event) {
        if (!userMenuContainer.contains(event.target)) {
            userMenu.classList.remove('show');
        }
    });
});