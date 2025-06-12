
// Este es un ejemplo de código JS para el login
// Si necesitas añadir funcionalidad específica, puedes adaptarlo

// Esperar a que cargue el documento
document.addEventListener('DOMContentLoaded', function() {
    // Obtener la referencia al contenedor principal
    const container = document.querySelector('.container');
    
    // Botones para cambiar entre los paneles
    const loginBtn = document.querySelector('.login-btn');
    
    // Añadir eventos de click
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            container.classList.remove('active');
        });
    }
    
    // Funcionalidad para mostrar/ocultar contraseña
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            // Cambiar el tipo de input
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Cambiar el icono
            this.classList.toggle('hide');
            
            // Cambiar la clase del icono (de 'show' a 'hide' o viceversa)
            if (type === 'text') {
                this.classList.remove('bxs-show');
                this.classList.add('bxs-hide');
            } else {
                this.classList.remove('bxs-hide');
                this.classList.add('bxs-show');
            }
        });
    }
    
    // Mejorar UX en los inputs
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // Efecto al estar enfocado
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        // Quitar efecto cuando pierde foco
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
    });
    
    // Verificar si hay mensajes de error para mejorar la experiencia
    const messages = document.querySelectorAll('p[style="color:#cc0000;"]');
    if (messages.length > 0) {
        // Hacer scroll al mensaje de error
        messages[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Hacer que desaparezca después de 5 segundos
        setTimeout(() => {
            messages.forEach(message => {
                message.style.opacity = '0';
                message.style.transition = 'opacity 1s ease';
            });
        }, 5000);
    }
});
