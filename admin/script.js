// ... existing code ...
// Escáner de Código de Barras
const scanBarcodeBtn = document.getElementById('scan-barcode-btn');
const scannerContainer = document.getElementById('scanner-container');
const closeScannerBtn = document.getElementById('close-scanner-btn');
const barcodeInput = document.getElementById('barcode');
let html5QrCode = null;

// Vistas y Navegación (Inventario)
const tabCreate = document.getElementById('tab-create');
const tabInventory = document.getElementById('tab-inventory');
const viewCreate = document.getElementById('view-create');
const viewInventory = document.getElementById('view-inventory');
const inventoryTableBody = document.getElementById('inventory-table-body');
const refreshInventoryBtn = document.getElementById('refresh-inventory-btn');

// Modal de Eliminación
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Estado Global
let editingProductId = null;
let productsList = [];
let productToDelete = null;

// ==========================================
// 1. LÓGICA DEL EDITOR DE TEXTO (WORD)
// ==========================================
// ... existing code ...
scanBarcodeBtn.addEventListener('click', startScanner);
closeScannerBtn.addEventListener('click', stopScanner);


// ==========================================
// 4.5 LÓGICA DE INVENTARIO (PESTAÑAS Y TABLA)
// ==========================================

function switchTab(tab) {
    if (tab === 'create') {
        viewCreate.classList.remove('hidden');
        viewInventory.classList.add('hidden');
        
        tabCreate.classList.add('text-indigo-400', 'border-indigo-400');
        tabCreate.classList.remove('text-gray-400', 'border-transparent');
        
        tabInventory.classList.remove('text-indigo-400', 'border-indigo-400');
        tabInventory.classList.add('text-gray-400', 'border-transparent');
    } else {
        viewCreate.classList.add('hidden');
        viewInventory.classList.remove('hidden');
        
        tabInventory.classList.add('text-indigo-400', 'border-indigo-400');
        tabInventory.classList.remove('text-gray-400', 'border-transparent');
        
        tabCreate.classList.remove('text-indigo-400', 'border-indigo-400');
        tabCreate.classList.add('text-gray-400', 'border-transparent');
        
        loadInventory(); // Cargar datos al entrar a la pestaña de Inventario
    }
}

tabCreate.addEventListener('click', () => switchTab('create'));
tabInventory.addEventListener('click', () => switchTab('inventory'));
refreshInventoryBtn.addEventListener('click', loadInventory);

async function loadInventory() {
    inventoryTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center justify-center gap-2">
                    <i data-lucide="loader-2" class="h-6 w-6 animate-spin"></i>
                    <span>Cargando inventario...</span>
                </div>
            </td>
        </tr>
    `;
    lucide.createIcons();

    try {
        const response = await fetch('/.netlify/functions/products');
        const data = await response.json();
        
        if (data.status === 'success') {
            productsList = data.data;
            renderInventoryTable(productsList);
        } else {
            throw new Error('No se pudo cargar el inventario.');
        }
    } catch (error) {
        console.error(error);
        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-red-400">
                    Ocurrió un error al cargar los productos.
                </td>
            </tr>
        `;
        showAlert('error', 'Error al cargar el inventario de la base de datos.');
    }
}

function renderInventoryTable(products) {
    inventoryTableBody.innerHTML = '';
    
    if (products.length === 0) {
        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                    No hay productos registrados en el inventario.
                </td>
            </tr>
        `;
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/50 transition-colors group';
        
        const imageUrl = p.image_link || 'https://placehold.co/40x40/1f2937/9ca3af?text=No+Img';
        const priceStr = parseFloat(p.price).toFixed(2);
        const stockStr = p.quantity_to_sell_on_facebook || 0;
        
        tr.innerHTML = `
            <td class="px-4 py-3">
                <img src="${imageUrl}" onerror="this.onerror=null;this.src='https://placehold.co/40x40/1f2937/9ca3af?text=Err';" class="w-10 h-10 rounded object-cover border border-gray-600 bg-gray-800 cursor-pointer hover:opacity-80 transition-opacity" onclick="openImagePreview('${imageUrl}')">
            </td>
            <td class="px-4 py-3 font-medium text-gray-200">
                <div class="line-clamp-2" title="${p.title}">${p.title}</div>
                <div class="text-xs text-gray-500 mt-0.5">${p.brand || 'Sin marca'} | ${p.category || 'Sin categoría'}</div>
            </td>
            <td class="px-4 py-3 text-indigo-300 font-semibold">$${priceStr}</td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stockStr > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}">
                    ${stockStr}
                </span>
            </td>
            <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onclick="editProduct(${p.id})" class="p-1.5 bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded transition-colors" title="Editar">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="promptDeleteProduct(${p.id})" class="p-1.5 bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors" title="Eliminar">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        inventoryTableBody.appendChild(tr);
    });
    
    lucide.createIcons();
}

// Llenar datos en el formulario para Editar
window.editProduct = (id) => {
    const product = productsList.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = product.id;
    
    // Llenar campos de texto
    document.getElementById('name').value = product.title || '';
    document.querySelector('input[name="category"]').value = product.category || '';
    document.getElementById('brand').value = product.brand || '';
    document.getElementById('gtin').value = product.gtin || '';
    document.getElementById('barcode').value = product.barcode || '';
    document.querySelector('input[name="link"]').value = product.link || '';
    document.querySelector('input[name="price"]').value = product.price || '';
    document.querySelector('input[name="sale_price"]').value = product.sale_price || '';
    document.querySelector('input[name="wholesale_price"]').value = product.wholesale_price || '';
    document.querySelector('input[name="purchase_price"]').value = product.purchase_price || '';
    document.querySelector('input[name="quantity_to_sell_on_facebook"]').value = product.quantity_to_sell_on_facebook || '';
    
    // Llenar Selects
    document.querySelector('select[name="availability"]').value = product.availability || 'in stock';
    document.querySelector('select[name="condition"]').value = product.condition || 'new';
    
    // Llenar WYSIWYG
    editor.innerHTML = product.description || '';
    
    // Limpiar y Llenar Imágenes (Ignorando nulos)
    imageSortableList.innerHTML = '';
    const urls = [
        product.image_link, product.foto_1, product.foto_2, product.foto_3, 
        product.foto_4, product.foto_5, product.foto_6, product.foto_7
    ].filter(Boolean);
    
    urls.forEach(url => addUrlToSorter(url));
    
    // Cambiar texto de botón para que indique edición
    btnText.textContent = 'Actualizar Producto';
    btnIcon.setAttribute('data-lucide', 'refresh-cw');
    
    // Mover a la pestaña y arriba
    switchTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
};

// Modal de Confirmación y Eliminado
window.promptDeleteProduct = (id) => {
    productToDelete = id;
    deleteConfirmModal.classList.remove('hidden');
};

cancelDeleteBtn.addEventListener('click', () => {
    productToDelete = null;
    deleteConfirmModal.classList.add('hidden');
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!productToDelete) return;
    
    const originalBtnHtml = confirmDeleteBtn.innerHTML;
    confirmDeleteBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i> Eliminando...';
    confirmDeleteBtn.disabled = true;
    lucide.createIcons();

    try {
        const response = await fetch('/.netlify/functions/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productToDelete })
        });

        if (!response.ok) throw new Error('Error al eliminar el producto de la base de datos.');
        
        showAlert('success', 'Producto eliminado permanentemente.');
        deleteConfirmModal.classList.add('hidden');
        
        // Refrescar inventario automáticamente
        loadInventory();
        
        // Si justo estábamos editando el mismo producto que borramos, limpiar el form
        if (editingProductId === productToDelete) {
            resetFormState();
        }
    } catch (error) {
        console.error(error);
        showAlert('error', error.message);
    } finally {
        confirmDeleteBtn.innerHTML = originalBtnHtml;
        confirmDeleteBtn.disabled = false;
        productToDelete = null;
        lucide.createIcons();
    }
});

function resetFormState() {
    form.reset();
    editor.innerHTML = ''; 
    imageSortableList.innerHTML = '';
    singleImageInputsContainer.innerHTML = ''; 
    createNewSingleImageInput(); 
    
    editingProductId = null;
    btnText.textContent = 'Guardar Producto';
    btnIcon.setAttribute('data-lucide', 'save');
    lucide.createIcons();
}

// ==========================================
// 5. LÓGICA DE ENVÍO DE DATOS
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar Descripción HTML
// ... existing code ...
    data.foto_5 = imageItems[5]?.dataset.url || null;
    data.foto_6 = imageItems[6]?.dataset.url || null;
    data.foto_7 = imageItems[7]?.dataset.url || null;

    // Si estamos editando un producto, adjuntamos el ID al objeto que enviaremos
    if (editingProductId) {
        data.id = editingProductId;
    }

    try {
        // Determinamos el método: si hay ID editando es un PUT (Actualizar), si no, es un POST (Crear)
        const method = editingProductId ? 'PUT' : 'POST';

        const response = await fetch('/.netlify/functions/products', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // Si la base de datos responde con un error, tratamos de leer su mensaje real
        if (!response.ok) {
            let errorMsg = 'Error al conectar con la base de datos.';
// ... existing code ...
            }
            throw new Error(errorMsg);
        }

        const successMessage = editingProductId ? '¡Producto actualizado exitosamente!' : '¡Producto guardado exitosamente!';
        showAlert('success', successMessage);
        
        // Limpiar todo después de guardar
        resetFormState();
        
        // Comportamiento post-guardado
        if (method === 'PUT') {
            switchTab('inventory'); // Regresar al inventario después de actualizar
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Quedarse en form si solo fue nuevo registro
        }

    } catch (error) {
        // Muestra en la alerta exactamente qué fue lo que falló en Neon DB
        showAlert('error', error.message);
        console.error("Error capturado:", error);
    } finally {
        // Restaurar estado del botón
        submitBtn.disabled = false;
        btnText.textContent = editingProductId ? 'Actualizar Producto' : 'Guardar Producto';
        btnIcon.setAttribute('data-lucide', editingProductId ? 'refresh-cw' : 'save');
        btnIcon.classList.remove('animate-spin');
        lucide.createIcons();
    }
});
