// JavaScript para manejar el menu desplegable
document.addEventListener("DOMContentLoaded", function() {
    const menuItems = document.querySelectorAll('.menu ul li');

    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const submenu = this.querySelector('.submenu');
            if (submenu) {
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
});
