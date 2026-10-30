import { setupCompletion, downloadCanvas } from './finish-order.js';
import { setupTextTools } from './text-tools.js';
const $ = id => document.getElementById(id);
const isShirt = document.body.dataset.product === 'shirt';
const viewport = $('mugViewport'), background = '#8c99af';
const layers = [], textures = {};
let selectedId = null, face = 'front', ready = false, uploading = false, nextId = 1;
let THREE, renderer, scene, camera, product;
const selected = () => layers.find(l => l.id === selectedId);
const magic = () => !isShirt && $('mugType').value === 'magic';
const cold = () => magic() && !$('magicHot').checked;
const currentLayers = () => layers.filter(l => !isShirt || l.face === face);
function render() { if (ready && !document.hidden) renderer.render(scene,camera); }
function resetView() {
    if (!ready) return;
    product.rotation.set(isShirt ? 0 : .06,isShirt ? (face === 'back' ? Math.PI : 0) : .15,0);
    camera.position.set(0,isShirt ? 0 : 1.2,isShirt ? 7.6 : 7.4);
    camera.lookAt(0,0,0); render();
}
function zoom(amount) {
    if (!ready) return;
    camera.position.z = Math.max(4.8,Math.min(11,camera.position.z + amount)); camera.lookAt(0,0,0); render();
}
function paintTextures() {
    for (const [side,texture] of Object.entries(textures)) {
        const canvas = texture.image, ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
        ctx.clearRect(0,0,w,h);
        if (!isShirt) { ctx.fillStyle = cold() ? '#111111' : '#ffffff'; ctx.fillRect(0,0,w,h); }
        const visible = layers.filter(l => !isShirt || l.face === side);
        if (!cold()) {
            for (const l of visible) {
                const fit = Math.min(w * (isShirt ? .85 : .40) / l.image.width,h * .78 / l.image.height);
                const width = l.image.width * fit * l.scale / 100, height = l.image.height * fit * l.scale / 100;
                const x = w * (isShirt ? .5 : .75) + l.x / 100 * w, y = h / 2 + l.y / 100 * h;
                // Repeat across the mug's UV seam to keep designs continuous.
                for (const wrap of isShirt ? [0] : [-w,0,w]) {
                    ctx.save(); ctx.translate(x + wrap,y); ctx.rotate(l.rotation * Math.PI / 180);
                    ctx.drawImage(l.image,-width / 2,-height / 2,width,height); ctx.restore();
                }
            }
            if (!isShirt && !visible.length) {
                ctx.fillStyle = '#7c3aed'; ctx.textAlign = 'center'; ctx.font = 'bold 84px sans-serif'; ctx.fillText('TU IDEA',w * .75,h / 2);
            }
        }
        texture.needsUpdate = true;
    }
    render();
}
function description() {
    if (!isShirt) return $('mugType').selectedOptions[0].text + (magic() ? ($('magicHot').checked ? ' · caliente (diseño visible)' : ' · fría (negra)') : '');
    return [$('shirtStyle'),$('shirtSleeve'),$('shirtColor'),$('shirtTechnique')].map(s => s.selectedOptions[0].text).join(' · ');
}
function updateQuote() {
    const sides = isShirt ? ': ' + layers.filter(l => l.face === 'front').length + ' delante y ' + layers.filter(l => l.face === 'back').length + ' detrás' : '';
    $('quoteMug').href = 'https://wa.me/524778411655?text=' + encodeURIComponent('Hola PUBLI SHOP, quiero cotizar ' + (isShirt ? 'una playera' : 'una taza') + ' personalizada.\n' + description() + '\n' + layers.length + ' diseño(s)' + sides + '. Adjunto la vista previa y mis archivos originales.');
}
function refreshControls() {
    const l = selected();
    $('designControls').disabled = !l; $('designFile').disabled = uploading || layers.length >= 5;
    $('designCount').textContent = layers.length + ' de 5 diseños'; $('layerList').replaceChildren();
    for (const item of layers) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.layer = item.id;
        button.setAttribute('aria-pressed',String(item.id === selectedId));
        button.textContent = item.name + (isShirt ? (item.face === 'front' ? ' · Frente' : ' · Espalda') : '');
        button.addEventListener('click',() => {
            selectedId = item.id;
            if (isShirt && face !== item.face) { face = item.face; resetView(); }
            refreshControls();
        });
        $('layerList').appendChild(button);
    }
    if (l) {
        $('designScale').value = l.scale; $('designX').value = l.x; $('designY').value = l.y; $('designRotation').value = l.rotation;
        $('selectedDesign').textContent = 'Ajustar: ' + l.name; $('scaleValue').textContent = l.scale + '%';
    } else $('selectedDesign').textContent = 'Selecciona un diseño para ajustarlo';
    document.querySelectorAll('[data-face]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.face === face)));
    updateQuote();
}
function buildProduct() {
    if (!THREE || !scene) return;
    if (product) {
        scene.remove(product); product.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    }
    product = new THREE.Group();
    if (isShirt) {
        const style = $('shirtStyle').value, long = $('shirtSleeve').value === 'long';
        const fabric = new THREE.MeshStandardMaterial({color:$('shirtColor').value,roughness:.9});
        const shape = new THREE.Shape(); shape.moveTo(-.38,1.4);
        const outline = long
            ? [[-.85,1.3],[-1.22,.83],[-1.48,-.9],[-1.12,-1],[-.8,.5],[-.8,-1.35],[.8,-1.35],[.8,.5],[1.12,-1],[1.48,-.9],[1.22,.83],[.85,1.3],[.38,1.4]]
            : [[-.85,1.3],[-1.5,.72],[-1.12,.25],[-.8,.55],[-.8,-1.35],[.8,-1.35],[.8,.55],[1.12,.25],[1.5,.72],[.85,1.3],[.38,1.4]];
        outline.forEach(([x,y]) => shape.lineTo(x,y));
        if (style === 'v') { shape.lineTo(0,.86); shape.lineTo(-.38,1.4); }
        else shape.quadraticCurveTo(0,style === 'polo' ? 1.1 : .95,-.38,1.4);
        const geometry = new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSize:.045,bevelThickness:.04,bevelSegments:3,curveSegments:24});
        geometry.translate(0,0,-.11); product.add(new THREE.Mesh(geometry,fabric));
        if (style === 'polo') {
            for (const sign of [-1,1]) {
                const collar = new THREE.Shape(); collar.moveTo(sign * .05,1.13); collar.lineTo(sign * .38,1.43);
                collar.lineTo(sign * .49,1.17); collar.lineTo(sign * .22,.89); collar.closePath();
                const mesh = new THREE.Mesh(new THREE.ShapeGeometry(collar),new THREE.MeshStandardMaterial({color:$('shirtColor').value,roughness:.8,side:THREE.DoubleSide}));
                mesh.position.z = .19; product.add(mesh);
            }
            const placket = new THREE.Mesh(new THREE.BoxGeometry(.12,.4,.025),fabric.clone()); placket.position.set(0,.94,.18); product.add(placket);
            for (const y of [.85,1.02]) {
                const button = new THREE.Mesh(new THREE.SphereGeometry(.024,12,8),new THREE.MeshStandardMaterial({color:'#aaaaaa'}));
                button.position.set(0,y,.21); product.add(button);
            }
        }
        for (const side of ['front','back']) {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.32,1.8),new THREE.MeshStandardMaterial({map:textures[side],transparent:true,roughness:.9,depthWrite:false}));
            mesh.position.set(0,-.18,side === 'front' ? .156 : -.156); if (side === 'back') mesh.rotation.y = Math.PI; product.add(mesh);
        }
    } else {
        const ceramic = new THREE.MeshStandardMaterial({color:cold() ? '#111111' : '#ffffff',roughness:.26});
        const profile = [[0,-1.4],[.94,-1.4],[.99,-1.35],[1,-1.28],[1,1.35],[.98,1.4],[.93,1.4],[.91,1.35],[.91,-1.2],[.86,-1.25],[0,-1.25]];
        product.add(new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x,y]) => new THREE.Vector2(x,y)),96),ceramic));
        const handle = new THREE.Mesh(new THREE.TorusGeometry(.78,.13,20,64,Math.PI),new THREE.MeshStandardMaterial({color:magic() ? '#111111' : '#ffffff',roughness:.26}));
        handle.rotation.z = -Math.PI / 2; handle.scale.y = .85; handle.position.x = .94; product.add(handle);
        product.add(new THREE.Mesh(new THREE.CylinderGeometry(1.003,1.003,2.5,128,1,true,Math.PI / 2 + .22,Math.PI * 2 - .44),new THREE.MeshStandardMaterial({map:textures.mug,roughness:.3})));
        if ($('mugType').value === 'large') product.scale.set(1.12,1.16,1.12);
    }
    scene.add(product); paintTextures(); resetView(); updateQuote();
}
async function init() {
    try {
        THREE = await import('./vendor/three/three.module.min.js');
        renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
        scene = new THREE.Scene(); scene.background = new THREE.Color(background); camera = new THREE.PerspectiveCamera(40,1,.1,50);
        scene.add(new THREE.HemisphereLight(0xffffff,0x6e7890,2.7));
        for (const [position,intensity] of [[[-3,5,5],3.2],[[4,2,-3],1.5]]) {
            const light = new THREE.DirectionalLight(0xffffff,intensity); light.position.set(...position); scene.add(light);
        }
        for (const side of isShirt ? ['front','back'] : ['mug']) {
            const canvas = document.createElement('canvas'); canvas.width = isShirt ? 1024 : 2048; canvas.height = isShirt ? 1024 : 820;
            const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(8,renderer.capabilities.getMaxAnisotropy()); textures[side] = texture;
        }
        viewport.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden','true'); ready = true; buildProduct();
        const resize = () => {
            const {width,height} = viewport.getBoundingClientRect(); if (!width || !height) return;
            renderer.setSize(width,height,false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
        };
        new ResizeObserver(resize).observe(viewport); resize(); $('viewerStatus').textContent = ''; $('downloadPreview').disabled = false;
        document.querySelectorAll('[data-face], .product-options select, #magicHot').forEach(c => { c.disabled = false; });
        document.addEventListener('visibilitychange',render);
        renderer.domElement.addEventListener('webglcontextlost',event => {
            event.preventDefault(); ready = false; $('downloadPreview').disabled = true; $('viewerStatus').textContent = 'La vista se interrumpió. Recarga la página para volver a abrirla.';
        });
    } catch (error) {
        console.error(error); $('viewerStatus').textContent = 'No pudimos abrir el visor. Prueba otro navegador o envíanos tus diseños por WhatsApp.';
    }
}
$('designFile').addEventListener('change',async event => {
    const files = [...event.target.files], uploadFace = face; uploading = true; refreshControls(); let added = 0, rejected = 0;
    for (const file of files) {
        if (layers.length >= 5 || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { rejected++; continue; }
        const url = URL.createObjectURL(file);
        try {
            const image = new Image(); image.src = url; await image.decode(); if (image.width * image.height > 40000000) throw new Error('Image too large');
            const copy = document.createElement('canvas'), ratio = Math.min(1,2048 / Math.max(image.width,image.height));
            copy.width = Math.max(1,Math.round(image.width * ratio)); copy.height = Math.max(1,Math.round(image.height * ratio)); copy.getContext('2d').drawImage(image,0,0,copy.width,copy.height);
            const siblings = layers.filter(l => !isShirt || l.face === uploadFace).length, id = nextId++;
            layers.push({id,name:file.name,image:copy,face:uploadFace,scale:siblings ? 60 : 100,x:siblings ? (siblings % 2 ? -18 : 18) : 0,y:siblings > 2 ? 18 : 0,rotation:0}); selectedId = id; added++;
        } catch { rejected++; } finally { URL.revokeObjectURL(url); }
    }
    if (added && isShirt) face = uploadFace;
    uploading = false; event.target.value = ''; refreshControls(); paintTextures(); resetView();
    $('fileStatus').textContent = added + ' diseño(s) añadido(s).' + (rejected ? ' Algunos archivos no se añadieron: máximo 5 por producto, JPG/PNG/WebP de hasta 10 MB e imágenes de hasta 40 megapíxeles.' : ' Selecciona uno en la lista para ajustarlo.');
});
for (const [id,property] of [['designScale','scale'],['designX','x'],['designY','y'],['designRotation','rotation']]) {
    $(id).addEventListener('input',() => { const l = selected(); if (!l) return; l[property] = Number($(id).value); $('scaleValue').textContent = l.scale + '%'; paintTextures(); });
}
$('clearDesign').addEventListener('click',() => {
    const index = layers.findIndex(l => l.id === selectedId); if (index < 0) return;
    layers.splice(index,1); selectedId = currentLayers().at(-1)?.id ?? null; refreshControls(); paintTextures(); $('fileStatus').textContent = 'Diseño eliminado. Puedes añadir otro.';
});
document.querySelectorAll('[data-face]').forEach(b => b.addEventListener('click',() => { face = b.dataset.face; selectedId = currentLayers().at(-1)?.id ?? null; refreshControls(); resetView(); }));
document.querySelectorAll('.product-options select, #magicHot').forEach(c => c.addEventListener('change',() => { if (!isShirt) $('magicOptions').hidden = !magic(); buildProduct(); }));
let drag = null;
viewport.addEventListener('pointerdown',e => { if (!ready || isShirt) return; drag = {id:e.pointerId,x:e.clientX,y:e.clientY}; viewport.setPointerCapture(e.pointerId); });
viewport.addEventListener('pointermove',e => {
    if (!ready || !drag || drag.id !== e.pointerId) return;
    product.rotation.y += (e.clientX - drag.x) * .01; product.rotation.x = Math.max(-.65,Math.min(.65,product.rotation.x + (e.clientY - drag.y) * .007));
    drag.x = e.clientX; drag.y = e.clientY; render();
});
['pointerup','pointercancel','lostpointercapture'].forEach(t => viewport.addEventListener(t,() => { drag = null; }));
viewport.addEventListener('wheel',e => { if (ready) { e.preventDefault(); zoom(e.deltaY * .005); } },{passive:false});
viewport.addEventListener('keydown',e => {
    if (!ready || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key)) return;
    e.preventDefault();
    if (['ArrowLeft','ArrowRight'].includes(e.key)) {
        if (isShirt) document.querySelector('[data-face="' + (e.key === 'ArrowLeft' ? 'front' : 'back') + '"]').click();
        else product.rotation.y += e.key === 'ArrowLeft' ? -.2 : .2;
    }
    if (['ArrowUp','+'].includes(e.key)) zoom(-.3); if (['ArrowDown','-'].includes(e.key)) zoom(.3); if (e.key === 'Home') resetView(); render();
});
$('rotateLeft')?.addEventListener('click',() => { if (ready) { product.rotation.y -= .3; render(); } });
$('rotateRight')?.addEventListener('click',() => { if (ready) { product.rotation.y += .3; render(); } });
$('zoomIn').addEventListener('click',() => zoom(-.4)); $('zoomOut').addEventListener('click',() => zoom(.4)); $('resetView').addEventListener('click',resetView);
function previewCanvas() {
    if (!ready) return;
    const rotation = product.rotation.clone(), position = camera.position.clone(), aspect = camera.aspect, size = renderer.getSize(new THREE.Vector2());
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = isShirt ? 990 : 1790;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#111827'; ctx.textAlign = 'center'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('PUBLI SHOP · ' + (isShirt ? 'Playera · Frente y espalda' : 'Taza · Cuatro vistas'),800,42);
    ctx.font = '23px sans-serif'; ctx.fillText(description(),800,78);
    try {
        renderer.setSize(750,750,false); camera.aspect = 1; camera.position.set(0,isShirt ? 0 : .8,isShirt ? 6.8 : 7.2); camera.lookAt(0,0,0); camera.updateProjectionMatrix();
        const views = isShirt ? [['Frente',0],['Espalda',Math.PI]] : [['Frente',0],['Atrás',Math.PI],['Lado izquierdo',Math.PI / 2],['Lado derecho',-Math.PI / 2]];
        views.forEach(([label,angle],index) => {
            const x = index % 2 * 800, y = Math.floor(index / 2) * 800 + 110;
            product.rotation.set(0,angle,0); renderer.render(scene,camera); ctx.drawImage(renderer.domElement,x + 25,y,750,750);
            ctx.font = '28px sans-serif'; ctx.fillText(label,x + 400,y + 786);
        });
    } finally {
        product.rotation.copy(rotation); camera.position.copy(position); camera.aspect = aspect; camera.lookAt(0,0,0); camera.updateProjectionMatrix(); renderer.setSize(size.x,size.y,false); render();
    }
    ctx.font = '22px sans-serif'; ctx.fillText('Vista aproximada · Sujeta a confirmación antes de producir',800,canvas.height - 24);
    return canvas;
}
const filename = isShirt ? 'mi-playera-frente-espalda-publishop.png' : 'mi-taza-4-vistas-publishop.png';
$('downloadPreview').addEventListener('click',() => downloadCanvas(previewCanvas(),filename));
setupTextTools((image,name) => {
    if (layers.length >= 5) { $('fileStatus').textContent = 'Máximo cinco diseños por producto. Elimina uno para añadir otro.'; return false; }
    const id = nextId++;
    layers.push({id,name,image,face,scale:100,x:0,y:0,rotation:0}); selectedId = id;
    refreshControls(); paintTextures(); return true;
});
setupCompletion({previewCanvas,summary:description,count:() => layers.length,filename});
refreshControls(); init();
