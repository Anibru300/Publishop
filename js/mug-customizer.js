const $ = id => document.getElementById(id);
const status = $('viewerStatus');
const viewport = $('mugViewport');
let scene, camera, renderer, mug, texture;
let image = null;
let uploadVersion = 0;
let ready = false;
const designCanvas = document.createElement('canvas');
designCanvas.width = 2048;
designCanvas.height = 820;
const ctx = designCanvas.getContext('2d');

function drawDesign() {
    const w = designCanvas.width, h = designCanvas.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    if (image) {
        const fit = Math.min(w * .40 / image.width, h * .78 / image.height);
        const scale = Number($('designScale').value) / 100;
        const width = image.width * fit * scale, height = image.height * fit * scale;
        const x = w * .75 + Number($('designX').value) / 100 * w;
        const y = h / 2 + Number($('designY').value) / 100 * h;
        ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
    } else {
        ctx.fillStyle = '#7c3aed';
        ctx.textAlign = 'center';
        ctx.font = 'bold 84px sans-serif';
        ctx.fillText('TU IDEA', w * .75, h / 2 - 15);
        ctx.fillStyle = '#514265';
        ctx.font = '38px sans-serif';
        ctx.fillText('hecha para ti', w * .75, h / 2 + 55);
    }
    $('scaleValue').textContent = `${$('designScale').value}%`;
    if (texture) texture.needsUpdate = true;
    render();
}

function render() {
    if (ready && !document.hidden) renderer.render(scene, camera);
}

function resetView() {
    if (!ready) return;
    mug.rotation.set(.06, .15, 0);
    camera.position.set(0, 1.6, 6.8);
    camera.lookAt(0, 0, 0);
    render();
}

function zoom(amount) {
    if (!ready) return;
    camera.position.z = Math.max(4.2, Math.min(10, camera.position.z + amount));
    camera.lookAt(0, 0, 0);
    render();
}

async function init() {
    try {
        // Load the 3D engine only on this page; keep the catalogue lightweight.
        const THREE = await import('./vendor/three/three.module.min.js');
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        scene = new THREE.Scene();
        scene.background = new THREE.Color('#f0edf6');
        camera = new THREE.PerspectiveCamera(40, 1, .1, 50);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xb5a6c6, 2.7));
        const key = new THREE.DirectionalLight(0xffffff, 3.2);
        key.position.set(-3, 5, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 1.5);
        fill.position.set(4, 2, -3);
        scene.add(fill);
        mug = new THREE.Group();
        const ceramic = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .24, metalness: 0 });
        const profile = [[0,-1.4],[.94,-1.4],[.99,-1.35],[1,-1.28],[1,1.35],[.98,1.4],[.93,1.4],[.91,1.35],[.91,-1.2],[.86,-1.25],[0,-1.25]];
        mug.add(new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x,y]) => new THREE.Vector2(x,y)), 96), ceramic));
        const handle = new THREE.Mesh(new THREE.TorusGeometry(.78, .13, 20, 64, Math.PI), ceramic);
        handle.rotation.z = -Math.PI / 2;
        handle.scale.y = .85;
        handle.position.x = .94;
        mug.add(handle);
        drawDesign();
        texture = new THREE.CanvasTexture(designCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const print = new THREE.MeshStandardMaterial({ map: texture, roughness: .3 });
        mug.add(new THREE.Mesh(new THREE.CylinderGeometry(1.003, 1.003, 2.5, 128, 1, true, Math.PI / 2 + .22, Math.PI * 2 - .44), print));
        scene.add(mug);
        viewport.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        ready = true;
        const resize = () => {
            const { width, height } = viewport.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            render();
        };
        new ResizeObserver(resize).observe(viewport);
        resetView();
        resize();
        status.textContent = '';
        $('downloadPreview').disabled = false;
        document.addEventListener('visibilitychange', render);
        renderer.domElement.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            ready = false;
            $('downloadPreview').disabled = true;
            status.textContent = 'La vista 3D se interrumpió. Recarga la página para volver a abrirla.';
        });
    } catch (error) {
        console.error('Could not initialize mug preview', error);
        status.textContent = 'No pudimos abrir la vista 3D. Revisa tu conexión o prueba otro navegador. Puedes enviarnos tu diseño por WhatsApp.';
    }
}

let drag = null;
viewport.addEventListener('pointerdown', event => {
    if (!ready) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    viewport.setPointerCapture(event.pointerId);
});
viewport.addEventListener('pointermove', event => {
    if (!ready || !drag || drag.id !== event.pointerId) return;
    mug.rotation.y += (event.clientX - drag.x) * .01;
    mug.rotation.x = Math.max(-.65, Math.min(.65, mug.rotation.x + (event.clientY - drag.y) * .007));
    drag.x = event.clientX;
    drag.y = event.clientY;
    render();
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => viewport.addEventListener(type, () => { drag = null; }));
viewport.addEventListener('wheel', event => { if (ready) { event.preventDefault(); zoom(event.deltaY * .005); } }, { passive: false });
viewport.addEventListener('keydown', event => {
    if (!ready) return;
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') mug.rotation.y -= .2;
    if (event.key === 'ArrowRight') mug.rotation.y += .2;
    if (event.key === 'ArrowUp') zoom(-.3);
    if (event.key === 'ArrowDown') zoom(.3);
    if (event.key === '+') zoom(-.3);
    if (event.key === '-') zoom(.3);
    if (event.key === 'Home') resetView();
    render();
});
$('rotateLeft').addEventListener('click', () => { if (ready) { mug.rotation.y -= .3; render(); } });
$('rotateRight').addEventListener('click', () => { if (ready) { mug.rotation.y += .3; render(); } });
$('zoomIn').addEventListener('click', () => zoom(-.4));
$('zoomOut').addEventListener('click', () => zoom(.4));
$('resetView').addEventListener('click', resetView);
['designScale','designX','designY'].forEach(id => $(id).addEventListener('input', drawDesign));

$('designFile').addEventListener('change', async event => {
    const file = event.target.files[0];
    const version = ++uploadVersion;
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        $('fileStatus').textContent = 'Elige una imagen JPG, PNG o WebP de hasta 10 MB. Conservamos el diseño anterior.';
        event.target.value = '';
        return;
    }
    const url = URL.createObjectURL(file);
    try {
        const next = new Image();
        next.src = url;
        await next.decode();
        if (version !== uploadVersion) return;
        if (next.width * next.height > 40000000) throw new Error('Image too large');
        image = next;
        $('designControls').disabled = false;
        $('designScale').value = 100;
        $('designX').value = 0;
        $('designY').value = 0;
        $('fileStatus').textContent = `Diseño cargado: ${file.name}. Ajusta su tamaño y posición.`;
        drawDesign();
        resetView();
    } catch {
        if (version === uploadVersion) $('fileStatus').textContent = 'No pudimos leer esa imagen. Prueba con otra de menor resolución. Conservamos el diseño anterior.';
    } finally {
        URL.revokeObjectURL(url);
    }
});
$('clearDesign').addEventListener('click', () => {
    ++uploadVersion;
    image = null;
    $('designFile').value = '';
    $('designControls').disabled = true;
    $('designScale').value = 100;
    $('fileStatus').textContent = 'Estás viendo un diseño de ejemplo.';
    drawDesign();
});
$('downloadPreview').addEventListener('click', () => {
    if (!ready) return;
    render();
    const canvas = document.createElement('canvas');
    canvas.width = renderer.domElement.width;
    canvas.height = renderer.domElement.height + 76;
    const context = canvas.getContext('2d');
    context.fillStyle = '#f0edf6';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(renderer.domElement, 0, 0);
    context.fillStyle = '#49306f';
    context.textAlign = 'center';
    context.font = `${Math.max(12, Math.min(22, canvas.width / 38))}px sans-serif`;
    context.fillText('PUBLI SHOP · Vista aproximada · Sujeta a confirmación', canvas.width / 2, canvas.height - 30);
    canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'mi-taza-publishop.png';
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        $('fileStatus').textContent = 'Vista preparada para descargar. Adjúntala en WhatsApp junto con tu archivo original.';
    }, 'image/png');
});
init();
