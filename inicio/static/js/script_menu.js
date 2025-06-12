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

    function updateModalAvailableQuantity() {
        console.log("updateModalAvailableQuantity called");
        if (currentProductData.card && modalAvailableQuantity) {
            const quantity = parseInt(currentProductData.card.dataset.cantidadDisponibleActual);
            console.log("Modal Product ID:", currentProductData.card.dataset.id);
            console.log("Modal Current available quantity (from dataset.cantidadDisponibleActual):", quantity);

            let textToDisplay;
            if (quantity > 0) {
                textToDisplay = `Cantidad disponible: ${quantity}`;
                modalAddToCartBtn.disabled = false;
            } else {
                textToDisplay = `No hay unidades disponibles.`;
                modalAddToCartBtn.disabled = true;
            }
            modalAvailableQuantity.textContent = textToDisplay;
            console.log("Text applied to modal-available-quantity:", textToDisplay);
        } else {
            console.log("updateModalAvailableQuantity: currentProductData.card or modalAvailableQuantity is null/undefined.");
            if (!currentProductData.card) console.log("currentProductData.card is null/undefined.");
            if (!modalAvailableQuantity) console.log("modalAvailableQuantity is null/undefined.");
        }
    }

    if (checkoutButton && mesaNumeroActivo) {
        checkoutButton.textContent = "Finalizar compra en mesa " + mesaNumeroActivo;
    } else if (checkoutButton) {
        checkoutButton.textContent = "Finalizar compra";
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
    
        const remainingQuantity = initialAvailableQuantityFromBackend - quantityInCart;
        card.dataset.cantidadDisponibleActual = remainingQuantity; 
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
    
        if (remainingQuantity <= 0) { 
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
            const currentAvailableQuantity = parseInt(card.dataset.cantidadDisponibleActual); 

            const existingItemIndex = cart.findIndex(item => item.id == productId && item.option === 'Regular'); 
            const currentQuantityInCart = existingItemIndex !== -1 ? cart[existingItemIndex].quantity : 0;

            if (currentQuantityInCart >= currentAvailableQuantity) { 
                alert('No hay más unidades disponibles de este producto.');
                updateCardButtonState(card);
                return;
            }

            if (existingItemIndex !== -1) {
                cart[existingItemIndex].quantity += 1;
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
            }
            updateCartDisplay();

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
        const currentAvailableQuantity = parseInt(currentProductData.card.dataset.cantidadDisponibleActual); 

        let option = 'Regular';
        if (modalSelect && modalSelect.value) {
            option = modalSelect.value;
        }

        const price = currentProductData.currentPrice;
        const priceDisplay = currentProductData.currentPriceDisplay;

        const existingItemIndex = cart.findIndex(item => item.id == productId && item.option === option);
        const currentQuantityInCart = existingItemIndex !== -1 ? cart[existingItemIndex].quantity : 0;

        if (currentQuantityInCart >= currentAvailableQuantity) { 
            alert('No hay más unidades disponibles de este producto.');
            return;
        }

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
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
        }

        updateCartDisplay();
        modal.style.display = 'none'; 

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
    // *** SECCIÓN MODIFICADA: Eliminado el prompt de medio de pago ***
    checkoutButton.addEventListener('click', async function() {
        if (cart.length === 0) {
            alert('Su carrito está vacío');
            return;
        }

        if (!mesaIdActiva || !mesaNumeroActivo) {
            alert('No se pudo identificar la mesa activa. Por favor, asegúrese de haber seleccionado una mesa.');
            return;
        }

        const totalCarrito = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

        // --- PREPARAR DATOS PARA ENVIAR AL SERVIDOR ---
        // ¡IMPORTANTE! Si tu backend espera un `medio_pago` y no lo proporcionas aquí,
        const orderData = {
            mesa_id: mesaIdActiva,
            mesa_numero: mesaNumeroActivo, 
            total: totalCarrito, 
            medio_pago: "No especificado", 
            items: cart.map(item => ({
                producto_id: item.id, 
                cantidad: item.quantity, 
                precio_unitario: item.price,
                option: item.option 
            }))
        };

        try {
            const response = await fetch('/guardar_pedido/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'X-CSRFToken': getCookie('csrftoken'), 
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error desconocido al procesar el pedido en el servidor.');
            }

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.updated_stock && Array.isArray(result.updated_stock)) {
                result.updated_stock.forEach(stockUpdate => {
                    const cardElement = document.querySelector(`.card[data-id="${stockUpdate.product_id}"]`);
                    if (cardElement) {
                        cardElement.dataset.cantidadDisponible = stockUpdate.new_available_quantity;
                        updateCardButtonState(cardElement); 
                    }
                });
            }

            const clavePedidoMesa = `pedido_mesa_${mesaIdActiva}`;
            const pedidosExistentes = JSON.parse(localStorage.getItem(clavePedidoMesa)) || [];

            cart.forEach(newItem => {
                const existingItem = pedidosExistentes.find(
                    p => p.id == newItem.id && p.option === newItem.option
                );
                if (existingItem) {
                    existingItem.quantity += newItem.quantity;
                } else {
                    pedidosExistentes.push({ ...newItem });
                }
            });
            localStorage.setItem(clavePedidoMesa, JSON.stringify(pedidosExistentes));

            alert(`Pedido #${result.order_id} finalizado para la Mesa ${mesaNumeroActivo}.`);

            cart = []; 
            updateCartDisplay(); 
            closeCart();
            localStorage.removeItem('cart'); 

            if (confirm('¿Desea volver a la página de mesas?')) {
                window.location.href = `/mesas/?mesa_id=${mesaIdActiva}&mesa_numero=${mesaNumeroActivo}`;
            }

        } catch (error) {
            console.error('Error al finalizar la compra:', error);
            alert(`Hubo un error al procesar su pedido: ${error.message}`);
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
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>

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
        cartTotalAmount.textContent = `$${total.toFixed(2)}`;

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
                    const backendAvailable = parseInt(card.dataset.cantidadDisponible); // Stock real del backend
                    if (item.quantity < backendAvailable) {
                        item.quantity += 1;
                    } else {
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

    // Comentado la función getCookie si no se va a usar CSRF aquí
    // function getCookie(name) {
    //     let cookieValue = null;
    //     if (document.cookie && document.cookie !== '') {
    //         const cookies = document.cookie.split(';');
    //         for (let i = 0; i < cookies.length; i++) {
    //             const cookie = cookies[i].trim();
    //             if (cookie.startsWith(name + '=')) {
    //                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //                 break;
    //             }
    //         }
    //     }
    //     return cookieValue;
    // }

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