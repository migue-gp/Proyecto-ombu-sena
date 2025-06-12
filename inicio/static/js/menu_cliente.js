document.addEventListener("DOMContentLoaded", () => {
    // Variables globales
    let currentProductData = {
        card: null,
        options: {},
        currentPrice: 0,
        currentPriceDisplay: '',
        basePrice: 0
    };

    const cards = document.querySelectorAll(".card");
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalImage = document.getElementById("modal-image");
    const modalSelect = document.getElementById("modal-select");
    const closeModal = document.querySelector(".close");

    // Crear elemento para mostrar el precio en el modal
    const modalPrice = document.createElement('div');
    modalPrice.className = 'modal-price';
    modalPrice.style.fontWeight = 'bold';
    modalPrice.style.fontSize = '1.2rem';
    modalPrice.style.margin = '10px 0';
    modalPrice.style.color = '#20AB47';

    // Funcionalidad del modal

    
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
    
            
                // Obtener datos del producto
                const title = card.getAttribute('data-title') || card.querySelector('.main-card > span').textContent;
                const imgSrc = card.getAttribute('data-image') || card.querySelector('img').src;
                
                // Obtener precio base de la tarjeta
                const priceElement = card.querySelector('.footer-card > span');
                const basePrice = priceElement ? priceElement.textContent : '$0';
                const basePriceValue = parseInt(basePrice.replace(/\D/g, '')) || 0;
                
                // Guardar referencia a la tarjeta actual y precio base
                currentProductData.card = card;
                currentProductData.basePrice = basePriceValue;
                currentProductData.currentPrice = basePriceValue;
                currentProductData.currentPriceDisplay = basePrice;
                
                // Inicializar opciones con precio predeterminado
                currentProductData.options = {
                    'Regular': {
                        price: basePriceValue,
                        priceDisplay: basePrice
                    }
                };
                
                // Actualizar el contenido del modal
                modalTitle.textContent = title;
                modalImage.src = imgSrc;
                modalImage.alt = title;
                modalPrice.textContent = basePrice;
                
                // Manejar opciones de precios
                modalSelect.innerHTML = '';
                
                try {
                    // Verificar si hay opciones para este producto
                  const options = card.getAttribute('data-options');
                  if (options) {
                    const optionsArray = options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                    optionsArray.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        modalSelect.appendChild(optionElement);

                        // Establecer el mismo precio para todas las opciones
                        currentProductData.options[option] = {
                            price: basePriceValue,
                            priceDisplay: basePrice
                        };
                    });
                
                    } else {
                        // Opción predeterminada si no hay data-options
                        const optionElement = document.createElement('option');
                        optionElement.value = "Regular";
                        optionElement.textContent = "Regular";
                        modalSelect.appendChild(optionElement);
                    }
                } catch (e) {
                    console.error("Error al analizar opciones:", e);
                    // Opción alternativa
                    const optionElement = document.createElement('option');
                    optionElement.value = "Regular";
                    optionElement.textContent = "Regular";
                    modalSelect.appendChild(optionElement);
                }
                
                // Mostrar el modal
                modal.style.display = "flex";
            });
        });
        
        // Evento de cambio de opción en el modal
        modalSelect.addEventListener('change', function() {
            const selectedOption = this.value;
            if (currentProductData.options && currentProductData.options[selectedOption]) {
                // Actualizar el precio mostrado con el precio para esta opción
                modalPrice.textContent = currentProductData.options[selectedOption].priceDisplay;
                currentProductData.currentPrice = currentProductData.options[selectedOption].price;
                currentProductData.currentPriceDisplay = currentProductData.options[selectedOption].priceDisplay;
            }
        });
        
        // Cerrar el modal
        closeModal.addEventListener('click', () => {
            modal.style.display = "none";
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });


// JavaScript para el menú hamburguesa

document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const mainMenu = document.getElementById('mainMenu');

  menuToggle.addEventListener('click', function() {
    mainMenu.classList.toggle('active');
    console.log("Clase actual:", mainMenu.className);
  });

  const menuLinks = document.querySelectorAll('.link');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 600) {
        mainMenu.classList.remove('active');
      }
    });
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

        if (currentScrollTop > 350) {
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
    main.addEventListener("scroll", handleScroll);
});
document.addEventListener("DOMContentLoaded", () => {
    // Variables globales
    let currentProductData = {
        card: null,
        options: {},
        currentPrice: 0,
        currentPriceDisplay: '',
        basePrice: 0
    };

    const cards = document.querySelectorAll(".card");
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalImage = document.getElementById("modal-image");
    const modalSelect = document.getElementById("modal-select");
    const closeModal = document.querySelector(".close");

    // Crear elemento para mostrar el precio en el modal
    const modalPrice = document.createElement('div');
    modalPrice.className = 'modal-price';
    modalPrice.style.fontWeight = 'bold';
    modalPrice.style.fontSize = '1.2rem';
    modalPrice.style.margin = '10px 0';
    modalPrice.style.color = '#20AB47';

    // Funcionalidad del modal

    
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
    
            
                // Obtener datos del producto
                const title = card.getAttribute('data-title') || card.querySelector('.main-card > span').textContent;
                const imgSrc = card.getAttribute('data-image') || card.querySelector('img').src;
                
                // Obtener precio base de la tarjeta
                const priceElement = card.querySelector('.footer-card > span');
                const basePrice = priceElement ? priceElement.textContent : '$0';
                const basePriceValue = parseInt(basePrice.replace(/\D/g, '')) || 0;
                
                // Guardar referencia a la tarjeta actual y precio base
                currentProductData.card = card;
                currentProductData.basePrice = basePriceValue;
                currentProductData.currentPrice = basePriceValue;
                currentProductData.currentPriceDisplay = basePrice;
                
                // Inicializar opciones con precio predeterminado
                currentProductData.options = {
                    'Regular': {
                        price: basePriceValue,
                        priceDisplay: basePrice
                    }
                };
                
                // Actualizar el contenido del modal
                modalTitle.textContent = title;
                modalImage.src = imgSrc;
                modalImage.alt = title;
                modalPrice.textContent = basePrice;
                
                // Manejar opciones de precios
                modalSelect.innerHTML = '';
                
                try {
                    // Verificar si hay opciones para este producto
                  const options = card.getAttribute('data-options');
                  if (options) {
                    const optionsArray = options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                    optionsArray.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        modalSelect.appendChild(optionElement);

                        // Establecer el mismo precio para todas las opciones
                        currentProductData.options[option] = {
                            price: basePriceValue,
                            priceDisplay: basePrice
                        };
                    });
                
                    } else {
                        // Opción predeterminada si no hay data-options
                        const optionElement = document.createElement('option');
                        optionElement.value = "Regular";
                        optionElement.textContent = "Regular";
                        modalSelect.appendChild(optionElement);
                    }
                } catch (e) {
                    console.error("Error al analizar opciones:", e);
                    // Opción alternativa
                    const optionElement = document.createElement('option');
                    optionElement.value = "Regular";
                    optionElement.textContent = "Regular";
                    modalSelect.appendChild(optionElement);
                }
                
                // Mostrar el modal
                modal.style.display = "flex";
            });
        });
        
        // Evento de cambio de opción en el modal
        modalSelect.addEventListener('change', function() {
            const selectedOption = this.value;
            if (currentProductData.options && currentProductData.options[selectedOption]) {
                // Actualizar el precio mostrado con el precio para esta opción
                modalPrice.textContent = currentProductData.options[selectedOption].priceDisplay;
                currentProductData.currentPrice = currentProductData.options[selectedOption].price;
                currentProductData.currentPriceDisplay = currentProductData.options[selectedOption].priceDisplay;
            }
        });
        
        // Cerrar el modal
        closeModal.addEventListener('click', () => {
            modal.style.display = "none";
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });


// JavaScript para el menú hamburguesa

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

        if (currentScrollTop > 350) {
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
    main.addEventListener("scroll", handleScroll);
});



// buscador




// buscador


