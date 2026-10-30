export function setupLayerDimensions(api) {
    let frame = 0, dirty = false;
    const scheduleChange = () => {
        dirty = true;
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; if (dirty) { dirty = false; api.changed(true); } });
    };
    const finishChange = () => {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        if (dirty) { dirty = false; api.changed(false); }
    };
    const box = document.createElement('div'); box.className = 'layer-dimensions';
    box.innerHTML = '<label for="designStretchX">Ancho del diseño (%)</label><input id="designStretchX" type="range" min="5" max="500" value="100"><label for="designStretchY">Alto del diseño (%)</label><input id="designStretchY" type="range" min="5" max="500" value="100">';
    document.getElementById('designScale').after(box);
    for (const [id,key] of [['designStretchX','stretchX'],['designStretchY','stretchY']]) document.getElementById(id).addEventListener('input',() => {
        const layer = api.selected(); if (!layer) return; layer[key] = Number(document.getElementById(id).value) / 100; scheduleChange();
    });
    for (const id of ['designStretchX','designStretchY']) document.getElementById(id).addEventListener('change',finishChange);
    const align = document.createElement('div'); align.className = 'align-tools';
    for (const [key,label] of [['top','Arriba'],['bottom','Abajo'],['left','Izquierda'],['right','Derecha'],['center','Centrar']]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.align = key;
        button.addEventListener('click',() => {
            const layer = api.selected(); if (!layer) return;
            const d = api.dimensions(layer), a = layer.rotation * Math.PI / 180;
            const halfW = Math.min(.5,(Math.abs(d.width * Math.cos(a)) + Math.abs(d.height * Math.sin(a))) / d.canvasWidth / 2);
            const halfH = Math.min(.5,(Math.abs(d.width * Math.sin(a)) + Math.abs(d.height * Math.cos(a))) / d.canvasHeight / 2);
            if (key === 'top') layer.y = (-.5 + halfH) * 100;
            if (key === 'bottom') layer.y = (.5 - halfH) * 100;
            if (key === 'left') layer.x = (halfW - d.centerU) * 100;
            if (key === 'right') layer.x = (1 - halfW - d.centerU) * 100;
            if (key === 'center') { layer.x = 0; layer.y = 0; }
            api.changed(); document.dispatchEvent(new Event('designchange'));
        }); align.appendChild(button);
    }
    document.getElementById('clearDesign').before(align);
    return {sync() { const l = api.selected(); document.getElementById('designStretchX').value = (l?.stretchX ?? 1) * 100; document.getElementById('designStretchY').value = (l?.stretchY ?? 1) * 100; }};
}
