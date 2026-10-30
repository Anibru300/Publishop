import { setupCompletion, downloadCanvas } from './finish-order.js';
import { setupTextTools, describeTextLayers } from './text-tools.js';
import { setupDirectEditing } from './direct-edit.js';
const $ = id => document.getElementById(id);
const types = {
    pen: {name:'Pluma',intro:'Grabado láser únicamente. Diseña un nombre, una frase o un logotipo.',technique:'Grabado láser únicamente',laser:true,two:true},
    thermos: {name:'Termo',intro:'Crea tu propuesta de grabado láser en un solo tono.',technique:'Grabado láser',laser:true,two:true},
    banner: {name:'Lona',intro:'Combina imágenes y texto para tu anuncio. Indica las medidas que necesitas.',technique:'Impresión de lona'},
    mdf: {name:'Figura MDF',intro:'Elige una forma de muestra y agrega tu nombre, logotipo o referencia para corte o grabado.',technique:'Corte o grabado láser en MDF'},
    puzzle: {name:'Rompecabezas',intro:'Crea tu composición. Las divisiones son ilustrativas; indica al cotizar cuántas piezas necesitas.',technique:'Personalización de rompecabezas'}
};
const requested = new URLSearchParams(location.search).get('producto');
const type = Object.hasOwn(types,requested) ? requested : 'banner', config = types[type];
const layers = []; let face = 'front', selectedId = null, nextId = 1, uploading = false;
let directEditor, textTools;
$('productTitle').textContent = config.name; $('productIntro').textContent = config.intro;
document.title = 'Diseña tu ' + config.name.toLowerCase() + ' | PUBLI SHOP LEÓN GTO';
$('faceSelector').hidden = !config.two;
const options = $('productOptions');
options.innerHTML = '<p>' + config.technique + '</p>';
if (config.laser) options.innerHTML += '<label for="baseColor">Color del producto</label><select id="baseColor">' + (type === 'pen'
    ? '<option value="#222222">Negro</option><option value="#b12b39">Rojo</option><option value="#e788b9">Rosa</option><option value="#1849d4">Azul fuerte</option><option value="#ffffff">Blanco</option>'
    : '<option value="#222222">Negro</option><option value="#214b93">Azul</option><option value="#b12b39">Rojo</option><option value="#9ca3af">Plateado</option>') + '</select><p class="studio-help">La vista convierte tu imagen en una referencia de grabado monocromático. El tono real depende del material y se confirma al cotizar.</p>';
else {
    options.innerHTML += '<label for="boardWidth">Ancho deseado (cm)</label><input id="boardWidth" type="number" min="1" max="1000" value="' + (type === 'banner' ? 100 : 20) + '"><label for="boardHeight">Alto deseado (cm)</label><input id="boardHeight" type="number" min="1" max="1000" value="' + (type === 'banner' ? 70 : 15) + '">';
    if (type === 'mdf') options.innerHTML += '<label for="mdfMode">Trabajo solicitado</label><select id="mdfMode"><option value="cut">Corte de figura según referencia</option><option value="engrave">Grabado láser</option></select><label for="boardShape">Forma de muestra</label><select id="boardShape"><option value="rectangle">Rectangular</option><option value="circle">Circular</option><option value="heart">Corazón</option><option value="star">Estrella</option></select><p class="studio-help">Para una silueta distinta, sube tu referencia e indica las medidas. Revisaremos el contorno, el espesor y la viabilidad del corte antes de producir.</p>';
}
if (type === 'banner') options.innerHTML += '<label class="heat-toggle"><input id="hasEyelets" type="checkbox" checked> Con ojillos</label><div id="eyeletOptions"><label for="eyeletPosition">¿Dónde van los ojillos?</label><select id="eyeletPosition"><option value="corners">Solo en las cuatro esquinas</option><option value="perimeter">Todo el perímetro</option><option value="top-bottom">Arriba y abajo</option><option value="top">Solo arriba</option><option value="sides">Laterales izquierdo y derecho</option></select><label for="eyeletSpacing">Separación aproximada solicitada (cm)</label><input id="eyeletSpacing" type="number" min="5" max="500" value="50"><p class="studio-help">Los puntos muestran dónde irían. La cantidad y separación finales se confirman al cotizar. Para otra distribución, indícala en las notas.</p></div>';
const monochrome = source => {
    const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(source,0,0);
    const data = ctx.getImageData(0,0,canvas.width,canvas.height), p = data.data;
    const corners = [0,(canvas.width - 1) * 4,(canvas.height - 1) * canvas.width * 4,(canvas.width * canvas.height - 1) * 4];
    const whiteBackground = corners.every(i => p[i] > 245 && p[i + 1] > 245 && p[i + 2] > 245 && p[i + 3] > 245);
    for (let i = 0; i < p.length; i += 4) {
        const darkness = 1 - (p[i] * .2126 + p[i + 1] * .7152 + p[i + 2] * .0722) / 255;
        p[i + 3] *= whiteBackground ? darkness : .25 + .75 * darkness;
        const tint = type === 'mdf' ? [89,48,21] : [230,230,235]; [p[i],p[i + 1],p[i + 2]] = tint;
    }
    ctx.putImageData(data,0,0); return canvas;
};
function summary() {
    let text = config.name + ' · ' + config.technique;
    if (config.laser) text += ' · ' + $('baseColor').selectedOptions[0].text;
    else text += ' · ' + $('boardWidth').value + ' × ' + $('boardHeight').value + ' cm solicitados';
    if (type === 'mdf') text += ' · ' + $('mdfMode').selectedOptions[0].text + ' · ' + $('boardShape').selectedOptions[0].text;
    if (type === 'banner') text += $('hasEyelets').checked ? ' · Con ojillos: ' + $('eyeletPosition').selectedOptions[0].text + ($('eyeletPosition').value !== 'corners' ? ' · separación solicitada ' + $('eyeletSpacing').value + ' cm' : '') : ' · Sin ojillos';
    return text;
}
function boardMetrics() {
    let w, h;
    if (config.laser) { w = type === 'pen' ? 900 : 300; h = type === 'pen' ? 85 : 580; }
    else { const ratio = Math.max(.15,Math.min(6,Number($('boardWidth').value || 1) / Number($('boardHeight').value || 1))); w = Math.min(870,570 * ratio); h = w / ratio; }
    return {x:(1200 - w) / 2,y:(900 - h) / 2,w,h};
}
function eyeletPoints(x,y,w,h) {
    if (!$('hasEyelets')?.checked) return [];
    const mode = $('eyeletPosition').value, inset = Math.min(12,w / 8,h / 8), points = [];
    const width = Math.max(1,Number($('boardWidth').value)), height = Math.max(1,Number($('boardHeight').value));
    const spacing = Math.max(5,Number($('eyeletSpacing').value) || 50);
    const edge = (x1,y1,x2,y2,length) => { const steps = Math.min(200,Math.max(1,Math.ceil(length / spacing))); for (let i = 0; i <= steps; i++) points.push([x1 + (x2 - x1) * i / steps,y1 + (y2 - y1) * i / steps]); };
    const left = x + inset, right = x + w - inset, top = y + inset, bottom = y + h - inset;
    if (mode === 'corners') return [[left,top],[right,top],[left,bottom],[right,bottom]];
    if (['perimeter','top-bottom','top'].includes(mode)) edge(left,top,right,top,width);
    if (['perimeter','top-bottom'].includes(mode)) edge(left,bottom,right,bottom,width);
    if (['perimeter','sides'].includes(mode)) { edge(left,top,left,bottom,height); edge(right,top,right,bottom,height); }
    return [...new Map(points.map(p => [p.map(n => n.toFixed(2)).join(','),p])).values()];
}
function boardPath(ctx,x,y,w,h) {
    ctx.beginPath(); const shape = $('boardShape')?.value;
    if (shape === 'circle') ctx.ellipse(x + w / 2,y + h / 2,w / 2,h / 2,0,0,Math.PI * 2);
    else if (shape === 'heart') {
        ctx.moveTo(x + w / 2,y + h); ctx.bezierCurveTo(x - w * .3,y + h * .45,x,y - h * .35,x + w / 2,y + h * .22);
        ctx.bezierCurveTo(x + w,y - h * .35,x + w * 1.3,y + h * .45,x + w / 2,y + h);
    } else if (shape === 'star') {
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; const px = x + w / 2 + Math.cos(a) * w / 2 * r, py = y + h / 2 + Math.sin(a) * h / 2 * r; if (i) ctx.lineTo(px,py); else ctx.moveTo(px,py); }
        ctx.closePath();
    } else ctx.roundRect(x,y,w,h,type === 'thermos' ? 28 : type === 'pen' ? 12 : 2);
}
function draw(ctx,W,H,side) {
    ctx.fillStyle = '#8c99af'; ctx.fillRect(0,0,W,H); ctx.save();
    const scale = Math.min(W / 1200,H / 900); ctx.translate((W - 1200 * scale) / 2,(H - 900 * scale) / 2); ctx.scale(scale,scale);
    const {x,y,w,h} = boardMetrics();
    boardPath(ctx,x,y,w,h); ctx.fillStyle = type === 'mdf' ? '#c89c64' : config.laser ? $('baseColor').value : '#ffffff'; ctx.fill();
    ctx.save(); boardPath(ctx,x,y,w,h); ctx.clip();
    if (type === 'mdf') {
        ctx.strokeStyle = '#9b6f3c33'; ctx.lineWidth = 2;
        for (let iy = y; iy < y + h; iy += 14) { ctx.beginPath(); ctx.moveTo(x,iy); ctx.bezierCurveTo(x + w * .3,iy - 8,x + w * .7,iy + 9,x + w,iy); ctx.stroke(); }
    }
    for (const l of layers.filter(l => !config.two || l.face === side)) {
        let image = config.laser || (type === 'mdf' && $('mdfMode').value === 'engrave') ? l.engraving : l.image;
        if (config.laser && ['#ffffff','#9ca3af'].includes($('baseColor').value)) {
            if (!l.darkEngraving) {
                const tint = document.createElement('canvas'); tint.width = l.engraving.width; tint.height = l.engraving.height;
                const t = tint.getContext('2d'); t.drawImage(l.engraving,0,0); t.globalCompositeOperation = 'source-in'; t.fillStyle = '#49414b'; t.fillRect(0,0,tint.width,tint.height); l.darkEngraving = tint;
            }
            image = l.darkEngraving;
        }
        const fit = Math.min(w * .85 / image.width,h * .85 / image.height) * l.scale / 100;
        ctx.save(); ctx.translate(x + w * (.5 + l.x / 100),y + h * (.5 + l.y / 100)); ctx.rotate(l.rotation * Math.PI / 180);
        ctx.drawImage(image,-image.width * fit / 2,-image.height * fit / 2,image.width * fit,image.height * fit); ctx.restore();
    }
    if (config.laser) {
        const gradient = ctx.createLinearGradient(type === 'pen' ? x : x,y,type === 'pen' ? x : x + w,type === 'pen' ? y + h : y);
        gradient.addColorStop(0,'#00000066'); gradient.addColorStop(.4,'#ffffff22'); gradient.addColorStop(.7,'#ffffff00'); gradient.addColorStop(1,'#00000066'); ctx.fillStyle = gradient; ctx.fillRect(x,y,w,h);
    }
    ctx.restore();
    ctx.strokeStyle = '#3d302f'; ctx.lineWidth = 3; boardPath(ctx,x,y,w,h); ctx.stroke();
    if (type === 'pen') {
        ctx.fillStyle = '#c5c9cf'; ctx.beginPath(); ctx.moveTo(x + w,y); ctx.lineTo(x + w + 65,y + h / 2); ctx.lineTo(x + w,y + h); ctx.fill();
        ctx.fillRect(x + 35,y - 8,170,12);
    }
    if (type === 'thermos') { ctx.fillStyle = '#363b43'; ctx.fillRect(x + 4,y - 22,w - 8,28); ctx.fillStyle = '#b0b6c0'; ctx.fillRect(x + 5,y + h - 14,w - 10,14); }
    if (type === 'banner') {
        for (const [px,py] of eyeletPoints(x,y,w,h)) { ctx.fillStyle = '#d7dce2'; ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#59616b'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#8c99af'; ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI * 2); ctx.fill(); }
    }
    if (type === 'puzzle') {
        ctx.save(); boardPath(ctx,x,y,w,h); ctx.clip(); ctx.strokeStyle = '#33333388'; ctx.lineWidth = 2;
        for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + w * i / 5,y); for (let j = 0; j < 4; j++) { const px = x + w * i / 5, py = y + h * (j + .5) / 4; ctx.lineTo(px,py - 10); ctx.bezierCurveTo(px + 20,py - 20,px + 20,py + 20,px,py + 10); } ctx.lineTo(x + w * i / 5,y + h); ctx.stroke(); }
        for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x,y + h * j / 4); for (let i = 0; i < 5; i++) { const px = x + w * (i + .5) / 5, py = y + h * j / 4; ctx.lineTo(px - 10,py); ctx.bezierCurveTo(px - 20,py - 20,px + 20,py - 20,px + 10,py); } ctx.lineTo(x + w,y + h * j / 4); ctx.stroke(); } ctx.restore();
    }
    ctx.restore();
}
function render() { const c = $('flatPreview'); draw(c.getContext('2d'),c.width,c.height,face); directEditor?.update(); }
function refresh() {
    const layer = layers.find(l => l.id === selectedId);
    $('designControls').disabled = !layer; $('designFile').disabled = uploading || layers.length >= 5; $('designCount').textContent = layers.length + ' de 5 diseños';
    $('layerList').replaceChildren();
    for (const l of layers) {
        const b = document.createElement('button'); b.type = 'button'; b.dataset.layer = l.id; b.textContent = l.name + (config.two ? (l.face === 'front' ? ' · Frente' : ' · Reverso') : ''); b.setAttribute('aria-pressed',String(l.id === selectedId));
        b.addEventListener('click',() => { selectedId = l.id; face = l.face; refresh(); }); $('layerList').appendChild(b);
    }
    $('selectedDesign').textContent = layer ? 'Ajustar: ' + layer.name : 'Selecciona un diseño';
    if (layer) for (const [id,key] of [['designScale','scale'],['designX','x'],['designY','y'],['designRotation','rotation']]) $(id).value = layer[key];
    $('scaleValue').textContent = Math.round(layer?.scale || 100) + '%';
    document.querySelectorAll('[data-face]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.face === face))); textTools?.sync(); render();
}
function addLayer(image,name,textStyle = null) {
    if (layers.length >= 5) { $('fileStatus').textContent = 'Máximo cinco diseños por producto. Elimina uno para añadir otro.'; return false; }
    const id = nextId++; layers.push({id,image,engraving:monochrome(image),name,face,x:0,y:0,scale:100,rotation:0,textStyle}); selectedId = id; refresh(); return true;
}
$('designFile').addEventListener('change',async e => {
    const files = [...e.target.files], targetFace = face; uploading = true; refresh(); let skipped = 0;
    for (const file of files) {
        if (layers.length >= 5 || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { skipped++; continue; }
        const url = URL.createObjectURL(file);
        try {
            const image = new Image(); image.src = url; await image.decode(); if (image.width * image.height > 40000000) throw new Error();
            const canvas = document.createElement('canvas'), ratio = Math.min(1,2048 / Math.max(image.width,image.height));
            canvas.width = Math.max(1,Math.round(image.width * ratio)); canvas.height = Math.max(1,Math.round(image.height * ratio)); canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
            face = targetFace; addLayer(canvas,file.name);
        } catch { skipped++; } finally { URL.revokeObjectURL(url); }
    }
    uploading = false; e.target.value = ''; refresh(); $('fileStatus').textContent = skipped ? 'Algunos archivos no se añadieron. Máximo cinco diseños, JPG/PNG/WebP de hasta 10 MB y 40 megapíxeles.' : 'Selecciona un diseño para ajustar su tamaño, posición o giro.';
});
for (const [id,key] of [['designScale','scale'],['designX','x'],['designY','y'],['designRotation','rotation']]) $(id).addEventListener('input',() => { const l = layers.find(l => l.id === selectedId); if (l) l[key] = Number($(id).value); $('scaleValue').textContent = $('designScale').value + '%'; render(); });
$('clearDesign').addEventListener('click',() => { const i = layers.findIndex(l => l.id === selectedId); if (i >= 0) layers.splice(i,1); selectedId = layers.filter(l => l.face === face).at(-1)?.id ?? null; refresh(); });
document.querySelectorAll('[data-face]').forEach(b => b.addEventListener('click',() => { face = b.dataset.face; selectedId = layers.filter(l => l.face === face).at(-1)?.id ?? null; refresh(); }));
options.addEventListener('input',render); options.addEventListener('change',() => {
    if (type === 'banner') { const enabled = $('hasEyelets').checked; $('eyeletOptions').hidden = !enabled; $('eyeletPosition').disabled = !enabled; $('eyeletSpacing').disabled = !enabled || $('eyeletPosition').value === 'corners'; }
    render();
});
function previewCanvas() {
    for (const input of options.querySelectorAll('input')) if (!input.reportValidity()) return null;
    const canvas = document.createElement('canvas'); canvas.width = config.two ? 1800 : 1400; canvas.height = 1150;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#8c99af'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#111827'; ctx.textAlign = 'center'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('PUBLI SHOP · ' + config.name,canvas.width / 2,45);
    ctx.font = '21px sans-serif'; ctx.fillText(summary(),canvas.width / 2,85,canvas.width - 50);
    const sides = config.two ? ['front','back'] : ['front'];
    sides.forEach((side,i) => { const part = document.createElement('canvas'); part.width = config.two ? 900 : 1400; part.height = 900; draw(part.getContext('2d'),part.width,part.height,side); ctx.drawImage(part,i * 900,130); ctx.fillStyle = '#111827'; ctx.font = '26px sans-serif'; ctx.fillText(config.two ? (side === 'front' ? 'Frente' : 'Reverso') : 'Diseño propuesto',config.two ? i * 900 + 450 : 700,1060); });
    ctx.font = '20px sans-serif'; ctx.fillText('Vista aproximada · Confirmamos medidas, materiales y acabados al cotizar',canvas.width / 2,1115); return canvas;
}
const filename = 'mi-' + type + '-publishop.png';
$('downloadPreview').addEventListener('click',() => downloadCanvas(previewCanvas(),filename));
textTools = setupTextTools(addLayer,config.laser,{selected:() => layers.find(l => l.id === selectedId),update(layer,image,style) { layer.image = image; layer.engraving = monochrome(image); layer.darkEngraving = null; layer.textStyle = style; layer.name = 'Texto: ' + style.text; refresh(); }});
setupCompletion({previewCanvas,summary:() => summary() + describeTextLayers(layers),count:() => layers.length,filename});
function displayMetrics() {
    const rect = $('flatPreview').getBoundingClientRect(), scale = Math.min(rect.width / 1200,rect.height / 900);
    const board = boardMetrics(); return {...board,scale,ox:(rect.width - 1200 * scale) / 2,oy:(rect.height - 900 * scale) / 2};
}
directEditor = setupDirectEditing({surface:$('flatPreview'),items:() => layers.filter(l => !config.two || l.face === face),selected:() => layers.find(l => l.id === selectedId),
    select(layer) { selectedId = layer.id; refresh(); },
    geometry(layer) { const {x,y,w,h,scale,ox,oy} = displayMetrics(), fit = Math.min(w * .85 / layer.image.width,h * .85 / layer.image.height) * layer.scale / 100; return {cx:ox + (x + w * (.5 + layer.x / 100)) * scale,cy:oy + (y + h * (.5 + layer.y / 100)) * scale,width:layer.image.width * fit * scale,height:layer.image.height * fit * scale,angle:layer.rotation}; },
    move(layer,dx,dy) { const m = displayMetrics(); layer.x = Math.max(-45,Math.min(45,layer.x + dx / (m.w * m.scale) * 100)); layer.y = Math.max(-45,Math.min(45,layer.y + dy / (m.h * m.scale) * 100)); },
    resize(layer,value) { layer.scale = Math.max(10,Math.min(180,value)); },
    changed() { refresh(); $('flatPreview').dispatchEvent(new Event('designchange',{bubbles:true})); }
});
if (type === 'banner') $('eyeletSpacing').disabled = true;
refresh();
