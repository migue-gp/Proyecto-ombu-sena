document.addEventListener("DOMContentLoaded", () => {
    // === Variables globales (centralizadas) ===
    let cart = JSON.parse(localStorage.getItem('cart')) || []; // Recuperar carrito desde localStorage
    let cartOpen = false;
    let currentProductData = {
        card: null,
        options: {},
        currentPrice: 0,
        currentPriceDisplay: '',
        basePrice: 0
    };
    // Obtener el mesaId y mesaNumero de la URL al cargar la página
    let mesaIdActiva = getUrlParameter('mesa_id') || localStorage.getItem('mesaActivaId');
    let mesaNumeroActivo = getUrlParameter('mesa_numero') || localStorage.getItem('mesaActivaNumero');
    // Referencias a elementos del DOM
    const modalPrice = document.createElement('div');
    const cards = document.querySelectorAll(".card");
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalImage = document.getElementById("modal-image");
    const modalSelect = document.getElementById("modal-select");
    const closeModal = document.querySelector(".close");
    const modalAvailableQuantity = document.getElementById("modal-available-quantity");
    let modalAddToCartBtn = document.getElementById("modal-add-to-cart");
    if (!modalAddToCartBtn) {
        modalAddToCartBtn = document.createElement('button');
        modalAddToCartBtn.id = 'modal-add-to-cart';
        modalAddToCartBtn.textContent = 'Agregar al carrito';
        modalAddToCartBtn.style.marginTop = '15px';
        modalAddToCartBtn.style.width = '100%';
        modalAddToCartBtn.classList.add('button');
    }

    const modalInfo = modal.querySelector('.modal-info');
    if (modalInfo && modalTitle) {
        modalInfo.insertBefore(modalPrice, modalTitle.nextSibling);
        if (!document.getElementById("modal-add-to-cart")) {
            modalInfo.appendChild(modalAddToCartBtn);
        }
    }

    const cartIcon = document.getElementById('cart-icon');
    const cartContainer = document.getElementById('cart-container');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItems = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const cartCount = document.getElementById('cart-count');
    const checkoutButton = document.getElementById('checkout-button');
    const emptyCartButton = document.getElementById('empty-cart');

    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    document.body.appendChild(overlay);

    const cartIconContainer = document.querySelector('.cart-icon-container');

    // MODIFICACIÓN CLAVE EN updateModalAvailableQuantity
    function updateModalAvailableQuantity() {
        console.log("updateModalAvailableQuantity called");
        if (currentProductData.card && modalAvailableQuantity && modalAddToCartBtn) {
            const initialBackendQuantity = parseInt(currentProductData.card.dataset.cantidadDisponible);
            const productId = currentProductData.card.dataset.id;
            
            const itemInCart = cart.find(item => item.id == productId && (item.option === 'Regular' || !item.option));
            const quantityInCart = itemInCart ? itemInCart.quantity : 0;

            const remainingQuantity = initialBackendQuantity - quantityInCart;
            currentProductData.card.dataset.cantidadDisponibleActual = remainingQuantity; 

            console.log(`Modal Product ID: ${productId}, Initial Backend Quantity: ${initialBackendQuantity}, In Cart: ${quantityInCart}, Remaining for purchase: ${remainingQuantity}`);

            let textToDisplay;
            if (remainingQuantity > 0) {
                textToDisplay = `Cantidad disponible: ${remainingQuantity}`;
                modalAddToCartBtn.disabled = false;
                modalAddToCartBtn.textContent = 'Agregar al carrito';
                modalAddToCartBtn.classList.remove('product-disabled-btn');
                modalAddToCartBtn.classList.add('button');
                modalAvailableQuantity.removeAttribute('data-status'); // Quita el atributo
            } else {
                textToDisplay = `No hay unidades disponibles.`; // Mensaje definitivo
                modalAddToCartBtn.disabled = true;
                modalAddToCartBtn.textContent = 'No disponible'; // Texto del botón
                modalAddToCartBtn.classList.add('product-disabled-btn');
                modalAddToCartBtn.classList.remove('button');
                modalAvailableQuantity.setAttribute('data-status', 'unavailable'); // Añade el atributo
            }
            modalAvailableQuantity.textContent = textToDisplay;
            console.log("Text applied to modal-available-quantity:", textToDisplay);
        } else {
            console.log("updateModalAvailableQuantity: currentProductData.card, modalAvailableQuantity, or modalAddToCartBtn is null/undefined.");
            if (!currentProductData.card) console.log("currentProductData.card is null/undefined.");
            if (!modalAvailableQuantity) console.log("modalAvailableQuantity is null/undefined.");
            if (!modalAddToCartBtn) console.log("modalAddToCartBtn is null/undefined.");
        }
    }

    if (checkoutButton && mesaNumeroActivo) {
        checkoutButton.textContent = "Agregar al pedido de mesa " + mesaNumeroActivo;
    } else if (checkoutButton) {
        checkoutButton.textContent = "Agregar al pedido";
    }

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function updateCartStorage() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function closeCart() {
        cartContainer.classList.remove('open');
        overlay.style.display = 'none';
        cartOpen = false;
        // MUESTRA EL ÍCONO DEL CARRITO cuando el menú se cierra
        if (cartIconContainer) { // Asegura que el elemento exista antes de intentar modificarlo
            cartIconContainer.classList.remove('cart-icon-hidden');
        }
    }

    const menuLinks = document.querySelectorAll('.main-nav a');
    menuLinks.forEach(link => {
        const originalHref = link.getAttribute('href');
        if (originalHref && !originalHref.startsWith('#') && !originalHref.includes('?')) {
            if (mesaIdActiva && mesaNumeroActivo) {
                link.href = `${originalHref}?mesa_id=${mesaIdActiva}&mesa_numero=${mesaNumeroActivo}`;
            }
        }
    });

    modalPrice.className = 'modal-price';
    modalPrice.style.fontWeight = 'bold';
    modalPrice.style.fontSize = '1.2rem';
    modalPrice.style.margin = '10px 0';
    modalPrice.style.color = '#20AB47';

    function updateCardButtonState(card) {
        const addButton = card.querySelector('.add-to-cart-btn');
        const quantitySpan = card.querySelector('.product-available-quantity'); 
    
        const productId = card.dataset.id;
        const initialAvailableQuantityFromBackend = parseInt(card.dataset.cantidadDisponible); 
    
        const itemInCart = cart.find(item => item.id == productId && (item.option === 'Regular' || !item.option)); 
        const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    
        // Calcula la cantidad restante para mostrar en la tarjeta y para la lógica de habilitar/deshabilitar
        const remainingQuantity = initialAvailableQuantityFromBackend - quantityInCart;
        card.dataset.cantidadDisponibleActual = remainingQuantity; // Actualiza este dataset para el modal y otras funciones
        console.log(`Card ${productId} updated: initial=${initialAvailableQuantityFromBackend}, inCart=${quantityInCart}, remaining=${remainingQuantity}`);
    
        if (quantitySpan) {
            if (remainingQuantity > 0) {
                quantitySpan.textContent = `Disponible: ${remainingQuantity}`;
                quantitySpan.style.color = ''; 
            } else {
                quantitySpan.textContent = `No disponible`;
                quantitySpan.style.color = '#e74c3c'; 
            }
        }
    
        if (!addButton) return;
    
        // La condición para deshabilitar el botón: si la cantidad en el carrito ya es igual o mayor al STOCK INICIAL
        if (quantityInCart >= initialAvailableQuantityFromBackend) { // <--- CAMBIO CLAVE AQUÍ
            addButton.innerHTML = 'No disponible';
            addButton.disabled = true;
            addButton.classList.add('product-disabled-btn');
            addButton.classList.remove('product-action-btn');
        } else {
            addButton.innerHTML = '<span class="button-text">+</span>';
            addButton.disabled = false;
            addButton.classList.remove('product-disabled-btn');
            addButton.classList.add('product-action-btn');
        }
    }

    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart-btn') && !e.target.closest('.add-to-cart-btn').disabled) {
            const button = e.target.closest('.add-to-cart-btn');
            const card = button.closest('.card');

            if (card.id === 'modal-card') return; 

            e.stopPropagation();

            const productId = card.dataset.id;
            const imgSrc = card.querySelector('img').src;
            const title = card.querySelector('.main-card > span').textContent;
            const priceElement = card.querySelector('.footer-card > span');
            const price = parseFloat(priceElement.textContent.replace(/[^0-9.-]+/g, '')) || 0;
            
            // Cantidad inicial disponible del backend (stock total)
            const initialBackendQuantity = parseInt(card.dataset.cantidadDisponible); // <--- OBTENER ESTE VALOR

            console.log("--- Intento de agregar desde tarjeta ---");
            console.log("Product ID:", productId);
            console.log("Cantidad disponible inicial (dataset.cantidadDisponible):", initialBackendQuantity);

            const existingItemIndex = cart.findIndex(item => item.id == productId && item.option === 'Regular'); 
            const currentQuantityInCart = existingItemIndex !== -1 ? cart[existingItemIndex].quantity : 0;
            console.log("Cantidad actual en el carrito para este producto:", currentQuantityInCart);
            // <--- CAMBIO CLAVE AQUÍ: La condición para permitir añadir
            if (currentQuantityInCart >= initialBackendQuantity) { // Comparar con el stock total del backend
                console.warn("ALERTA: Cantidad en carrito (" + currentQuantityInCart + ") ya es >= al stock total (" + initialBackendQuantity + ")");
                alert('No hay más unidades disponibles de este producto.');
                updateCardButtonState(card); // Asegura que el estado del botón se actualice si la alerta se muestra
                return;
            }

            if (existingItemIndex !== -1) {
                cart[existingItemIndex].quantity += 1;
                console.log("Cantidad incrementada en carrito. Nueva cantidad:", cart[existingItemIndex].quantity);
            } else {
                const cartItem = {
                    id: productId,
                    imgSrc,
                    title,
                    price,
                    priceDisplay: priceElement.textContent,
                    quantity: 1,
                    option: 'Regular' 
                };
                cart.push(cartItem);
                console.log("Producto agregado al carrito por primera vez.");
            }
            updateCartDisplay();
            console.log("Estado del carrito después de agregar:", JSON.stringify(cart));

            if (modal.style.display === "flex" && currentProductData.card && currentProductData.card.dataset.id == productId) {
                console.log("Updating modal quantity after '+' button click");
                updateModalAvailableQuantity();
            }
        }
    });

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('ver-mas-btn') || e.target.closest('.add-to-cart-btn')) {
                return;
            }

            const title = card.getAttribute('data-title') || card.querySelector('.main-card > span').textContent;
            const imgSrc = card.getAttribute('data-image') || card.querySelector('img').src;
            const description = card.querySelector('.truncated-text').textContent;
            const priceElement = card.querySelector('.footer-card > span');
            const basePrice = priceElement ? priceElement.textContent : '$0';
            const basePriceValue = parseFloat(basePrice.replace(/[^0-9.-]+/g, '')) || 0;

            const modalDescription = document.getElementById('modal-description');
            if (modalDescription) {
                modalDescription.textContent = description;
            }

            currentProductData.card = card;
            currentProductData.basePrice = basePriceValue;
            currentProductData.currentPrice = basePriceValue;
            currentProductData.currentPriceDisplay = basePrice;

            currentProductData.options = {
                'Regular': {
                    price: basePriceValue,
                    priceDisplay: basePrice
                }
            };

            modalTitle.textContent = title;
            modalImage.src = imgSrc;
            modalImage.alt = title;
            modalPrice.textContent = basePrice;

            modalSelect.innerHTML = '';
            try {
                const options = card.getAttribute('data-options');
                if (options) {
                    const optionsArray = options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
                    optionsArray.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        modalSelect.appendChild(optionElement);

                        currentProductData.options[option] = {
                            price: basePriceValue,
                            priceDisplay: basePrice
                        };
                    });
                } else {
                    const optionElement = document.createElement('option');
                    optionElement.value = "Regular";
                    optionElement.textContent = "Regular";
                    modalSelect.appendChild(optionElement);
                }
            } catch (e) {
                console.error("Error al analizar opciones:", e);
                const optionElement = document.createElement('option');
                optionElement.value = "Regular";
                optionElement.textContent = "Regular";
                modalSelect.appendChild(optionElement);
            }

            modal.style.display = "flex";
            console.log("Modal opened, calling updateModalAvailableQuantity()"); 
            updateModalAvailableQuantity();
        });
    });

    modalSelect.addEventListener('change', function() {
        const selectedOption = this.value;
        if (currentProductData.options && currentProductData.options[selectedOption]) {
            modalPrice.textContent = currentProductData.options[selectedOption].priceDisplay;
            currentProductData.currentPrice = currentProductData.options[selectedOption].price;
            currentProductData.currentPriceDisplay = currentProductData.options[selectedOption].priceDisplay;
        }
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    cartIcon.addEventListener('click', function() {
        cartContainer.classList.add('open');
        overlay.style.display = 'block';
        cartOpen = true;
        // OCULTA EL ÍCONO DEL CARRITO cuando el menú se abre
        if (cartIconContainer) { // Asegura que el elemento exista antes de intentar modificarlo
            cartIconContainer.classList.add('cart-icon-hidden');
        }
    });

    closeCartBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    modalAddToCartBtn.addEventListener('click', function() {
        const title = modalTitle.textContent;
        const imgSrc = modalImage.src;
        const productId = currentProductData.card.dataset.id;
        
        // Cantidad inicial disponible del backend (stock total)
        const initialBackendQuantity = parseInt(currentProductData.card.dataset.cantidadDisponible); // <--- OBTENER ESTE VALOR
        
        console.log("--- Intento de agregar desde modal ---");
        console.log("Product ID:", productId);
        console.log("Cantidad disponible inicial (dataset.cantidadDisponible):", initialBackendQuantity);

        let option = 'Regular';
        if (modalSelect && modalSelect.value) {
            option = modalSelect.value;
        }

        const price = currentProductData.currentPrice;
        const priceDisplay = currentProductData.currentPriceDisplay;

        const existingItemIndex = cart.findIndex(item => item.id == productId && item.option === option);
        const currentQuantityInCart = existingItemIndex !== -1 ? cart[existingItemIndex].quantity : 0;
        console.log("Cantidad actual en el carrito para este producto (modal):", currentQuantityInCart);

        // <--- CAMBIO CLAVE AQUÍ: La condición para permitir añadir
        if (currentQuantityInCart >= initialBackendQuantity) { // Comparar con el stock total del backend
            console.warn("ALERTA (modal): Cantidad en carrito (" + currentQuantityInCart + ") ya es >= al stock total (" + initialBackendQuantity + ")");
            alert('No hay más unidades disponibles de este producto.');
            return;
        }

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
            console.log("Cantidad incrementada en carrito (modal). Nueva cantidad:", cart[existingItemIndex].quantity);
        } else {
            const cartItem = {
                id: productId,
                imgSrc,
                title,
                price: price,
                priceDisplay: priceDisplay,
                quantity: 1,
                option
            };
            cart.push(cartItem);
            console.log("Producto agregado al carrito por primera vez (modal).");
        }
        updateCartDisplay();
        modal.style.display = 'none'; 
        console.log("Estado del carrito después de agregar (modal):", JSON.stringify(cart));

        cartCount.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
            cartContainer.classList.add('open');
            overlay.style.display = 'block';
            cartOpen = true;
            // OCULTA EL ÍCONO DEL CARRITO cuando el menú se abre al añadir desde el modal
            if (cartIconContainer) {
                cartIconContainer.classList.add('cart-icon-hidden');
            }
        }, 300);
    });
    
    // === Finalizar compra ===
    checkoutButton.addEventListener('click', async function() {
        if (cart.length === 0) {
            alert('Su carrito está vacío');
            return;
        }

        if (!mesaIdActiva || !mesaNumeroActivo) {
            alert('No se pudo identificar la mesa activa. Por favor, asegúrese de haber seleccionado una mesa.');
            return;
        }

        // --- INICIO DE LA LÓGICA REEMPLAZADA EN script_menu.js ---
        // Simplemente guarda el carrito en el localStorage de la mesa
        const clavePedidoMesa = `pedido_mesa_${mesaIdActiva}`;
        const pedidosExistentes = JSON.parse(localStorage.getItem(clavePedidoMesa)) || [];

        cart.forEach(newItem => {
            const existingItem = pedidosExistentes.find(
                p => p.id == newItem.id && p.option === newItem.option
            );
            if (existingItem) {
                existingItem.quantity += newItem.quantity;
            } else {
                // Adaptar el formato del carrito al formato del pedido de mesa
                pedidosExistentes.push({
                    id: newItem.id,
                    title: newItem.title,
                    price: newItem.price,
                    imgSrc: newItem.imgSrc,
                    quantity: newItem.quantity,
                    option: newItem.option || 'Regular'
                });
            }
        });
        localStorage.setItem(clavePedidoMesa, JSON.stringify(pedidosExistentes));
        // --- FIN DE LA LÓGICA REEMPLAZADA EN script_menu.js ---

        // Mostrar mensaje de confirmación al cliente
        const totalCarrito = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        alert(`Productos agregados al pedido de la Mesa ${mesaNumeroActivo}.\nTotal agregado: $${totalCarrito.toFixed(3)}\n\nPara finalizar el pedido, vaya a la vista de mesas.`);

        // Limpiar el carrito local del cliente
        cart = [];
        updateCartDisplay();
        closeCart();
        localStorage.removeItem('cart');

        if (confirm('¿Desea volver a la página de mesas para ver el pedido?')) {
            window.location.href = `/mesas/?mesa_id=${mesaIdActiva}&mesa_numero=${mesaNumeroActivo}`;
        }
    });

    emptyCartButton.addEventListener('click', function() {
        if (confirm('¿Está seguro que desea vaciar el carrito?')) {
            cart = [];
            updateCartDisplay(); 
        }
    });

    function updateCartDisplay() {
        cartItems.innerHTML = '';

        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;

        if (totalItems === 0) {
            cartCount.classList.add('cart-icon-hidden');
        } else {
            cartCount.classList.remove('cart-icon-hidden');
        }
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart-message" style="text-align: center; padding: 20px; color: #aaa;">Su carrito está vacío</div>';
            cartTotalAmount.textContent = '$0';
            cards.forEach(card => updateCardButtonState(card)); 
            if (modal.style.display === "flex" && currentProductData.card) {
                updateModalAvailableQuantity();
            }
            return;
        }
        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.imgSrc}" alt="${item.title}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-option">${item.option}</div>
                    <div class="cart-item-price">$${item.price.toFixed(3)}</div>

                    <div class="cart-item-controls">
                        <div class="cart-item-quantity-control">
                            <button class="quantity-btn decrease-quantity" data-id="${item.id}" data-option="${item.option}">-</button>
                            <span class="cart-quantity">${item.quantity}</span>
                            <button class="quantity-btn increase-quantity" data-id="${item.id}" data-option="${item.option}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}" data-option="${item.option}">Eliminar</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItemElement);
        });
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalAmount.textContent = `$${total.toFixed(3)}`;

        updateCartStorage();

        cards.forEach(card => {
            updateCardButtonState(card);
        });

        if (modal.style.display === "flex" && currentProductData.card) {
            console.log("Updating modal quantity from updateCartDisplay()");
            updateModalAvailableQuantity();
        }

        cartItems.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const option = this.getAttribute('data-option');
                const item = cart.find(i => i.id == id && i.option === option);
                if (item) {
                    const card = document.querySelector(`.card[data-id="${id}"]`);
                    // <--- CAMBIO CLAVE AQUÍ: Usar initialBackendQuantity (stock total)
                    const initialBackendQuantity = parseInt(card.dataset.cantidadDisponible); 
                
                    console.log("--- Intento de aumentar desde carrito ---");
                    console.log("Product ID:", id);
                    console.log("Cantidad actual en carrito:", item.quantity);
                    console.log("Stock total disponible:", initialBackendQuantity);

                    if (item.quantity < initialBackendQuantity) { // Comparar con el stock total
                        item.quantity += 1;
                        console.log("Cantidad aumentada. Nueva cantidad en carrito:", item.quantity);
                    } else {
                        console.warn("ALERTA: Cantidad en carrito (" + item.quantity + ") ya es >= al stock total (" + initialBackendQuantity + ")");
                        alert('No hay más unidades disponibles de este producto.');
                    }
                    updateCartDisplay();
                    if (modal.style.display === "flex" && currentProductData.card && currentProductData.card.dataset.id == id) {
                        console.log("Updating modal quantity after increase-quantity");
                        updateModalAvailableQuantity();
                    }
                }
            });
        });
        cartItems.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const option = this.getAttribute('data-option');
                const itemIndex = cart.findIndex(i => i.id == id && i.option === option);
                if (itemIndex !== -1) {
                    if (cart[itemIndex].quantity > 1) {
                        cart[itemIndex].quantity -= 1;
                    } else {
                        cart.splice(itemIndex, 1);
                    }
                    updateCartDisplay();
                    if (modal.style.display === "flex" && currentProductData.card && currentProductData.card.dataset.id == id) {
                        updateModalAvailableQuantity();
                    }
                }
            });
        });
        cartItems.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const option = this.getAttribute('data-option');
                const itemIndex = cart.findIndex(i => i.id == id && i.option === option);
                if (itemIndex !== -1) {
                    cart.splice(itemIndex, 1);
                    updateCartDisplay();
                    if (modal.style.display === "flex" && currentProductData.card && currentProductData.card.dataset.id == id) {
                        console.log("Updating modal quantity after remove-item");
                        updateModalAvailableQuantity();
                    }
                }
            });
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');
    const hamburgerBtn = document.querySelector('.hamburger-btn');

    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', function() {
            mainMenu.classList.toggle('active');
            if (hamburgerBtn) {
                hamburgerBtn.classList.toggle('active');
            }
        });
        document.querySelectorAll('.link').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 600) {
                    mainMenu.classList.remove('active');
                    if (hamburgerBtn) {
                        hamburgerBtn.classList.remove('active');
                    }
                }
            });
        });
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = mainMenu.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            const isClickOnHamburgerBtn = hamburgerBtn && hamburgerBtn.contains(event.target);

            if (!isClickInsideMenu && !isClickOnToggle && !isClickOnHamburgerBtn && mainMenu.classList.contains('active')) {
                mainMenu.classList.remove('active');
                if (hamburgerBtn) {
                    hamburgerBtn.classList.remove('active');
                }
            }
        });
    }
    const menuContainer = document.querySelector(".menu-container");
    const mainContentArea = document.querySelector("main");
    if (menuContainer && mainContentArea) {
        let lastScrollTop = 0;
        function handleScroll() {
            if (window.innerWidth <= 767) {
                menuContainer.classList.remove("menu-fixed", "menu-hidden");
                return;
            }

            let currentScrollTop = mainContentArea.scrollTop || document.documentElement.scrollTop;

            if (currentScrollTop > 350) {
                menuContainer.classList.add("menu-fixed");
            } else {
                menuContainer.classList.remove("menu-fixed");
            }

            if (currentScrollTop > lastScrollTop) {
                menuContainer.classList.add("menu-hidden");
            } else {
                menuContainer.classList.remove("menu-hidden");
            }
            lastScrollTop = currentScrollTop;
        }
        mainContentArea.addEventListener("scroll", handleScroll);
        window.addEventListener("scroll", handleScroll);
    }
    updateCartDisplay();
});