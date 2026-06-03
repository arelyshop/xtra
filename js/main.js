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

    // --- Lógica del Menú Móvil ---
    function toggleMenu() {
        if (!mobileMenu || !mobileOverlay) return;
        const isActive = mobileMenu.classList.contains('mobile-menu-active');
        
        if (isActive) {
            mobileMenu.classList.remove('mobile-menu-active');
            mobileMenu.classList.add('mobile-menu-inactive');
            mobileOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            mobileOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto';
        } else {
            mobileMenu.classList.remove('mobile-menu-inactive');
            mobileMenu.classList.add('mobile-menu-active');
            mobileOverlay.classList.remove('opacity-0', 'pointer-events-none');
            mobileOverlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
        }
    }
    
    if (mobileBtn) mobileBtn.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

    // --- Lógica de Acordeones para Submenús Móviles (NUEVO) ---
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

    // --- Lógica de Petición de Menús Dinámicos (NUEVO) ---
    async function loadDynamicMenus() {
        try {
            const deskCats = document.getElementById('desktop-categories-list');
            const deskBrands = document.getElementById('desktop-brands-list');
            const mobCats = document.getElementById('mobile-categories-list');
            const mobBrands = document.getElementById('mobile-brands-list');

            // Solicitud a Neon pidiendo SOLO categorías y marcas únicas
            const res = await fetch('/.netlify/functions/get_tienda?action=get_menu_data');
            if (!res.ok) throw new Error('Error al cargar menús');
            
            const data = await res.json();

            // Función moldeadora para los menús de Desktop (Grid 2 columnas)
            const deskTemplate = (items, param) => items.map(item => `
                <li>
                    <a href="colecciones.html?${param}=${encodeURIComponent(item)}" class="hover:text-black hover:underline flex items-center gap-3">
                        <div class="w-7 h-7 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 shadow-sm">
                            ${item.charAt(0).toUpperCase()}
                        </div>
                        <span class="truncate">${item}</span>
                    </a>
                </li>
            `).join('');

            // Función moldeadora para los menús Móviles (Lista de viñetas limpia)
            const mobTemplate = (items, param) => items.map(item => `
                <li>
                    <a href="colecciones.html?${param}=${encodeURIComponent(item)}" class="block py-2.5 px-10 text-[14px] text-gray-600 hover:text-black hover:bg-gray-100 transition-colors">
                        ${item}
                    </a>
                </li>
            `).join('');

            // Inyectar Categorías
            if (data.categories && data.categories.length > 0) {
                if (deskCats) deskCats.innerHTML = deskTemplate(data.categories, 'category');
                if (mobCats) mobCats.innerHTML = mobTemplate(data.categories, 'category');
            } else {
                if (deskCats) deskCats.innerHTML = '<li class="text-gray-400">Sin categorías registradas</li>';
                if (mobCats) mobCats.innerHTML = '<li><span class="block py-2 px-10 text-gray-400 text-sm">Vacío</span></li>';
            }

            // Inyectar Marcas
            if (data.brands && data.brands.length > 0) {
                if (deskBrands) deskBrands.innerHTML = deskTemplate(data.brands, 'brand');
                if (mobBrands) mobBrands.innerHTML = mobTemplate(data.brands, 'brand');
            } else {
                if (deskBrands) deskBrands.innerHTML = '<li class="text-gray-400">Sin marcas registradas</li>';
                if (mobBrands) mobBrands.innerHTML = '<li><span class="block py-2 px-10 text-gray-400 text-sm">Vacío</span></li>';
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
    function toggleCart(e) {
        if(e) e.preventDefault();
        if (!sideCart || !sideDrawerOverlay) return;
        const isActive = sideCart.classList.contains('cart-active');
        
        if (isActive) {
            sideCart.classList.remove('cart-active');
            sideCart.classList.add('cart-inactive');
            sideDrawerOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            sideDrawerOverlay.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto';
        } else {
            sideCart.classList.remove('cart-inactive');
            sideCart.classList.add('cart-active');
            sideDrawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
            sideDrawerOverlay.classList.add('opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden';
        }
    }
    
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (sideDrawerOverlay) sideDrawerOverlay.addEventListener('click', toggleCart);

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
                if (val.length > 0) {
                    window.location.href = `colecciones.html?search=${encodeURIComponent(val)}`;
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
        const existingIndex = cart.findIndex(item => item.id === product.id);
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
        }
    };

    window.updateCartQty = function(id, delta) {
        let cart = JSON.parse(localStorage.getItem('arely_cart')) || [];
        const index = cart.findIndex(item => item.id === id);
        if (index > -1) {
            cart[index].qty += delta;
            if (cart[index].qty <= 0) cart.splice(index, 1);
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
                <div class="cart-item flex gap-4 border-b border-gray-100 pb-4" data-id="${item.id}">
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
