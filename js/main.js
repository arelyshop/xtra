// Esta función encapsula toda la lógica para inicializarla inmediatamente después de cargar los parciales HTML
function initApp() {
    // --- Lógica para el año dinámico en el footer ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Referencias del Menú
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-mobile-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');

    // Referencias del Carrito
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const sideCart = document.getElementById('side-cart');
    const sideDrawerOverlay = document.getElementById('side-drawer-overlay');

    // Referencias del Login
    const userBtn = document.getElementById('user-btn');
    const dealerLoginBtn = document.getElementById('dealer-login-btn');
    const mobileUserBtn = document.getElementById('mobile-user-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const loginModalOverlay = document.getElementById('login-modal-overlay');
    const loginModalContent = document.getElementById('login-modal-content');

    // --- Lógica del Menú Móvil ---
    function toggleMenu() {
        if (!mobileMenu || !mobileOverlay) return;
        const isActive = mobileMenu.classList.contains('mobile-menu-active');
        
        if (isActive) {
            mobileMenu.classList.remove('mobile-menu-active');
            mobileMenu.classList.add('mobile-menu-inactive');
            // Ocultar gradualmente el overlay
            mobileOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            mobileOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto'; // Permitir scroll
        } else {
            mobileMenu.classList.remove('mobile-menu-inactive');
            mobileMenu.classList.add('mobile-menu-active');
            // Mostrar gradualmente el overlay
            mobileOverlay.classList.remove('opacity-0', 'pointer-events-none');
            mobileOverlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden'; // Bloquear scroll de fondo
        }
    }
    
    if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

    // --- Lógica del Carrito Lateral ---
    function toggleCart(e) {
        if(e) e.preventDefault();
        if (!sideCart || !sideDrawerOverlay) return;
        const isActive = sideCart.classList.contains('cart-active');
        
        if (isActive) {
            sideCart.classList.remove('cart-active');
            sideCart.classList.add('cart-inactive');
            // Ocultar gradualmente el overlay
            sideDrawerOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            sideDrawerOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto';
        } else {
            sideCart.classList.remove('cart-inactive');
            sideCart.classList.add('cart-active');
            // Mostrar gradualmente el overlay
            sideDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
            sideDrawerOverlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
        }
    }
    
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (sideDrawerOverlay) sideDrawerOverlay.addEventListener('click', toggleCart);

    // --- Lógica del Login Modal ---
    function openLogin(e) {
        if(e) e.preventDefault();
        // Si el menú móvil está abierto, lo cerramos
        if(mobileMenu && mobileMenu.classList.contains('mobile-menu-active')) toggleMenu();
        
        if (loginModal && loginModalContent) {
            loginModal.classList.remove('hidden');
            // Animación suave de aparición
            setTimeout(() => {
                loginModalContent.classList.remove('scale-95', 'opacity-0');
                loginModalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeLogin() {
        if (!loginModalContent || !loginModal) return;
        loginModalContent.classList.remove('scale-100', 'opacity-100');
        loginModalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            loginModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }, 500);
    }
    
    if (userBtn) userBtn.addEventListener('click', openLogin);
    if (dealerLoginBtn) dealerLoginBtn.addEventListener('click', openLogin);
    if (mobileUserBtn) mobileUserBtn.addEventListener('click', openLogin);
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLogin);
    if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLogin);

    // --- Lógica del Cajón de Búsqueda Fija (Autocomplete Async con Base de Datos) ---
    function setupSearch(inputId, resultsId) {
        const input = document.getElementById(inputId);
        const results = document.getElementById(resultsId);
        let timeout = null;

        if(!input || !results) return;

        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const val = e.target.value.trim();
            if(val.length > 0) {
                results.classList.remove('hidden');
                // Mostrar spinner de carga
                results.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fa-solid fa-circle-notch spin-anim text-2xl"></i>Buscando...</div>';
                
                // Petición a la base de datos real (Netlify Function)
                timeout = setTimeout(async () => {
                    try {
                        const res = await fetch(`/.netlify/functions/get_tienda?search=${encodeURIComponent(val)}&limit=5`);
                        if (!res.ok) throw new Error('Error al buscar');
                        const products = await res.json();

                        if (products.length > 0) {
                            // Extraer categorías únicas para sugerencias
                            const categories = [...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 3);
                            
                            let html = `<div class="p-4 text-left">
                                <h4 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Productos Sugeridos</h4>
                                <ul class="space-y-2">`;
                            
                            products.forEach(product => {
                                const price = parseFloat(product.price || 0).toFixed(2);
                                const image = product.image_link || 'https://placehold.co/100x100?text=No+Image';
                                html += `
                                    <li class="flex gap-4 items-center hover:bg-gray-50 p-2 rounded cursor-pointer transition border-b border-gray-50 pb-3" onclick="window.location.href='producto.html?id=${product.id}'">
                                        <div class="w-12 h-12 bg-gray-100 flex items-center justify-center rounded overflow-hidden">
                                            <img src="${image}" alt="${product.title}" class="w-full h-full object-cover">
                                        </div>
                                        <div class="flex-1">
                                            <p class="text-sm font-bold text-gray-800 leading-tight line-clamp-1">${product.title}</p>
                                            <p class="text-[13px] text-gray-500 mt-0.5">${price} Bs.</p>
                                        </div>
                                    </li>`;
                            });

                            html += `</ul>`;

                            // Analizar Categorías y crear Sugerencias
                            if (categories.length > 0) {
                                html += `
                                    <hr class="my-3 border-gray-100">
                                    <h4 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sugerencias por Categoría</h4>
                                    <ul class="text-[13px] text-gray-600 space-y-2 mb-3 px-2">`;
                                
                                categories.forEach(cat => {
                                    html += `<li><a href="colecciones.html?category=${encodeURIComponent(cat)}" class="hover:text-black hover:underline"><span class="font-bold text-black">${val}</span> en ${cat}</a></li>`;
                                });
                                html += `</ul>`;
                            }
                            
                            // Botón Ver todos los resultados, redirigiendo a colecciones
                            html += `
                                <a href="colecciones.html?search=${encodeURIComponent(val)}" class="mt-4 bg-gray-50 text-sm font-bold text-gray-800 hover:bg-gray-100 text-center block w-full py-2.5 rounded transition border border-gray-200">
                                    Ver todos los resultados <i class="fa-solid fa-arrow-right ml-1 text-[10px]"></i>
                                </a>
                            </div>`;
                            results.innerHTML = html;
                        } else {
                            results.innerHTML = `<div class="p-8 text-center text-gray-500 text-sm">No encontramos resultados para "<b>${val}</b>"</div>`;
                        }
                    } catch (err) {
                        console.error(err);
                        results.innerHTML = `<div class="p-8 text-center text-red-500 text-sm">Error de conexión. Intenta de nuevo.</div>`;
                    }
                }, 500);
            } else {
                results.classList.add('hidden');
            }
        });

        // Cerrar el cajón al hacer clic fuera del input y del cajón
        document.addEventListener('click', (e) => {
            if(!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.add('hidden');
            }
        });
    }
    
    // Inicializar para ambas barras de búsqueda
    setupSearch('desktop-search', 'desktop-search-results');
    setupSearch('mobile-search', 'mobile-search-results');

    // --- Lógica del Carrito Real (localStorage) ---
    // Función global para que pueda ser llamada desde la página de producto
    window.addToCart = function(product, qty = 1) {
        let cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
        // Revisar si ya existe
        const existingIndex = cart.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
            cart[existingIndex].qty += qty;
        } else {
            cart.push({ ...product, qty: qty });
        }
        localStorage.setItem('arely_cart', JSON.stringify(cart));
        renderCart();
        
        // Mostrar visualmente el carrito
        const sideCart = document.getElementById('side-cart');
        const overlay = document.getElementById('side-drawer-overlay');
        if (sideCart && sideCart.classList.contains('cart-inactive')) {
            sideCart.classList.remove('cart-inactive');
            sideCart.classList.add('cart-active');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
        }
    };

    window.updateCartQty = function(id, delta) {
        let cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
        const index = cart.findIndex(item => item.id === id);
        if (index > -1) {
            cart[index].qty += delta;
            if (cart[index].qty <= 0) cart.splice(index, 1); // Eliminar si llega a 0
            localStorage.setItem('arely_cart', JSON.stringify(cart));
            renderCart();
        }
    };

    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
        const container = document.getElementById('cart-items-container');
        const bubble = document.getElementById('cart-count-bubble');
        const titleCount = document.getElementById('cart-title-count');
        const subtotalDisplay = document.getElementById('cart-subtotal-display');

        if (!container) return;

        let totalQty = 0;
        let subtotal = 0;
        
        if (cart.length === 0) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
                <i class="fa-solid fa-cart-shopping text-5xl mb-4 opacity-50"></i>
                <p>Tu carrito está vacío</p>
                <a href="colecciones.html" class="mt-4 bg-[#030712] text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800">Ver Catálogo</a>
            </div>`;
        } else {
            let html = '';
            cart.forEach(item => {
                totalQty += item.qty;
                const price = parseFloat(item.price || 0);
                subtotal += (price * item.qty);
                const img = item.image_link || 'https://placehold.co/100x100?text=No+Image';

                html += `
                <div class="cart-item flex gap-4 border-b border-gray-100 pb-4" data-id="${item.id}" data-name="${item.title}" data-sku="${item.gtin || 'SKU'}" data-price="${price}" data-qty="${item.qty}" data-url="${window.location.origin}/producto.html?id=${item.id}">
                    <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        <img src="${img}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <h3 class="text-sm font-bold line-clamp-2 leading-tight">${item.title}</h3>
                        <p class="text-xs text-gray-500 mt-1">Ref: ${item.gtin || 'N/A'}</p>
                        <div class="flex justify-between items-center mt-2">
                            <div class="flex items-center border border-gray-300 rounded">
                                <button onclick="updateCartQty('${item.id}', -1)" class="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition">-</button>
                                <span class="px-3 text-sm font-medium border-x border-gray-200">${item.qty}</span>
                                <button onclick="updateCartQty('${item.id}', 1)" class="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition">+</button>
                            </div>
                            <span class="font-bold text-sm">${(price * item.qty).toFixed(2)} Bs.</span>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        }

        // Actualizar UI
        if (titleCount) titleCount.textContent = totalQty;
        if (subtotalDisplay) subtotalDisplay.textContent = `${subtotal.toFixed(2)} Bs.`;
        
        if (bubble) {
            if (totalQty > 0) {
                bubble.textContent = totalQty;
                bubble.classList.remove('hidden');
            } else {
                bubble.classList.add('hidden');
            }
        }
    }

    // Inicializar carrito al cargar la app
    renderCart();

    // --- Lógica de Finalizar Compra por WhatsApp ---
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
            if(cart.length === 0) return;

            let message = "¡Hola Arelyshop! 👋 Quiero finalizar mi pedido:\n\n";
            let total = 0;

            cart.forEach(item => {
                const price = parseFloat(item.price || 0);
                const itemTotal = price * item.qty;
                total += itemTotal;
                const url = `${window.location.origin}/producto.html?id=${item.id}`;

                message += `➡️ ${item.qty}x ${item.title} (Ref: ${item.gtin || 'N/A'})\n`;
                message += `Precio unitario: ${price.toFixed(2)} Bs.\n`;
                message += `🔗 ${url}\n\n`;
            });

            message += `-----------------------------------\n`;
            message += `Total del Pedido: *${total.toFixed(2)} Bs.*\n\n`;
            message += `Espero las instrucciones para el pago y envío. ¡Gracias!`;

            const phone = "59167500044";
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    }
}

// Ejecutar inmediatamente (ya que este archivo se inyecta y se llama una vez que todo el HTML ya está cargado mediante fetch)
initApp();
