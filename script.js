const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const deleteBtn = document.getElementById('deleteBtn');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');

let zoomLevel = 1;
let originalImgData = null;

// Após carregar a imagem
img.onload = () => {
    console.log('Passo 3: Imagem carregada - Dimensões:', img.width, 'x', img.height);
    canvas.width = img.width;
    canvas.height = img.height;
    console.log('Passo 4: Canvas redimensionado -', canvas.width, 'x', canvas.height);
    ctx.drawImage(img, 0, 0);
    originalImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log('Passo 5: Imagem desenhada no canvas');
    updateCanvas();
    downloadBtn.disabled = false;
    resetBtn.disabled = false;
    deleteBtn.disabled = false;
};

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
}

// Download
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Restaurar
resetBtn.addEventListener('click', () => {
    ctx.putImageData(originalImgData, 0, 0);
    zoomLevel = 1;
    updateCanvas();
});

// Deletar
deleteBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    img = new Image();
    canvas.style.width = '0';
    canvas.style.height = '0';
    downloadBtn.disabled = true;
    resetBtn.disabled = true;
    deleteBtn.disabled = true;
});
