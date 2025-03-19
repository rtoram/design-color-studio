const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const deleteBtn = document.getElementById('deleteBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const colorPreview = document.getElementById('colorPreview');
const colorPicker = document.getElementById('colorPicker');
const colorInput = document.getElementById('colorInput');
const applyColorBtn = document.getElementById('applyColorBtn');
const pickerBtn = document.getElementById('pickerBtn');
const paletteBtn = document.getElementById('paletteBtn');
const paletteContainer = document.getElementById('paletteContainer');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const gridToggle = document.getElementById('gridToggle');
const toleranceSlider = document.getElementById('toleranceSlider');
const themeToggle = document.getElementById('themeToggle');

let img = new Image();
let originalImgData = null;
let selectedColor = null;
let zoomLevel = 1;
let isPickerActive = false;
let history = [];
let historyIndex = -1;
let showGrid = false;

const colorThief = new ColorThief();

// Upload da imagem
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            img.src = event.target.result;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                originalImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                saveToHistory();
                enableButtons();
            };
        };
        reader.readAsDataURL(file);
    }
});

// Ativar/desativar conta-gotas
pickerBtn.addEventListener('click', () => {
    isPickerActive = !isPickerActive;
    pickerBtn.style.background = isPickerActive ? '#e24a4a' : '';
});

// Conta-gotas
canvas.addEventListener('click', (e) => {
    if (!isPickerActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    colorPreview.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    colorInput.value = hex;
});

// Zoom
zoomInBtn.addEventListener('click', () => {
    zoomLevel += 0.2;
    updateCanvas();
});

zoomOutBtn.addEventListener('click', () => {
    zoomLevel = Math.max(0.2, zoomLevel - 0.2);
    updateCanvas();
});

function updateCanvas() {
    canvas.style.width = `${img.width * zoomLevel}px`;
    canvas.style.height = `${img.height * zoomLevel}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    if (showGrid) drawGrid();
}

// Grade
gridToggle.addEventListener('click', () => {
    showGrid = !showGrid;
    updateCanvas();
});

function drawGrid() {
    const gridSize = 20;
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Sincronizar color picker com input HEX
colorPicker.addEventListener('input', () => {
    colorInput.value = colorPicker.value;
});

// Gerar paleta automática
paletteBtn.addEventListener('click', () => {
    if (!img.src) return;
    const palette = colorThief.getPalette(img, 10);
    paletteContainer.innerHTML = '';
    palette.forEach(color => {
        const hex = rgbToHex(color[0], color[1], color[2]);
        const div = document.createElement('div');
        div.className = 'palette-color';
        div.style.backgroundColor = hex;
        div.title = hex;
        div.addEventListener('click', () => {
            colorInput.value = hex;
            colorPicker.value = hex;
        });
        paletteContainer.appendChild(div);
    });
});

// Converter RGB para HEX
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

// Converter HEX para RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Verificar tolerância
function isColorSimilar(color1, color2, tolerance) {
    return (
        Math.abs(color1.r - color2.r) <= tolerance &&
        Math.abs(color1.g - color2.g) <= tolerance &&
        Math.abs(color1.b - color2.b) <= tolerance
    );
}

// Aplicar nova cor
applyColorBtn.addEventListener('click', () => {
    if (!selectedColor || !colorInput.value) {
        alert('Selecione uma cor da imagem e escolha uma nova cor!');
        return;
    }

    const newColor = hexToRgb(colorInput.value);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const tolerance = parseInt(toleranceSlider.value);

    for (let i = 0; i < data.length; i += 4) {
        const currentColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
        if (isColorSimilar(currentColor, selectedColor, tolerance)) {
            data[i] = newColor.r;
            data[i + 1] = newColor.g;
            data[i + 2] = newColor.b;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
});

// Histórico
function saveToHistory() {
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndex++;
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}

undoBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--;
        ctx.putImageData(history[historyIndex], 0, 0);
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = false;
    }
});

redoBtn.addEventListener('click', () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        ctx.putImageData(history[historyIndex], 0, 0);
        redoBtn.disabled = historyIndex >= history.length - 1;
        undoBtn.disabled = false;
    }
});

// Download
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Restaurar original
resetBtn.addEventListener('click', () => {
    if (originalImgData) {
        ctx.putImageData(originalImgData, 0, 0);
        zoomLevel = 1;
        updateCanvas();
        saveToHistory();
    }
});

// Deletar imagem
deleteBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    img = new Image();
    originalImgData = null;
    selectedColor = null;
    history = [];
    historyIndex = -1;
    zoomLevel = 1;
    canvas.style.width = '0';
    canvas.style.height = '0';
    paletteContainer.innerHTML = '';
    colorPreview.style.backgroundColor = '';
    colorInput.value = '';
    disableButtons();
});

// Tema claro/escuro
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('light');
});

function enableButtons() {
    downloadBtn.disabled = false;
    resetBtn.disabled = false;
    deleteBtn.disabled = false;
    applyColorBtn.disabled = false;
}

function disableButtons() {
    downloadBtn.disabled = true;
    resetBtn.disabled = true;
    deleteBtn.disabled = true;
    applyColorBtn.disabled = true;
    undoBtn.disabled = true;
    redoBtn.disabled = true;
}
