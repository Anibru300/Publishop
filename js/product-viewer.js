import * as THREE from './vendor/three/three.module.min.js';

export const thermosModels = {
    '10': {label:'10 oz · Chaparrito redondeado',height:1.9,profile:[[.65,-.95],[.79,-.89],[.94,-.70],[1.01,-.38],[1.02,-.08],[.99,.25],[.91,.60],[.82,.95]],printHeight:1.68,printCenter:0,clearLid:true,reference:'assets/images/modelos/termos/termo-10-oz.jpg'},
    '20': {label:'20 oz · Sin asa',height:3.15,profile:[[.59,-1.575],[.61,-1.45],[.69,-.1],[.79,1.575]],printHeight:2.9,printCenter:0,clearLid:true,reference:'assets/images/modelos/termos/termo-20-oz.jpg'},
    '20-handle': {label:'20 oz · Con asa',height:3.15,profile:[[.69,-1.575],[.71,-1.38],[.76,1.575]],printHeight:2.9,printCenter:0,handle:true,handleWidth:.43,handleThickness:.055,clearLid:true,reference:'assets/images/modelos/termos/termo-20-oz-con-asa.jpg'},
    '30': {label:'30 oz · Sin asa',height:3.45,profile:[[.59,-1.725],[.61,-1.0],[.65,-.8],[.93,-.15],[1.0,1.725]],printHeight:3.2,printCenter:0,clearLid:true,reference:'assets/images/modelos/termos/termo-30-oz.jpg'},
    '30-handle': {label:'30 oz · Con asa',height:3.45,profile:[[.59,-1.725],[.61,-1.0],[.65,-.8],[.93,-.15],[1.0,1.725]],printHeight:3.2,printCenter:0,handle:true,handleWidth:.48,handleThickness:.065,clearLid:true,reference:'assets/images/modelos/termos/termo-30-oz-con-asa.jpg'},
    '40': {label:'40 oz · Con asa y tapa',height:4.0,profile:[[.58,-2],[.6,-1.12],[.64,-.92],[.96,-.45],[1.0,2]],printHeight:3.72,printCenter:0,handle:true,handleWidth:.5,handleThickness:.08,strawHeight:.22,reference:'assets/images/modelos/termos/termo-40-oz.jpg'},
    skinny20: {label:'20 oz · Skinny recto',height:3.55,profile:[[.57,-1.775],[.59,-1.67],[.59,1.775]],printHeight:3.32,printCenter:0,clearLid:true,reference:'assets/images/modelos/termos/termo-skinny-20-oz.webp'}
};
function radiusAt(model,y) {
    const points = model.profile;
    if (y <= points[0][1]) return points[0][0];
    for (let i = 1; i < points.length; i++) if (y <= points[i][1]) {
        const [r0,y0] = points[i - 1], [r1,y1] = points[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0);
    }
    return points.at(-1)[0];
}
export class ProductViewer {
    constructor({element,type,options,paint,onRender}) {
        this.element = element; this.type = type; this.options = options; this.paint = paint; this.onRender = onRender;
        this.renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2)); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#8c99af');
        this.camera = new THREE.PerspectiveCamera(40,1,.1,80);
        this.scene.add(new THREE.HemisphereLight(0xffffff,0x718098,2.6));
        for (const [position,intensity] of [[[-3,5,5],3.1],[[4,2,-3],1.6]]) { const l = new THREE.DirectionalLight(0xffffff,intensity); l.position.set(...position); this.scene.add(l); }
        this.textures = {};
        for (const side of ['front','back']) { const c = document.createElement('canvas'); c.width = c.height = 1024; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8,this.renderer.capabilities.getMaxAnisotropy()); this.textures[side] = t; }
        element.appendChild(this.renderer.domElement); this.renderer.domElement.setAttribute('aria-hidden','true');
        this.refresh(); this.reset();
        new ResizeObserver(() => this.resize()).observe(element); this.resize();
        let drag;
        element.addEventListener('pointerdown',e => { if (e.button !== 0) return; drag = {id:e.pointerId,x:e.clientX,y:e.clientY}; element.setPointerCapture(e.pointerId); });
        element.addEventListener('pointermove',e => { if (!drag || drag.id !== e.pointerId) return; this.product.rotation.y += (e.clientX - drag.x) * .01; this.product.rotation.x = Math.max(-1.1,Math.min(1.1,this.product.rotation.x + (e.clientY - drag.y) * .007)); drag.x = e.clientX; drag.y = e.clientY; this.render(); });
        ['pointerup','pointercancel','lostpointercapture'].forEach(t => element.addEventListener(t,() => { drag = null; }));
        element.addEventListener('wheel',e => { e.preventDefault(); this.zoom(e.deltaY * .005); },{passive:false});
        element.addEventListener('keydown',e => { if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key)) return; e.preventDefault(); if (e.key === 'ArrowLeft') this.product.rotation.y -= .2; if (e.key === 'ArrowRight') this.product.rotation.y += .2; if (['ArrowUp','+'].includes(e.key)) this.zoom(-.3); if (['ArrowDown','-'].includes(e.key)) this.zoom(.3); if (e.key === 'Home') this.reset(); this.render(); });
        this.renderer.domElement.addEventListener('webglcontextlost',e => { e.preventDefault(); this.lost = true; document.getElementById('viewerStatus').textContent = 'El visor se interrumpió. Recarga la página; puedes conservar tus archivos originales.'; });
    }
    defaultDistance() { return this.type === 'thermos' && this.options().model === '40' ? 8.8 : this.type === 'thermos' ? 7.5 : 6.4; }
    resize() { const r = this.element.getBoundingClientRect(); if (!r.width || !r.height) return; this.renderer.setSize(r.width,r.height,false); this.camera.aspect = r.width / r.height; this.camera.updateProjectionMatrix(); this.render(); }
    reset(side = 'front') { this.product.rotation.set(0,side === 'back' ? Math.PI : 0,0); this.camera.position.set(0,0,this.defaultDistance()); this.camera.lookAt(0,0,0); this.render(); }
    zoom(amount) { this.camera.position.z = Math.max(4,Math.min(14,this.camera.position.z + amount)); this.camera.lookAt(0,0,0); this.render(); }
    render() { if (!this.lost) { this.renderer.render(this.scene,this.camera); this.onRender?.(); } }
    surface(u,v,side) {
        const o = this.options();
        if (this.type === 'thermos') {
            const m = thermosModels[o.model] || thermosModels['20']; const y = m.printCenter + (.5 - v) * m.printHeight, r = radiusAt(m,y) + .004;
            const theta = (u - .5) * Math.PI + (side === 'back' ? Math.PI : 0);
            return {p:new THREE.Vector3(r * Math.sin(theta),y,r * Math.cos(theta)),n:new THREE.Vector3(Math.sin(theta),0,Math.cos(theta))};
        }
        if (this.type === 'pen') {
            const theta = side === 'back' ? Math.PI / 2 + v * Math.PI : Math.PI / 2 - v * Math.PI;
            return {p:new THREE.Vector3((u - .5) * 3.7 * (side === 'back' ? -1 : 1),.175 * Math.sin(theta),.175 * Math.cos(theta)),n:new THREE.Vector3(0,Math.sin(theta),Math.cos(theta))};
        }
        const {width,height,depth} = this.dimensions;
        return {p:new THREE.Vector3((u - .5) * width * (side === 'back' ? -1 : 1),(.5 - v) * height,(depth / 2 + .003) * (side === 'back' ? -1 : 1)),n:new THREE.Vector3(0,0,side === 'back' ? -1 : 1)};
    }
    project(u,v,side = 'front') {
        this.product.updateMatrixWorld(true); this.camera.updateMatrixWorld(true);
        const {p,n} = this.surface(u,v,side); p.applyMatrix4(this.product.matrixWorld); n.transformDirection(this.product.matrixWorld);
        const visible = n.dot(this.camera.position.clone().sub(p).normalize()) > .04;
        p.project(this.camera); const r = this.element.getBoundingClientRect();
        return {x:(p.x + 1) * r.width / 2,y:(1 - p.y) * r.height / 2,visible};
    }
    surfaceGeometry(side) {
        const positions = [], normals = [], uv = [], indices = [], nx = this.type === 'pen' ? 24 : 96, ny = this.type === 'pen' ? 40 : 32;
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const {p,n} = this.surface(i / nx,j / ny,side); positions.push(p.x,p.y,p.z); normals.push(n.x,n.y,n.z); uv.push(i / nx,1 - j / ny); }
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; indices.push(a,c,b,b,c,d); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(indices); return g;
    }
    add(mesh) { this.product.add(mesh); return mesh; }
    build(o) {
        const rotation = this.product?.rotation.clone();
        if (this.product) { this.scene.remove(this.product); this.product.traverse(obj => { obj.geometry?.dispose(); if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material?.dispose(); }); }
        this.product = new THREE.Group(); this.scene.add(this.product);
        const material = color => new THREE.MeshStandardMaterial({color,roughness:.4});
        const steel = () => new THREE.MeshStandardMaterial({color:'#c5cbd4',metalness:.8,roughness:.27});
        if (this.type === 'thermos') {
            const m = thermosModels[o.model] || thermosModels['20']; const profile = [[0,m.profile[0][1]],...m.profile,[0,m.profile.at(-1)[1]]];
            this.add(new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r,y]) => new THREE.Vector2(r,y)),96),material(o.color)));
            const top = m.profile.at(-1), bottom = m.profile[0];
            const lid = this.add(new THREE.Mesh(new THREE.CylinderGeometry(top[0] + .025,top[0] + .025,.1,64),steel())); lid.position.y = m.height / 2 + .025;
            const capMaterial = m.clearLid ? new THREE.MeshStandardMaterial({color:'#cbd3d8',transparent:true,opacity:.6,roughness:.2}) : material('#272b30');
            const cap = this.add(new THREE.Mesh(new THREE.CylinderGeometry(top[0] * .92,top[0] * .92,.05,64),capMaterial)); cap.position.y = m.height / 2 + .1;
            const rim = this.add(new THREE.Mesh(new THREE.CylinderGeometry(bottom[0] + .01,bottom[0] + .01,.08,64),steel())); rim.position.y = -m.height / 2 + .035;
            if (m.handle) {
                const yTop = m.height * .31, yBottom = -m.height * .12, edge = radiusAt(m,(yTop + yBottom) / 2), width = m.handleWidth;
                const points = [[edge - .025,yTop,0],[edge + width - .06,yTop,0],[edge + width,yTop - .07,0],[edge + width,yBottom + .07,0],[edge + width - .06,yBottom,0],[edge - .025,yBottom,0]].map(p => new THREE.Vector3(...p));
                this.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),80,m.handleThickness,16,false),material(o.color)));
            }
            if (m.strawHeight) { const straw = this.add(new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,m.strawHeight,20),material('#272b30'))); straw.position.set(.2,m.height / 2 + .12 + m.strawHeight / 2,0); }
        } else if (this.type === 'pen') {
            const barrel = this.add(new THREE.Mesh(new THREE.CylinderGeometry(.174,.174,3.7,64),material(o.color))); barrel.rotation.z = Math.PI / 2;
            const tip = this.add(new THREE.Mesh(new THREE.ConeGeometry(.174,.43,40),steel())); tip.rotation.z = -Math.PI / 2; tip.position.x = 2.065;
            const cap = this.add(new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.12,40),steel())); cap.rotation.z = Math.PI / 2; cap.position.x = -1.85;
            const clip = this.add(new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.07),steel())); clip.position.set(-1.15,.2,.02);
        } else {
            const ratio = Math.max(.15,Math.min(6,o.ratio)), width = Math.min(3.7,2.6 * ratio), height = width / ratio;
            const depth = this.type === 'mdf' ? .12 : this.type === 'puzzle' ? .07 : .025;
            this.dimensions = {width,height,depth}; const shape = new THREE.Shape();
            if (o.shape === 'circle') shape.absellipse(0,0,width / 2,height / 2,0,Math.PI * 2,false);
            else if (o.shape === 'heart') { shape.moveTo(0,-height / 2); shape.bezierCurveTo(-width * .8,height * .05,-width / 2,height * .85,0,height * .28); shape.bezierCurveTo(width / 2,height * .85,width * .8,height * .05,0,-height / 2); }
            else if (o.shape === 'star') { for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5,r = i % 2 ? .45 : 1,x = Math.cos(a) * width / 2 * r,y = Math.sin(a) * height / 2 * r; if (i) shape.lineTo(x,y); else shape.moveTo(x,y); } shape.closePath(); }
            else { shape.moveTo(-width / 2,-height / 2); shape.lineTo(width / 2,-height / 2); shape.lineTo(width / 2,height / 2); shape.lineTo(-width / 2,height / 2); shape.closePath(); }
            const eyelets = o.eyelets || [];
            for (const [u,v] of eyelets) { const hole = new THREE.Path(); hole.absarc((u - .5) * width,(.5 - v) * height,.018,0,Math.PI * 2,true); shape.holes.push(hole); }
            const g = new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:32}); g.translate(0,0,-depth / 2);
            this.add(new THREE.Mesh(g,material(this.type === 'mdf' ? '#ac7843' : this.type === 'puzzle' ? '#b8aa92' : '#e5e7eb')));
            for (const side of ['front','back']) {
                const front = new THREE.ShapeGeometry(shape,32), pos = front.getAttribute('position'), uv = front.getAttribute('uv');
                for (let i = 0; i < pos.count; i++) uv.setXY(i,.5 + pos.getX(i) / width * (side === 'back' ? -1 : 1),.5 + pos.getY(i) / height);
                const mesh = this.add(new THREE.Mesh(front,new THREE.MeshStandardMaterial({map:this.textures[side],side:side === 'front' ? THREE.FrontSide : THREE.BackSide,roughness:this.type === 'banner' ? .75 : .9})));
                mesh.position.z = (depth / 2 + .003) * (side === 'front' ? 1 : -1);
            }
            for (const [u,v] of eyelets) { const ring = this.add(new THREE.Mesh(new THREE.TorusGeometry(.028,.009,10,24),steel())); ring.position.set((u - .5) * width,(.5 - v) * height,depth / 2 + .006); }
        }
        if (['pen','thermos'].includes(this.type)) for (const side of ['front','back']) this.add(new THREE.Mesh(this.surfaceGeometry(side),new THREE.MeshStandardMaterial({map:this.textures[side],side:THREE.DoubleSide,roughness:.45})));
        if (rotation) this.product.rotation.copy(rotation);
    }
    refresh() {
        const o = this.options(), signature = JSON.stringify(o);
        if (signature !== this.signature) { this.signature = signature; this.build(o); }
        for (const [side,texture] of Object.entries(this.textures)) { this.paint(texture.image,side); texture.needsUpdate = true; }
        this.render();
    }
    views(ctx) {
        const rotation = this.product.rotation.clone(), position = this.camera.position.clone(), aspect = this.camera.aspect, size = this.renderer.getSize(new THREE.Vector2());
        try {
            this.renderer.setSize(750,750,false); this.camera.aspect = 1; this.camera.position.set(0,0,this.defaultDistance()); this.camera.lookAt(0,0,0); this.camera.updateProjectionMatrix();
            [['Frente',0],['Reverso',Math.PI],['Lateral izquierdo',Math.PI / 3],['Lateral derecho',-Math.PI / 3]].forEach(([label,angle],i) => {
                this.product.rotation.set(0,angle,0); this.renderer.render(this.scene,this.camera); const x = i % 2 * 800,y = Math.floor(i / 2) * 800 + 130;
                ctx.drawImage(this.renderer.domElement,x + 25,y,750,750); ctx.font = '26px sans-serif'; ctx.fillStyle = '#111827'; ctx.fillText(label,x + 400,y + 790);
            });
        } finally { this.product.rotation.copy(rotation); this.camera.position.copy(position); this.camera.aspect = aspect; this.camera.lookAt(0,0,0); this.camera.updateProjectionMatrix(); this.renderer.setSize(size.x,size.y,false); this.render(); }
    }
}
