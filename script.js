document.addEventListener('DOMContentLoaded', () => {
    // --- Variables y elementos del DOM ---
    const cartIcon = document.getElementById('cart-icon');
    const cartCounter = document.getElementById('cart-counter'); 
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Carrito de compras: se inicializa vacío o se carga desde localStorage
    let cart = JSON.parse(localStorage.getItem('brumaDeLondresCart')) || [];

    // --- Funciones del Carrito de Compras ---

    /**
     * Guarda el estado actual del carrito en localStorage.
     */
    const saveCart = () => {
        localStorage.setItem('brumaDeLondresCart', JSON.stringify(cart));
    };

    /**
     * Actualiza el contador de ítems en el ícono del carrito.
     */
    const updateCartCounter = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCounter) { // Asegurarse de que el elemento exista
            cartCounter.textContent = totalItems;
        }
    };

    /**
     * Abre la barra lateral del carrito.
     */
    const openCart = () => {
        if (cartOverlay) {
            cartOverlay.classList.add('active');
            renderCart(); // Renderiza el carrito cada vez que se abre
        }
    };

    /**
     * Cierra la barra lateral del carrito.
     */
    const closeCart = () => {
        if (cartOverlay) {
            cartOverlay.classList.remove('active');
        }
    };

    /**
     * Renderiza los productos en la barra lateral del carrito.
     */
    const renderCart = () => {
        if (!cartItemsContainer) return; // Salir si no estamos en una página con carrito

        cartItemsContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar
        let grandTotal = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; font-size: 1.6rem; color: var(--medium-grey);">El carrito está vacío.</p>';
            cartTotalElement.textContent = '$0.00';
            // Deshabilitar botones si el carrito está vacío
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (clearCartBtn) clearCartBtn.disabled = true;
            return;
        }

        // Habilitar botones si hay ítems en el carrito
        if (checkoutBtn) checkoutBtn.disabled = false;
        if (clearCartBtn) clearCartBtn.disabled = false;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            grandTotal += itemTotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button data-id="${item.id}" data-action="decrease" aria-label="Disminuir cantidad">-</button>
                        <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="quantity-input" aria-label="Cantidad del producto">
                        <button data-id="${item.id}" data-action="increase" aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}" aria-label="Eliminar producto">&times;</button>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        cartTotalElement.textContent = `$${grandTotal.toFixed(2)}`;

        // Añadir listeners para botones de cantidad y eliminar
        cartItemsContainer.querySelectorAll('[data-action="decrease"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                updateQuantity(id, -1);
            });
        });

        cartItemsContainer.querySelectorAll('[data-action="increase"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                updateQuantity(id, 1);
            });
        });

        cartItemsContainer.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const newQuantity = parseInt(e.target.value);
                // Asegurarse de que la cantidad no sea menor que 1
                if (isNaN(newQuantity) || newQuantity < 1) {
                    e.target.value = 1; // Restablecer a 1 si el usuario ingresa algo inválido
                    updateQuantity(id, 1, true); // Actualizar directamente a 1
                } else {
                    updateQuantity(id, newQuantity, true); // Actualizar directamente a la cantidad
                }
            });
        });

        cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                removeFromCart(id);
            });
        });
    };

    /**
     * Agrega un producto al carrito.
      @param {Object} product - El objeto producto a añadir.
    */
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartCounter();
        openCart(); // Abre el carrito automáticamente al añadir
        console.log('Producto añadido al carrito:', product.title);
    };

    /**
     * Actualiza la cantidad de un producto en el carrito.
     @param {number} productId - ID del producto.
     @param {number} change - Cantidad a sumar/restar (ej: 1 o -1) o la cantidad exacta.
     @param {boolean} isExactQuantity
     */
    const updateQuantity = (productId, change, isExactQuantity = false) => {
        const itemIndex = cart.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            if (isExactQuantity) {
                cart[itemIndex].quantity = Math.max(1, change); // Asegura que no sea menos de 1
            } else {
                cart[itemIndex].quantity += change;
            }

            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1); // Eliminar si la cantidad llega a 0
            }
            saveCart();
            updateCartCounter();
            renderCart();
        }
    };

    /**
     * Elimina un producto del carrito.
     * @param {number} productId - ID del producto a eliminar.
     */
    const removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartCounter();
        renderCart();
    };

    /**
     * Vacía completamente el carrito.
     */
    const clearCart = () => {
        cart = [];
        saveCart();
        updateCartCounter();
        renderCart();
        console.log('Carrito vaciado.');
    };

    //---Lógica de Carga de Productos (para `index.html` y `productos.html`)---

    // Este bloque se ejecuta si estás en la página de productos o en la página de inicio
    if (window.location.pathname.includes('productos.html') || window.location.pathname.includes('index.html')) {
        const productosContainer = document.getElementById('productos-container'); 
        const fetchProducts = async () => {
            try {
                const response = await fetch('https://fakestoreapi.com/products?limit=6'); // Obtener 6 productos
                const products = await response.json();
                displayProducts(products);
            } catch (error) {
                console.error('Error al obtener los productos:', error);
                if (productosContainer) {
                    productosContainer.innerHTML = '<p style="font-size: 2rem; color: red; text-align: center;">No pudimos cargar los productos en este momento. Inténtalo de nuevo más tarde.</p>';
                }
            }
        };

        /**
         * Muestra los productos obtenidos de la API en la página.
         * @param {Array} products - Array de objetos producto.
         */
        const displayProducts = (products) => {
            if (!productosContainer) return;

            productosContainer.innerHTML = ''; // Limpiar cualquier contenido previo
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.classList.add('producto-card');
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                    <h3>${product.title}</h3>
                    <p>${product.description.substring(0, 70)}...</p>
                    <span>$${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" data-id="${product.id}"
                            data-title="${product.title}"
                            data-price="${product.price}"
                            data-image="${product.image}">
                        Añadir al Carrito
                    </button>
                `;
                productosContainer.appendChild(productCard);
            });

            // Añadir event listeners a los botones "Añadir al Carrito"
            document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productData = {
                        id: parseInt(e.target.dataset.id),
                        title: e.target.dataset.title,
                        price: parseFloat(e.target.dataset.price),
                        image: e.target.dataset.image
                    };
                    addToCart(productData);
                });
            });
        };

        fetchProducts(); // Cargar productos al cargar la página de productos o index
    }

    //---Lógica del Formulario de Contacto (para `contacto.html`)---

    if (window.location.pathname.includes('contacto.html')) {
        const contactForm = document.getElementById('contact-form');
        const formMessage = document.getElementById('form-message');

        /**
         * Valida el formulario de contacto.
         * @param {Event} e - El evento de envío del formulario.
         */
        const validateForm = (e) => {
            e.preventDefault(); // Evita que el formulario se envíe normalmente

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim(); 
            const message = document.getElementById('message').value.trim();

            formMessage.textContent = ''; // Limpiar mensajes anteriores
            formMessage.style.color = 'red'; // Color por defecto para errores

            if (name === '' || email === '' || message === '') {
                formMessage.textContent = 'Por favor, completa todos los campos requeridos (*).';
                return;
            }

            // Validación de formato de correo electrónico
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                formMessage.textContent = 'Por favor, ingresa un correo electrónico válido.';
                return;
            }

            // Si todo es válido
            formMessage.style.color = 'green';
            formMessage.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.';

            contactForm.reset(); // Limpiar el formulario
            console.log('Formulario enviado:', { name, email, subject, message });
        };

        if (contactForm) {
            contactForm.addEventListener('submit', validateForm);
        }
    }

    //---Lógica del Scroll Suave para Anclas---

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY;
                const headerOffset = 70; // Altura del header para compensar
                const scrollPosition = offsetTop - headerOffset;

                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    //---Inicialización y Event Listeners Globales---

    updateCartCounter(); // Actualiza el contador al cargar cualquier página

    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }
    if (cartOverlay) {
        // Cerrar carrito al hacer clic fuera de la sidebar
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                closeCart();
            }
        });
    }
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    if (checkoutBtn) { 
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                alert('¡Gracias por tu compra! Tu pedido ha sido procesado.');
                clearCart();
                closeCart();
            } else {
                alert('Tu carrito está vacío. ¡Añade algunos productos primero!');
            }
        });
    }

    // Mejora de accesibilidad: Cerrar carrito con la tecla 'Escape'
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartOverlay && cartOverlay.classList.contains('active')) {
            closeCart();
        }
    });

}); 