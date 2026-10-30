// DOM controls stay outside the canvas, so exports contain only the product.
export function setupDirectEditing(api) {
    const surface = api.surface;
    let stage = surface;
    if (surface.tagName === 'CANVAS') {
        stage = document.createElement('div'); stage.className = 'direct-stage';
        surface.before(stage); stage.appendChild(surface);
    } else stage.classList.add('direct-stage');
    const overlay = document.createElement('div'); overlay.className = 'direct-overlay';
    stage.appendChild(overlay);
    const hint = document.createElement('p'); hint.className = 'preview-hint direct-hint';
    hint.textContent = '✋ Toca un diseño y arrástralo. Usa los círculos de las esquinas para agrandarlo o hacerlo más pequeño.';
    stage.after(hint);
    const nodes = new Map(); let drag = null;
    const update = () => {
        const items = api.items();
        for (const [id,node] of nodes) if (!items.some(item => item.id === id)) { node.remove(); nodes.delete(id); }
        for (const item of items) {
            let node = nodes.get(item.id);
            if (!node) {
                node = document.createElement('div'); node.className = 'direct-item'; node.dataset.designId = item.id;
                node.setAttribute('role','button'); node.tabIndex = 0;
                for (const corner of ['nw','ne','sw','se']) {
                    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'resize-handle handle-' + corner;
                    handle.dataset.corner = corner; handle.setAttribute('aria-label','Cambiar tamaño de ' + item.name); node.appendChild(handle);
                    handle.addEventListener('keydown',e => {
                        if (!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','+','-'].includes(e.key)) return;
                        e.preventDefault(); e.stopPropagation(); api.select(item);
                        api.resize(item,item.scale * (['ArrowUp','ArrowRight','+'].includes(e.key) ? 1.05 : .95)); api.changed(); update();
                    });
                }
                node.addEventListener('keydown',e => {
                    if (e.target !== node || !['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Delete'].includes(e.key)) return;
                    e.preventDefault(); e.stopPropagation(); api.select(item);
                    if (e.key.startsWith('Arrow')) api.move(item,e.key === 'ArrowLeft' ? -4 : e.key === 'ArrowRight' ? 4 : 0,e.key === 'ArrowUp' ? -4 : e.key === 'ArrowDown' ? 4 : 0);
                    if (e.key === '+' || e.key === '-') api.resize(item,item.scale * (e.key === '+' ? 1.1 : .9));
                    if (e.key === 'Delete') api.remove?.(item);
                    api.changed(); update();
                });
                node.addEventListener('pointerdown',e => {
                    if (e.button !== 0) return;
                    e.preventDefault(); e.stopPropagation(); api.select(item);
                    const geometry = api.geometry(item); if (!geometry) return;
                    const rect = overlay.getBoundingClientRect();
                    const cx = rect.left + geometry.cx, cy = rect.top + geometry.cy;
                    drag = {item,node,pointer:e.pointerId,x:e.clientX,y:e.clientY,cx,cy,startScale:item.scale,
                        distance:Math.max(10,Math.hypot(e.clientX - cx,e.clientY - cy)),resize:!!e.target.closest('[data-corner]')};
                    node.setPointerCapture(e.pointerId); node.classList.add('dragging'); update();
                });
                node.addEventListener('pointermove',e => {
                    if (!drag || drag.node !== node || drag.pointer !== e.pointerId) return;
                    e.preventDefault(); e.stopPropagation();
                    if (drag.resize) api.resize(item,drag.startScale * Math.hypot(e.clientX - drag.cx,e.clientY - drag.cy) / drag.distance);
                    else api.move(item,e.clientX - drag.x,e.clientY - drag.y);
                    drag.x = e.clientX; drag.y = e.clientY; api.changed(); update();
                });
                const end = () => { if (drag?.node === node) { drag = null; node.classList.remove('dragging'); } };
                ['pointerup','pointercancel','lostpointercapture'].forEach(type => node.addEventListener(type,end));
                overlay.appendChild(node); nodes.set(item.id,node);
            }
            const g = api.geometry(item);
            node.hidden = !g || g.width < 2 || g.height < 2;
            if (!g) continue;
            node.style.left = g.cx + 'px'; node.style.top = g.cy + 'px';
            node.style.width = Math.max(20,g.width) + 'px'; node.style.height = Math.max(20,g.height) + 'px';
            node.style.transform = 'translate(-50%,-50%) rotate(' + (g.angle || 0) + 'deg)';
            node.setAttribute('aria-label','Mover diseño: ' + item.name);
            node.setAttribute('aria-pressed',String(api.selected()?.id === item.id));
            node.style.zIndex = api.selected()?.id === item.id ? 10 : 1;
        }
    };
    new ResizeObserver(update).observe(surface);
    update(); return {update};
}
