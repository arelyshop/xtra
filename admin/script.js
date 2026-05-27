lucide.createIcons();

// ==========================================
// ESTADO GLOBAL
// ==========================================
let allProducts = [];
let currentProductId = null;
const API_URL = '/.netlify/functions/products';

// ==========================================
// REFERENCIAS AL DOM
// ==========================================
const form = document.getElementById('productForm');
const editor = document.getElementById('descriptionEditor');
const formatBtns = document.querySelectorAll('.format-btn');
const alertBox = document.getElementById('alertBox');
const alertIcon = document.getElementById('alertIcon');
const alertMessage = document.getElementById('alertMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');
const deleteBtn = document.getElementById('deleteBtn');
const formTitle = document.getElementById('form-title');

// Contenedores Vista Mobile/Desktop
const productListContainer = document.getElementById('product-list-container');
const productFormContainer = document.getElementById('product-form-container');
const newProductBtn = document.getElementById('new-product-btn');
const backToListBtn = document.getElementById('back-to-list-btn');
const searchInput = document.getElementById('search-product-input');
const productListEl = document.getElementById('product-list');

// Gestión de Imágenes y Escáner...
const imageUrlList = document.getElementById('image-url-list');
const processUrlsBtn = document.getElementById('process-urls-btn');
const imageSortableList = document.getElementById('image-sortable-list');
const singleImageInputsContainer = document.getElementById('single-image-inputs-container');
const addSingleUrlFieldBtn = document.getElementById('add-single-url-field-btn');
const imagePreviewModal = document.getElementById('image-preview-modal');
const previewImage = document.getElementById('preview-image');
const closePreviewBtn = document.getElementById('close-preview-btn');
const scanBarcodeBtn = document.getElementById('scan-barcode-btn');
const scannerContainer = document.getElementById('scanner-container');
const closeScannerBtn = document.getElementById('close-scanner-btn');
const barcodeInput = document.getElementById('barcode');
let sortable = null;
let html5QrCode = null;


// ==========================================
// 1. CARGA Y RENDERIZADO DE LA LISTA (GET)
// ==========================================
const fetchAndRenderProducts = async () => {
    try {
        productListEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Cargando inventario...</p>';
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener productos.');
        
        const result = await response.json();
        if (result.status === 'success') {
            allProducts = result.data;
            renderProductList(allProducts);
        }
    } catch (error) {
        console.error(error);
        productListEl.innerHTML = `<p class="text-red-500 text-sm text-center py-4">Error al cargar la base de datos.</p>`;
    }
};

const renderProductList = (products) => {
    if (products.length === 0) {
        productListEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Inventario vacío.</p>';
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    const filtered = products.filter(p => 
        p.title.toLowerCase().includes(searchTerm) || 
        (p.gtin && p.gtin.toLowerCase().includes(searchTerm)) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm))
    );

    productListEl.innerHTML = filtered.map(product => `
        <div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent 
            ${product.id === currentProductId ? 'bg-indigo-900/50 border-indigo-500' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'}" 
            onclick="populateFormForEdit(${product.id})">
            
            <img src="${product.image_link}" onerror="this.src='https://placehold.co/40x40/1f2937/9ca3af?text=Pic'" class="w-12 h-12 rounded object-cover border border-gray-600 flex-shrink-0">
            
            <div class="flex-grow min-w-0">
                <p class="font-semibold text-white text-sm truncate">${product.title}</p>
                <p class="text-xs text-gray-400 truncate">${product.brand} | Stock: ${product.quantity_to_sell_on_facebook}</p>
            </div>
            
            <div class="text-right flex-shrink-0">
                <p class="text-indigo-400 font-bold text-sm">Bs. ${product.price}</p>
            </div>
        </div>
    `).join('');
};

searchInput.addEventListener('input', () => renderProductList(allProducts));


// ==========================================
// 2. LLENAR FORMULARIO PARA EDITAR
// ==========================================
window.populateFormForEdit = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    resetForm(false); // Limpiar primero sin quitar la vista
    currentProductId = id;
    document.getElementById('productId').value = id;

    // Llenar inputs de texto/número
    Object.keys(product).forEach(key => {
        const input = document.getElementById(key);
        if (input && key !== 'description') {
            input.value = product[key] ?? '';
        }
    });

    // Llenar editor HTML
    editor.innerHTML = product.description || '';

    // Llenar fotos (Sortable List)
    const images = [product.image_link, product.foto_1, product.foto_2, product.foto_3, product.foto_4, product.foto_5, product.foto_6, product.foto_7];
    images.forEach(imgUrl => {
        if (imgUrl) addUrlToSorter(imgUrl);
    });

    // Cambiar UI a "Edición"
    formTitle.innerHTML = `<i data-lucide="edit" class="h-6 w-6 text-indigo-400"></i> Editar: ${product.title}`;
    btnText.textContent = 'Actualizar Producto';
    deleteBtn.classList.remove('hidden');
    deleteBtn.classList.add('flex');
    lucide.createIcons();
    
    renderProductList(allProducts); // Para resaltar el activo

    // Si está en móvil, mostrar formulario
    if (window.innerWidth < 1024) {
        productListContainer.classList.add('hidden');
        productFormContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const resetForm = (backToList = true) => {
    form.reset();
    currentProductId = null;
    document.getElementById('productId').value = '';
    editor.innerHTML = '';
    imageSortableList.innerHTML = '';
    singleImageInputsContainer.innerHTML = '';
    createNewSingleImageInput();

    formTitle.innerHTML = `<i data-lucide="package-plus" class="h-6 w-6 text-indigo-400"></i> Agregar Nuevo Producto`;
    btnText.textContent = 'Guardar Producto';
    deleteBtn.classList.add('hidden');
    deleteBtn.classList.remove('flex');
    lucide.createIcons();
    
    renderProductList(allProducts); // Quitar resaltado

    if (backToList && window.innerWidth < 1024) {
        productFormContainer.classList.add('hidden');
        productListContainer.classList.remove('hidden');
    }
};

newProductBtn.addEventListener('click', () => {
    resetForm(false);
    if (window.innerWidth < 1024) {
        productListContainer.classList.add('hidden');
        productFormContainer.classList.remove('hidden');
    }
});
backToListBtn.addEventListener('click', () => resetForm(true));


// ==========================================
// 3. ENVIAR DATOS (POST / PUT)
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const descriptionHtml = editor.innerHTML.trim();
    if (!descriptionHtml) return showAlert('error', 'La descripción no puede estar vacía.');

    const imageItems = imageSortableList.querySelectorAll('div[data-url]');
    if (imageItems.length === 0) return showAlert('error', 'Agrega al menos la Imagen Principal.');

    submitBtn.disabled = true;
    btnText.textContent = 'Guardando...';
    btnIcon.setAttribute('data-lucide', 'loader-2');
    btnIcon.classList.add('animate-spin');
    lucide.createIcons();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Formatear numéricos vacíos a null
    ['price', 'sale_price', 'wholesale_price', 'purchase_price'].forEach(k => {
        if(data[k] === '') data[k] = null;
    });

    data.description = descriptionHtml;
    data.image_link = imageItems[0]?.dataset.url || '';
    for(let i=1; i<=7; i++) data[`foto_${i}`] = imageItems[i]?.dataset.url || null;

    const isUpdating = !!currentProductId;
    const method = isUpdating ? 'PUT' : 'POST';
    if(isUpdating) data.id = currentProductId;

    try {
        const response = await fetch(API_URL, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }) // Envolvemos en 'data' para compatibilidad
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en el servidor');
        }

        showAlert('success', isUpdating ? '¡Producto actualizado correctamente!' : '¡Producto creado exitosamente!');
        await fetchAndRenderProducts(); // Recargar lista
        resetForm(true); // Limpiar y volver a la lista

    } catch (error) {
        showAlert('error', error.message);
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = isUpdating ? 'Actualizar Producto' : 'Guardar Producto';
        btnIcon.setAttribute('data-lucide', 'save');
        btnIcon.classList.remove('animate-spin');
        lucide.createIcons();
    }
});


// ==========================================
// 4. ELIMINAR PRODUCTO (DELETE)
// ==========================================
deleteBtn.addEventListener('click', async () => {
    if (!currentProductId) return;
    const confirmation = confirm('¿Estás totalmente seguro de eliminar este producto? Esta acción no se puede deshacer.');
    if (!confirmation) return;

    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `<i data-lucide="loader-2" class="h-5 w-5 animate-spin"></i> Eliminando...`;
    lucide.createIcons();

    try {
        const response = await fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentProductId })
        });

        if (!response.ok) throw new Error('Error al intentar eliminar el producto.');

        showAlert('success', 'Producto eliminado exitosamente.');
        await fetchAndRenderProducts();
        resetForm(true);

    } catch (error) {
        showAlert('error', error.message);
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = `<i data-lucide="trash-2" class="h-5 w-5"></i> Eliminar`;
        lucide.createIcons();
    }
});


// ==========================================
// 5. HERRAMIENTAS EXTRAS (Editor, Escáner, Fotos)
// ==========================================
formatBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand(btn.dataset.command, false, btn.dataset.value || null);
        editor.focus();
    });
});

function showAlert(type, message) {
    alertBox.className = `mb-6 p-4 rounded-lg flex items-center gap-3 border transition-all ${
        type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
    }`;
    alertIcon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    alertMessage.textContent = message;
    lucide.createIcons();
    if(type === 'success') setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

// Lógica de Escáner
scanBarcodeBtn.addEventListener('click', () => {
    scannerContainer.classList.remove('hidden'); scannerContainer.classList.add('flex');
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        barcodeInput.value = text;
        stopScanner();
    }).catch(err => {
        showAlert('error', 'Error con la cámara. Verifique permisos.');
        stopScanner();
    });
});
function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(()=>{});
    scannerContainer.classList.add('hidden'); scannerContainer.classList.remove('flex');
}
closeScannerBtn.addEventListener('click', stopScanner);

// Lógica de Imágenes (Resumida)
function addUrlToSorter(url) {
    if (!url) return;
    const existingUrls = Array.from(imageSortableList.querySelectorAll('div[data-url]')).map(d => d.dataset.url);
    if (existingUrls.includes(url)) return showAlert('error', 'URL duplicada.');
    if (existingUrls.length >= 8) return showAlert('error', 'Máximo 8 fotos.');

    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 p-2 bg-gray-900 rounded-lg border border-gray-700 group';
    div.dataset.url = url;
    div.innerHTML = `
        <span class="image-number text-sm font-semibold text-gray-400 w-5 text-center"></span>
        <svg class="w-6 h-6 text-gray-500 drag-handle cursor-grab" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <img src="${url}" onerror="this.src='https://placehold.co/40x40/1f2937/9ca3af'" class="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80">
        <p class="flex-grow text-xs text-gray-400 truncate px-2">${url}</p>
        <button type="button" class="text-xl text-red-500 font-bold remove-image-btn p-1">&times;</button>
    `;
    div.querySelector('img').onclick = () => { previewImage.src = url; imagePreviewModal.classList.remove('hidden'); };
    div.querySelector('.remove-image-btn').onclick = () => { div.remove(); updateImageNumbers(); };
    imageSortableList.appendChild(div);
    updateImageNumbers();
}

function createNewSingleImageInput() {
    const w = document.createElement('div');
    w.className = 'flex items-center space-x-2 single-url-wrapper';
    w.innerHTML = `
        <input type="url" class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Pegar URL y enter">
        <button type="button" class="text-sm bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg save-single-url-btn">Ok</button>
        <button type="button" class="text-xl text-gray-500 font-bold px-2 remove-single-url-btn">&times;</button>
    `;
    const inp = w.querySelector('input');
    const save = () => { const url = convertGoogleDriveUrl(inp.value.trim()); if(url) { addUrlToSorter(url); inp.value=''; } };
    inp.onkeydown = (e) => { if(e.key === 'Enter') { e.preventDefault(); save(); } };
    w.querySelector('.save-single-url-btn').onclick = save;
    w.querySelector('.remove-single-url-btn').onclick = () => w.remove();
    singleImageInputsContainer.appendChild(w);
}

processUrlsBtn.onclick = () => {
    imageUrlList.value.split(',').map(u => convertGoogleDriveUrl(u.trim())).filter(u => u).forEach(addUrlToSorter);
    imageUrlList.value = ''; 
};
addSingleUrlFieldBtn.onclick = createNewSingleImageInput;
closePreviewBtn.onclick = () => imagePreviewModal.classList.add('hidden');
sortable = new Sortable(imageSortableList, { animation: 150, handle: '.drag-handle', onEnd: updateImageNumbers });

// ==========================================
// INICIO DE LA APLICACIÓN
// ==========================================
fetchAndRenderProducts(); // Traer productos de la BD al abrir la página
createNewSingleImageInput(); // Crear el primer input de foto
