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

    // Variables de control de estado para el historial
    let isMenuClosing = false;
    let isCartClosing = false;

    // --- Lógica del Menú Móvil ---
    function toggleMenu(e, fromHistory = false) {
        if (e && e.preventDefault && e.currentTarget !== window) e.preventDefault();
        if (!mobileMenu || !mobileOverlay || isMenuClosing) return;
        
        const isActive = mobileMenu.classList.contains('mobile-menu-active');
        
        if (isActive) {
            isMenuClosing = true;
            mobileMenu.classList.remove('mobile-menu-active');
            mobileMenu.classList.add('mobile-menu-inactive');
            mobileOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            mobileOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto';
            
            // Si no se cerró tocando el botón "Atrás", limpiamos el historial virtual
            if (!fromHistory && history.state && history.state.drawer === 'menu') {
                history.back();
            }
            setTimeout(() => isMenuClosing = false, 300);
        } else {
            mobileMenu.classList.remove('mobile-menu-inactive');
            mobileMenu.classList.add('mobile-menu-active');
            mobileOverlay.classList.remove('opacity-0', 'pointer-events-none');
            mobileOverlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
            
            // Agregamos un estado al historial al abrir
            history.pushState({ drawer: 'menu' }, '', '');
        }
    }
    
    if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

    // --- Lógica de Acordeones para Submenús Móviles ---
    const mobileCatBtn = document.getElementById('mobile-cat-btn');
    const mobileCatList = document.getElementById('mobile-categories-list');
    const mobileCatIcon = document.getElementById('mobile-cat-icon');

    if (mobileCatBtn && mobileCatList) {
        mobileCatBtn.addEventListener('click', () => {
            mobileCatList.classList.toggle('hidden');
            mobileCatIcon?.classList.toggle('-rotate-180');
        });
    }

    const mobileBrandBtn = document.getElementById('mobile-brand-btn');
    const mobileBrandList = document.getElementById('mobile-brands-list');
    const mobileBrandIcon = document.getElementById('mobile-brand-icon');

    if (mobileBrandBtn && mobileBrandList) {
        mobileBrandBtn.addEventListener('click', () => {
            mobileBrandList.classList.toggle('hidden');
            mobileBrandIcon?.classList.toggle('-rotate-180');
        });
    }

    // --- Lógica de Petición de Menús Dinámicos ---
    async function loadDynamicMenus() {
        try {
            const deskCats = document.getElementById('desktop-categories-list');
            const deskBrands = document.getElementById('desktop-brands-list');
            const mobCats = document.getElementById('mobile-categories-list');
            const mobBrands = document.getElementById('mobile-brands-list');

            // Referencias a los selectores del Buscador (Móvil y Escritorio)
            const deskSearchCat = document.getElementById('desktop-search-category');
            const mobSearchCat = document.getElementById('mobile-search-category');

            let data = null;
            const CACHE_KEY = 'arelyshop_menu_cache';

            // 1. Detectar si el usuario recargó la página explícitamente (F5 o botón de recargar)
            const isReload = (window.performance && window.performance.getEntriesByType("navigation").length > 0 && window.performance.getEntriesByType("navigation")[0].type === "reload") || (window.performance && window.performance.navigation && window.performance.navigation.type === 1);

            // Si recargó la página, borramos la caché para forzar una consulta nueva
            if (isReload) {
                sessionStorage.removeItem(CACHE_KEY);
            } else {
                // Si solo navegó haciendo clic, intentamos usar la caché de la sesión actual
                const cachedString = sessionStorage.getItem(CACHE_KEY);
                if (cachedString) {
                    data = JSON.parse(cachedString);
                }
            }

            // 2. Si no hay datos (porque refrescó o es su primer clic), solicita a la base de datos
            if (!data) {
                // Solicitud a Neon pidiendo SOLO categorías y marcas únicas
                const res = await fetch('/.netlify/functions/get_tienda?action=get_menu_data');
                if (!res.ok) throw new Error('Error al cargar menús');
                
                data = await res.json();
                
                // Guardamos los datos en sessionStorage (no usamos fecha porque caduca al cerrar pestaña/refrescar)
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
            }

            // Función moldeadora para los menús de Desktop (Grid 2 columnas)
            const deskTemplate = (items, param) => items.map(item => `
                <li>
                    <a href="colecciones.html?${param}=${encodeURIComponent(item)}" class="flex items-center gap-2.5 py-1 px-2 hover:bg-slate-50 rounded-md transition-colors group">
                        <div class="w-7 h-7 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 group-hover:border-slate-300 group-hover:bg-white transition-colors">
                            <span class="text-slate-600 font-bold text-[12px] uppercase">${item.charAt(0).toUpperCase()}</span>
                        </div>
                        <span class="text-slate-700 text-[13px] font-medium truncate">${item}</span>
                    </a>
                </li>
            `).join('');

            // Función moldeadora para los menús móviles (Lista con Iconos)
            const mobTemplate = (items, param) => items.map(item => `
                <li>
                    <a href="colecciones.html?${param}=${encodeURIComponent(item)}" class="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-50 rounded-md transition-colors">
                        <div class="w-7 h-7 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                            <span class="text-slate-600 font-bold text-[12px] uppercase">${item.charAt(0).toUpperCase()}</span>
                        </div>
                        <span class="text-slate-700 text-[14px] font-medium truncate">${item}</span>
                    </a>
                </li>
            `).join('');

            // Inyectar Categorías en los Menús y Selectores de Búsqueda
            if (data.categories && data.categories.length > 0) {
                if (deskCats) deskCats.innerHTML = deskTemplate(data.categories, 'category');
                if (mobCats) mobCats.innerHTML = mobTemplate(data.categories, 'category');

                // Llenar los campos de Selección (Selects) de los buscadores
                const optionsHTML = '<option value="">Categorías</option>' + data.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
                if (deskSearchCat) deskSearchCat.innerHTML = optionsHTML;
                if (mobSearchCat) mobSearchCat.innerHTML = optionsHTML;

            } else {
                if (deskCats) deskCats.innerHTML = '<li class="text-gray-400 p-2">Sin categorías registradas</li>';
                if (mobCats) mobCats.innerHTML = '<li><span class="block py-2 px-3 text-gray-400 text-sm">Vacío</span></li>';
            }

            // Inyectar Marcas
            if (data.brands && data.brands.length > 0) {
                if (deskBrands) deskBrands.innerHTML = deskTemplate(data.brands, 'brand');
                if (mobBrands) mobBrands.innerHTML = mobTemplate(data.brands, 'brand');
            } else {
                if (deskBrands) deskBrands.innerHTML = '<li class="text-gray-400 p-2">Sin marcas registradas</li>';
                if (mobBrands) mobBrands.innerHTML = '<li><span class="block py-2 px-3 text-gray-400 text-sm">Vacío</span></li>';
            }

        } catch (error) {
            console.error("No se pudo inyectar el menú dinámico:", error);
            const errorMsg = '<li class="text-red-400 text-sm"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexión</li>';
            ['desktop-categories-list', 'desktop-brands-list'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = errorMsg;
            });
        }
    }
    
    // Disparar carga de menús
    loadDynamicMenus();

    // --- Lógica del Carrito Lateral ---
    function toggleCart(e, fromHistory = false) {
        if(e && e.preventDefault && e.currentTarget !== window) e.preventDefault();
        if (!sideCart || !sideDrawerOverlay || isCartClosing) return;
        
        const isActive = sideCart.classList.contains('cart-active');
        
        if (isActive) {
            isCartClosing = true;
            sideCart.classList.remove('cart-active');
            sideCart.classList.add('cart-inactive');
            sideDrawerOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            sideDrawerOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto';
            
            // Si no se cerró tocando el botón "Atrás", limpiamos el historial virtual
            if (!fromHistory && history.state && history.state.drawer === 'cart') {
                history.back();
            }
            setTimeout(() => isCartClosing = false, 300);
        } else {
            sideCart.classList.remove('cart-inactive');
            sideCart.classList.add('cart-active');
            sideDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
            sideDrawerOverlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
            
            // Agregamos un estado al historial al abrir
            history.pushState({ drawer: 'cart' }, '', '');
        }
    }
    
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (sideDrawerOverlay) sideDrawerOverlay.addEventListener('click', toggleCart);


    // --- Interceptar Botón Atrás del Móvil ---
    window.addEventListener('popstate', (e) => {
        // Verifica si el menú está abierto
        if (mobileMenu && mobileMenu.classList.contains('mobile-menu-active') && !isMenuClosing) {
            toggleMenu(null, true);
        }
        // Verifica si el carrito está abierto
        else if (sideCart && sideCart.classList.contains('cart-active') && !isCartClosing) {
            toggleCart(null, true);
        }
    });

    // --- Lógica del Cajón de Búsqueda Fija (Autocomplete) ---
    function setupSearch(inputId, resultsId) {
        const input = document.getElementById(inputId);
        const results = document.getElementById(resultsId);
        let timeout = null;

        if(!input || !results) return;

        const form = input.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault(); 
                const val = input.value.trim();
                
                // Extraer el valor del select correspondiente (si se seleccionó una categoría)
                const selectId = inputId === 'desktop-search' ? 'desktop-search-category' : 'mobile-search-category';
                const catSelect = document.getElementById(selectId);
                const catVal = catSelect ? catSelect.value : '';

                if (val.length > 0 || catVal.length > 0) {
                    let url = 'colecciones.html?';
                    if (catVal) url += `category=${encodeURIComponent(catVal)}&`;
                    if (val) url += `search=${encodeURIComponent(val)}`;
                    
                    // Limpiar el ampersand del final si queda suelto
                    if(url.endsWith('&')) url = url.slice(0, -1);
                    
                    window.location.href = url;
                }
            });
        }

        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            const val = e.target.value.trim();

            if(val.length > 0) {
                results.classList.remove('hidden');
                results.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fa-solid fa-circle-notch spin-anim text-2xl"></i> Buscando...</div>';
                
                timeout = setTimeout(async () => {
                    try {
                        const res = await fetch(`/.netlify/functions/get_tienda?search=${encodeURIComponent(val)}&limit=5`);
                        if (!res.ok) throw new Error('Error al buscar');
                        const products = await res.json();

                        if (products.length > 0) {
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

        document.addEventListener('click', (e) => {
            if(!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.add('hidden');
            }
        });
    }
    
    setupSearch('desktop-search', 'desktop-search-results');
    setupSearch('mobile-search', 'mobile-search-results');

    // --- Lógica del Carrito Real (localStorage) ---
    window.addToCart = function(product, qty = 1) {
        let cart = JSON.parse(localStorage.getItem('arely_cart')) || [];

        // Convertimos ambos a String para evitar errores si el ID de la BD es numérico y llega como cadena
        const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));

        if (existingIndex > -1) {
            cart[existingIndex].qty += qty;
        } else {
            cart.push({ ...product, qty: qty });
        }

        localStorage.setItem('arely_cart', JSON.stringify(cart));
        renderCart();
        
        const sideCart = document.getElementById('side-cart');
        const overlay = document.getElementById('side-drawer-overlay');
        
        if (sideCart && sideCart.classList.contains('cart-inactive')) {
            sideCart.classList.remove('cart-inactive');
            sideCart.classList.add('cart-active');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
            
            // Agregamos estado al historial cuando se abre el carrito automáticamente
            history.pushState({ drawer: 'cart' }, '', '');
        }
    };

    window.updateCartQty = function(id, delta) {
        let cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
        
        // Convertimos a String para la comparación (soluciona el problema de los botones de cantidad)
        const index = cart.findIndex(item => String(item.id) === String(id));
        
        if (index > -1) {
            cart[index].qty += delta;
            if (cart[index].qty <= 0) cart.splice(index, 1);
            localStorage.setItem('arely_cart', JSON.stringify(cart));
            renderCart();
        }
    };

    // Nueva función para eliminar un producto completo del carrito
    window.removeFromCart = function(id) {
        let cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
        cart = cart.filter(item => String(item.id) !== String(id));
        localStorage.setItem('arely_cart', JSON.stringify(cart));
        renderCart();
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
                <p>Tu carrito está vacío</p>
                <a href="colecciones.html" class="mt-4 bg-[#f3f4f6] text-gray-800 px-6 py-2 rounded font-bold text-sm hover:bg-gray-200 transition-colors shadow-sm">Ver Catálogo</a>
            </div>`;
        } else {
            let html = '';
            cart.forEach(item => {
                totalQty += item.qty;
                const price = parseFloat(item.price || 0);
                subtotal += (price * item.qty);
                const img = item.image_link || 'https://placehold.co/100x100?text=No+Image';

                html += `
                <div class="cart-item flex gap-4 border-b border-gray-100 pb-4" data-id="${item.id}">
                    <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                        <img src="${img}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 flex flex-col">
                        <div class="flex justify-between gap-2 items-start">
                            <h3 class="text-sm font-bold line-clamp-2 leading-tight pr-2">${item.title}</h3>
                            <button onclick="removeFromCart('${item.id}')" class="text-gray-400 hover:text-red-500 transition-colors w-10 h-10 flex items-center justify-center shrink-0 -mt-2 -mr-2 rounded-full" title="Eliminar del carrito">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-1 mb-2">Ref: ${item.gtin || 'N/A'}</p>
                        
                        <div class="flex justify-between items-center mt-auto">
                            <div class="flex items-center border border-gray-300 rounded h-8">
                                <button onclick="updateCartQty('${item.id}', -1)" class="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition">-</button>
                                <span class="w-8 h-full flex items-center justify-center text-sm font-medium border-x border-gray-200">${item.qty}</span>
                                <button onclick="updateCartQty('${item.id}', 1)" class="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition">+</button>
                            </div>
                            <span class="font-bold text-sm">${(price * item.qty).toFixed(2)} Bs.</span>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        }

        if (titleCount) titleCount.textContent = totalQty;
        if (subtotalDisplay) subtotalDisplay.textContent = `${subtotal.toFixed(2)} Bs.`;
        
        if (bubble) {
            // Siempre mostramos la cantidad, incluso si es 0, y aseguramos que no esté oculto
            bubble.textContent = totalQty;
            bubble.classList.remove('hidden');
        }
    }

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
// Ejecutar inmediatamente
initApp();
