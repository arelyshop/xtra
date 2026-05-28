// Inicializar iconos de la interfaz al cargar
lucide.createIcons();

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

// Gestión de Imágenes
const imageUrlList = document.getElementById('image-url-list');
const processUrlsBtn = document.getElementById('process-urls-btn');
const imageSortableList = document.getElementById('image-sortable-list');
const singleImageInputsContainer = document.getElementById('single-image-inputs-container');
const addSingleUrlFieldBtn = document.getElementById('add-single-url-field-btn');
const imagePreviewModal = document.getElementById('image-preview-modal');
const previewImage = document.getElementById('preview-image');
const closePreviewBtn = document.getElementById('close-preview-btn');
let sortable = null;

// Escáner de Código de Barras
const scanBarcodeBtn = document.getElementById('scan-barcode-btn');
const scannerContainer = document.getElementById('scanner-container');
const closeScannerBtn = document.getElementById('close-scanner-btn');
const barcodeInput = document.getElementById('barcode');
let html5QrCode = null;


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
function convertGoogleDriveUrl(url) {
    if (!url) return '';
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return (match && match[1]) ? `https://lh3.googleusercontent.com/d/${match[1]}=w1000?authuser=0` : url;
}

const updateImageNumbers = () => {
    const imageItems = imageSortableList.querySelectorAll('div[data-url]');
    imageItems.forEach((item, index) => {
        const numberEl = item.querySelector('.image-number');
        if (numberEl) {
            numberEl.textContent = `${index + 1}.`;
            if (index === 0) {
                numberEl.classList.add('text-indigo-400', 'font-bold');
                numberEl.classList.remove('text-gray-400');
            } else {
                numberEl.classList.remove('text-indigo-400', 'font-bold');
                numberEl.classList.add('text-gray-400');
            }
        }
    });
};

const addUrlToSorter = (url) => {
    if (!url) return;
    const existingUrls = Array.from(imageSortableList.querySelectorAll('div[data-url]')).map(div => div.dataset.url);
    if (existingUrls.includes(url)) {
        showAlert('error', 'Esa imagen ya se encuentra en la lista.');
        return;
    }

    if (existingUrls.length >= 8) {
        showAlert('error', 'Solo puedes agregar un máximo de 8 fotos por producto.');
        return;
    }

    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 p-2 bg-gray-900 rounded-lg border border-gray-700 group';
    div.dataset.url = url;

    div.innerHTML = `
        <span class="image-number text-sm font-semibold text-gray-400 w-5 text-center"></span>
        <svg class="w-6 h-6 text-gray-500 drag-handle cursor-grab hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <img src="${url}" onerror="this.onerror=null;this.src='https://placehold.co/40x40/1f2937/9ca3af?text=Err';" class="w-12 h-12 rounded shadow-sm object-cover bg-gray-800 cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-gray-600">
        <p class="flex-grow text-xs text-gray-400 truncate px-2">${url}</p>
        <button type="button" class="text-xl text-red-500 hover:text-red-400 remove-image-btn p-1 font-bold">&times;</button>
    `;

    div.querySelector('img').addEventListener('click', () => openImagePreview(url));
    div.querySelector('.remove-image-btn').addEventListener('click', () => {
        div.remove();
        updateImageNumbers();
    });

    imageSortableList.appendChild(div);
    updateImageNumbers();
};

const createNewSingleImageInput = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center space-x-2 single-url-wrapper';

    wrapper.innerHTML = `
        <input type="url" class="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500" placeholder="Pegar URL y presionar Guardar">
        <button type="button" class="text-sm bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors save-single-url-btn">Guardar</button>
        <button type="button" class="text-xl text-gray-500 hover:text-red-500 font-bold px-2 py-1 rounded-lg transition-colors remove-single-url-btn">&times;</button>
    `;

    const input = wrapper.querySelector('input');
    const saveBtn = wrapper.querySelector('.save-single-url-btn');
    const removeBtn = wrapper.querySelector('.remove-single-url-btn');

    const saveUrlAction = () => {
        const url = convertGoogleDriveUrl(input.value.trim());
        if (url) {
            addUrlToSorter(url);
            input.value = '';
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveUrlAction();
        }
    });

    saveBtn.addEventListener('click', saveUrlAction);
    removeBtn.addEventListener('click', () => wrapper.remove());

    singleImageInputsContainer.appendChild(wrapper);
    input.focus();
};

processUrlsBtn.addEventListener('click', () => {
    const urls = imageUrlList.value.split(',')
        .map(url => convertGoogleDriveUrl(url.trim()))
        .filter(url => url);
        
    urls.forEach(url => addUrlToSorter(url));
    imageUrlList.value = ''; 
});

addSingleUrlFieldBtn.addEventListener('click', createNewSingleImageInput);

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

sortable = new Sortable(imageSortableList, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    onEnd: function () {
        updateImageNumbers();
    }
});

// Inicializar un input vacío por defecto
createNewSingleImageInput();


// ==========================================
// 4. LÓGICA DEL ESCÁNER DE CÓDIGOS DE BARRAS
// ==========================================
function startScanner() {
    scannerContainer.classList.remove('hidden');
    scannerContainer.classList.add('flex');

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        barcodeInput.value = decodedText;
        stopScanner();
        showAlert('success', 'Código escaneado correctamente.');
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error(`Error al iniciar escáner: ${err}`);
            showAlert('error', 'No se pudo acceder a la cámara. Verifica los permisos.');
            stopScanner();
        });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {}).catch(err => console.error(err));
    }
    scannerContainer.classList.add('hidden');
    scannerContainer.classList.remove('flex');
}

scanBarcodeBtn.addEventListener('click', startScanner);
closeScannerBtn.addEventListener('click', stopScanner);


// ==========================================
// 5. LÓGICA DE ENVÍO DE DATOS
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar Descripción HTML
    const descriptionHtml = editor.innerHTML.trim();
    if (!descriptionHtml) {
        showAlert('error', 'La descripción no puede estar vacía.');
        return;
    }

    // Extraer Imágenes ordenadas
    const imageItems = imageSortableList.querySelectorAll('div[data-url]');
    if (imageItems.length === 0) {
        showAlert('error', 'Debes agregar al menos la Imagen Principal.');
        return;
    }

    // Estado Cargando
    submitBtn.disabled = true;
    btnText.textContent = 'Guardando...';
    btnIcon.setAttribute('data-lucide', 'loader-2');
    btnIcon.classList.add('animate-spin');
    lucide.createIcons();

    // Recopilar FormData nativo
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Inyectar HTML y Fotos mapeadas al objeto final
    data.description = descriptionHtml;
    data.image_link = imageItems[0]?.dataset.url || '';
    data.foto_1 = imageItems[1]?.dataset.url || null;
    data.foto_2 = imageItems[2]?.dataset.url || null;
    data.foto_3 = imageItems[3]?.dataset.url || null;
    data.foto_4 = imageItems[4]?.dataset.url || null;
    data.foto_5 = imageItems[5]?.dataset.url || null;
    data.foto_6 = imageItems[6]?.dataset.url || null;
    data.foto_7 = imageItems[7]?.dataset.url || null;

    try {
        // ENLACE CORREGIDO: Llamando a products.js en lugar de addProduct.js
        const response = await fetch('/.netlify/functions/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // Si la base de datos responde con un error, tratamos de leer su mensaje real
        if (!response.ok) {
            let errorMsg = 'Error al conectar con la base de datos.';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
                // Falla al parsear JSON, conservamos el mensaje genérico
            }
            throw new Error(errorMsg);
        }

        showAlert('success', '¡Producto guardado exitosamente en la Base de Datos!');
        
        // Limpiar todo después de guardar
        form.reset();
        editor.innerHTML = ''; 
        imageSortableList.innerHTML = '';
        singleImageInputsContainer.innerHTML = ''; 
        createNewSingleImageInput(); 
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        // Muestra en la alerta exactamente qué fue lo que falló en Neon DB
        showAlert('error', error.message);
        console.error("Error capturado:", error);
    } finally {
        // Restaurar estado del botón
        submitBtn.disabled = false;
        btnText.textContent = 'Guardar Producto';
        btnIcon.setAttribute('data-lucide', 'save');
        btnIcon.classList.remove('animate-spin');
        lucide.createIcons();
    }
});
