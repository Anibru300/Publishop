export function describeTextLayers(layers) {
    const texts = layers.filter(layer => layer.textStyle);
    return texts.length ? '\nTextos y tipografías: ' + texts.map(layer => {
        const s = layer.textStyle;
        return '“' + s.text + '” · ' + s.fontLabel + (s.bold ? ' · negritas' : '') + (s.italic ? ' · cursiva' : '');
    }).join('; ') : '';
}
export function setupTextTools(addLayer, engraving = false, editor = {}) {
    const box = document.createElement('div'); box.className = 'text-tools';
    box.innerHTML = `<label for="customText">Añadir o editar texto</label><input id="customText" maxlength="100" placeholder="Nombre, frase o texto de tu anuncio">
        <label for="textFont">Tipografía</label><select id="textFont">
            <option value="Arial, sans-serif">Arial · Moderna</option><option value="Georgia, serif">Georgia · Clásica</option>
            <option value="'Segoe Script', 'Brush Script MT', cursive">Manuscrita · Cursiva</option><option value="'Courier New', monospace">Courier · Máquina</option></select>
        <div class="text-style-options"><label><input id="textBold" type="checkbox"> Negritas</label><label><input id="textItalic" type="checkbox"> Cursiva</label></div>
        <label for="textColor">Color del texto</label><input id="textColor" type="color" value="#222222">
        <div class="text-action-buttons"><button id="addText" class="studio-secondary" type="button">Añadir texto</button><button id="updateText" class="studio-secondary" type="button" hidden>Actualizar texto seleccionado</button></div>`;
    document.getElementById('layerList').before(box);
    const $ = id => document.getElementById(id);
    if (engraving) { box.querySelector('[for="textColor"]').hidden = true; $('textColor').hidden = true; }
    function read() {
        return {text:$('customText').value.trim(),fontFamily:$('textFont').value,fontLabel:$('textFont').selectedOptions[0].text,
            bold:$('textBold').checked,italic:$('textItalic').checked,color:engraving ? '#111111' : $('textColor').value};
    }
    function create(style) {
        const measure = document.createElement('canvas').getContext('2d');
        const font = size => (style.italic ? 'italic ' : '') + (style.bold ? '700 ' : '400 ') + size + 'px ' + style.fontFamily;
        measure.font = font(180); const width = measure.measureText(style.text).width;
        const size = Math.min(180,1650 / Math.max(1,width) * 180);
        measure.font = font(size);
        const canvas = document.createElement('canvas'); canvas.width = Math.min(1800,Math.max(80,Math.ceil(measure.measureText(style.text).width + 100))); canvas.height = 300;
        const ctx = canvas.getContext('2d'); ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = style.color; ctx.fillText(style.text,canvas.width / 2,150); return canvas;
    }
    $('addText').addEventListener('click',() => {
        const style = read(); if (!style.text) { $('customText').focus(); return; }
        if (addLayer(create(style),'Texto: ' + style.text,style)) document.getElementById('fileStatus').textContent = 'Texto añadido. Arrástralo en la vista previa o cambia su tamaño desde las esquinas.';
    });
    $('updateText').addEventListener('click',() => {
        const layer = editor.selected?.(), style = read(); if (!layer?.textStyle || !style.text) return;
        editor.update(layer,create(style),style);
        document.getElementById('fileStatus').textContent = 'Texto actualizado. Se conservaron su posición y tamaño.';
        box.dispatchEvent(new Event('change',{bubbles:true}));
    });
    return {sync() {
        const style = editor.selected?.()?.textStyle; $('updateText').hidden = !style;
        if (!style) return;
        $('customText').value = style.text; $('textFont').value = style.fontFamily;
        $('textBold').checked = style.bold; $('textItalic').checked = style.italic; $('textColor').value = style.color;
    }};
}
