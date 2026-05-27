// Inicializar iconos de la interfaz al cargar
lucide.createIcons();

// Referencias al DOM principales
const form = document.getElementById('productForm');
const editor = document.getElementById('descriptionEditor');
const formatBtns = document.querySelectorAll('.format-btn');
const alertBox = document.getElementById('alertBox');
const alertIcon = document.getElementById('alertIcon');
const alertMessage = document.getElementById('alertMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');

// Referencias de Gestión de Imágenes
const imageUrlList = document.getElementById('image-url-list');
const processUrlsBtn = document.getElementById('process-urls-btn');
const imageSortableList = document.getElementById('image-sortable-list');
const singleImageInputsContainer = document.getElementById('single-image-inputs-container');
const addSingleUrlFieldBtn = document.getElementById('add-single-url-field-btn');
const imagePreviewModal = document.getElementById('image-preview-modal');
const previewImage = document.getElementById('preview-image');
const closePreviewBtn = document.getElementById('close-preview-btn');

let sortable = null;

// ==========================================
// 1. LÓGICA DEL EDITOR DE TEXTO (WORD)
// ==========================================
formatBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.getAttribute('data-command');
        const value = btn.getAttribute('data-value') || null;
        document.execCommand(command, false, value);
        editor.focus();
    });
});


// ==========================================
// 2. LÓGICA DE ALERTAS (UI)
// ==========================================
function showAlert(type, message) {
    alertBox.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'border-green-200', 'bg-red-50', 'text-red-800', 'border-red-200');
    
    if (type === 'success') {
        alertBox.classList.add('bg-green-50', 'text-green-800', 'border-green-200');
        alertIcon.setAttribute('data-lucide', 'check-circle');
    } else {
        alertBox.classList.add('bg-red-50', 'text-red-800', 'border-red-200');
        alertIcon.setAttribute('data-lucide', 'alert-circle');
    }
    
    alertMessage.textContent = message;
    lucide.createIcons();
    
    // Ocultar automáticamente tras 5 segundos si es éxito
    if(type === 'success') {
        setTimeout(() => alertBox.classList.add('hidden'), 5000);
    }
}


// ==========================================
// 3. LÓGICA DE GESTIÓN DE IMÁGENES
// ==========================================

// Función para transformar URLs de Google Drive
function convertGoogleDriveUrl(url) {
    if (!url) return '';
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return (match && match[1]) ? `https://lh3.googleusercontent.com/d/${match[1]}=w1000?authuser=0` : url;
}

// Actualizar numeración visual de la lista ordenable
const updateImageNumbers = () => {
    const imageItems = imageSortableList.querySelectorAll('div[data-url]');
    imageItems.forEach((item, index) => {
        const numberEl = item.querySelector('.image-number');
        if (numberEl) {
            numberEl.textContent = `${index + 1}.`;
            // Resaltar el número 1 como la principal
            if (index === 0) {
                numberEl.classList.add('text-indigo-600', 'font-bold');
                numberEl.classList.remove('text-slate-500');
            } else {
                numberEl.classList.remove('text-indigo-600', 'font-bold');
                numberEl.classList.add('text-slate-500');
            }
        }
    });
};

// Agregar una nueva imagen a la lista de arrastrar y soltar
const addUrlToSorter = (url) => {
    if (!url) return;
    const existingUrls = Array.from(imageSortableList.querySelectorAll('div[data-url]')).map(div => div.dataset.url);
    if (existingUrls.includes(url)) {
        showAlert('error', 'Esa imagen ya se encuentra en la lista.');
        return;
    }

    // Límite de 8 imágenes
    if (existingUrls.length >= 8) {
        showAlert('error', 'Solo puedes agregar un máximo de 8 fotos por producto.');
        return;
    }

    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 p-2 bg-slate-50 rounded-lg border border-slate-200 group';
    div.dataset.url = url;

    // Usamos SVGs crudos para evitar re-renderizar todo Lucide en cada inserción
    div.innerHTML = `
        <span class="image-number text-sm font-semibold text-slate-500 w-5 text-center"></span>
        
        <svg class="w-6 h-6 text-slate-400 drag-handle cursor-grab hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        
        <img src="${url}" onerror="this.onerror=null;this.src='https://placehold.co/40x40/f8fafc/94a3b8?text=Err';" class="w-12 h-12 rounded shadow-sm object-cover bg-white cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-slate-200">
        
        <p class="flex-grow text-xs text-slate-600 truncate px-2">${url}</p>
        
        <button type="button" class="text-xl text-red-400 hover:text-red-600 remove-image-btn p-1 font-bold">&times;</button>
    `;

    // Eventos de la imagen (preview y eliminar)
    div.querySelector('img').addEventListener('click', () => openImagePreview(url));
    div.querySelector('.remove-image-btn').addEventListener('click', () => {
        div.remove();
        updateImageNumbers();
    });

    imageSortableList.appendChild(div);
    updateImageNumbers();
};

// Crear input dinámico para una sola imagen
const createNewSingleImageInput = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center space-x-2 single-url-wrapper';

    wrapper.innerHTML = `
        <input type="url" class="w-full px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Pegar URL y presionar Guardar">
        <button type="button" class="text-sm bg-slate-800 text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors save-single-url-btn">Guardar</button>
        <button type="button" class="text-xl text-slate-400 hover:text-red-500 font-bold px-2 py-1 rounded-lg transition-colors remove-single-url-btn">&times;</button>
    `;

    const input = wrapper.querySelector('input');
    const saveBtn = wrapper.querySelector('.save-single-url-btn');
    const removeBtn = wrapper.querySelector('.remove-single-url-btn');

    const saveUrlAction = () => {
        const url = convertGoogleDriveUrl(input.value.trim());
        if (url) {
            addUrlToSorter(url);
            input.value = ''; // Limpiar input
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evitar submit del form general
            saveUrlAction();
        }
    });

    saveBtn.addEventListener('click', saveUrlAction);
    removeBtn.addEventListener('click', () => wrapper.remove());

    singleImageInputsContainer.appendChild(wrapper);
    input.focus();
};

// Procesar lista de URLs separadas por coma
processUrlsBtn.addEventListener('click', () => {
    const urls = imageUrlList.value.split(',')
        .map(url => convertGoogleDriveUrl(url.trim()))
        .filter(url => url);
        
    urls.forEach(url => addUrlToSorter(url));
    imageUrlList.value = ''; // Limpiar textarea
});

// Eventos de botones de imágenes
addSingleUrlFieldBtn.addEventListener('click', createNewSingleImageInput);

// Modal de Previsualización de Imágenes
function openImagePreview(imageUrl) {
    if (imageUrl && !imageUrl.includes('placehold.co')) {
        previewImage.src = imageUrl;
        imagePreviewModal.classList.remove('hidden');
    }
}
function closeImagePreview() {
    imagePreviewModal.classList.add('hidden');
    previewImage.src = '';
}
closePreviewBtn.addEventListener('click', closeImagePreview);
imagePreviewModal.addEventListener('click', (e) => {
    if (e.target === imagePreviewModal) closeImagePreview();
});

// Iniciar SortableJS (Arrastrar y soltar)
sortable = new Sortable(imageSortableList, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    onEnd: function () {
        updateImageNumbers();
    }
});

// Crear el primer input de imagen individual por defecto
createNewSingleImageInput();


// ==========================================
// 4. LÓGICA DE ENVÍO DE DATOS
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Validar Descripción HTML
    const descriptionHtml = editor.innerHTML.trim();
    if (!descriptionHtml) {
        showAlert('error', 'La descripción no puede estar vacía.');
        return;
    }

    // 2. Extraer Imágenes de la lista ordenable
    const imageItems = imageSortableList.querySelectorAll('div[data-url]');
    if (imageItems.length === 0) {
        showAlert('error', 'Debes agregar al menos la Imagen Principal en la sección de Gestión de Fotos.');
        return;
    }

    // Cambiar Botón a "Cargando"
    submitBtn.disabled = true;
    btnText.textContent = 'Guardando...';
    btnIcon.setAttribute('data-lucide', 'loader-2');
    btnIcon.classList.add('animate-spin');
    lucide.createIcons();

    // 3. Recopilar datos del formulario
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Insertar descripción HTML
    data.description = descriptionHtml;
    
    // Insertar imágenes según su orden
    // La primera es image_link, del 1 al 7 son foto_1 a foto_7
    data.image_link = imageItems[0]?.dataset.url || '';
    data.foto_1 = imageItems[1]?.dataset.url || null;
    data.foto_2 = imageItems[2]?.dataset.url || null;
    data.foto_3 = imageItems[3]?.dataset.url || null;
    data.foto_4 = imageItems[4]?.dataset.url || null;
    data.foto_5 = imageItems[5]?.dataset.url || null;
    data.foto_6 = imageItems[6]?.dataset.url || null;
    data.foto_7 = imageItems[7]?.dataset.url || null;

    try {
        // LLAMADA A NETLIFY FUNCTIONS
        const response = await fetch('/.netlify/functions/addProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Error de conexión con el servidor (Netlify).');

        showAlert('success', '¡Producto guardado exitosamente en Neon!');
        
        // Limpiar el formulario y el editor
        form.reset();
        editor.innerHTML = ''; 
        imageSortableList.innerHTML = ''; // Limpiar fotos
        singleImageInputsContainer.innerHTML = ''; 
        createNewSingleImageInput(); // Restablecer un campo de imagen
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        showAlert('error', error.message || 'Ocurrió un problema inesperado al guardar.');
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        btnText.textContent = 'Guardar Producto';
        btnIcon.setAttribute('data-lucide', 'save');
        btnIcon.classList.remove('animate-spin');
        lucide.createIcons();
    }
});
