// Esta función encapsula toda la lógica para inicializarla inmediatamente después de cargar los parciales HTML
function initApp() {
    // Referencias del Menú Móvil
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

    // --- Lógica del Cajón de Búsqueda Fija (Autocomplete Async) ---
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
                // Mostrar spinner de carga inicial
                results.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fa-solid fa-circle-notch spin-anim text-2xl"></i></div>';
                
                // Simular petición de resultados (como async-search)
                timeout = setTimeout(() => {
                    results.innerHTML = `
                        <div class="p-4 text-left">
                            <h4 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Productos Sugeridos</h4>
                            <ul class="space-y-2">
                                <li class="flex gap-4 items-center hover:bg-gray-50 p-2 rounded cursor-pointer transition border-b border-gray-50 pb-3">
                                    <div class="w-12 h-12 bg-gray-100 flex items-center justify-center rounded">
                                        <i class="fa-solid fa-couch text-gray-400"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-bold text-gray-800 leading-tight">Silla de Comedor Nórdica</p>
                                        <p class="text-[13px] text-gray-500 mt-0.5">$90.00</p>
                                    </div>
                                </li>
                                <li class="flex gap-4 items-center hover:bg-gray-50 p-2 rounded cursor-pointer transition pb-2">
                                    <div class="w-12 h-12 bg-gray-100 flex items-center justify-center rounded">
                                        <i class="fa-solid fa-lightbulb text-gray-400"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-bold text-gray-800 leading-tight">Lámpara Colgante Moderna</p>
                                        <p class="text-[13px] text-gray-500 mt-0.5"><span class="line-through text-gray-400 mr-1">$45.00</span>$35.00</p>
                                    </div>
                                </li>
                            </ul>
                            
                            <hr class="my-3 border-gray-100">
                            <h4 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sugerencias</h4>
                            <ul class="text-[13px] text-gray-600 space-y-2 mb-3 px-2">
                                <li><a href="#" class="hover:text-black hover:underline"><span class="font-bold text-black">${val}</span> en Muebles</a></li>
                                <li><a href="#" class="hover:text-black hover:underline"><span class="font-bold text-black">${val}</span> en Iluminación</a></li>
                            </ul>
                            
                            <a href="#" class="mt-4 bg-gray-50 text-sm font-bold text-gray-800 hover:bg-gray-100 text-center block w-full py-2.5 rounded transition border border-gray-200">
                                Ver todos los resultados <i class="fa-solid fa-arrow-right ml-1 text-[10px]"></i>
                            </a>
                        </div>
                    `;
                }, 500); // Retraso simulado de 500ms
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
}

// Ejecutar inmediatamente (ya que este archivo se inyecta y se llama una vez que todo el HTML ya está cargado mediante fetch)
initApp();
