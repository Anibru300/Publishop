export function setupTextTools(addLayer, engraving = false) {
    const box = document.createElement('div'); box.className = 'text-tools';
    box.innerHTML = `<label for="customText">Añadir texto a tu diseño</label><input id="customText" maxlength="100" placeholder="Nombre, frase o texto de tu anuncio">
        <label for="textColor">Color del texto</label><input id="textColor" type="color" value="#222222"><button id="addText" class="studio-secondary" type="button">Añadir texto</button>`;
    document.getElementById('layerList').before(box);
    if (engraving) { box.querySelector('[for="textColor"]').hidden = true; document.getElementById('textColor').hidden = true; }
    document.getElementById('addText').addEventListener('click',() => {
        const input = document.getElementById('customText'), text = input.value.trim();
        if (!text) { input.focus(); return; }
        const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 300;
        const ctx = canvas.getContext('2d'); ctx.font = 'bold 180px sans-serif';
        const width = ctx.measureText(text).width;
        ctx.font = 'bold ' + Math.min(180,1650 / Math.max(1,width) * 180) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = engraving ? '#111111' : document.getElementById('textColor').value;
        ctx.fillText(text,900,150);
        if (addLayer(canvas,'Texto: ' + text)) input.value = '';
    });
}
