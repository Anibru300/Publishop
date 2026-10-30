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
    hint.textContent = '✋ Arrastra tu diseño. Las esquinas cambian el tamaño completo; los tiradores de los lados cambian solo el ancho o el alto.';
    stage.after(hint);
    const nodes = new Map(); let drag = null, dragFrame = 0;
    const scheduleDragUpdate = () => {
        if (dragFrame) return;
        dragFrame = requestAnimationFrame(() => {
            dragFrame = 0;
            if (!drag) return;
            if (api.changed) api.changed(true); else update();
        });
    };
    const finishDrag = node => {
        if (drag?.node !== node) return;
        if (dragFrame) { cancelAnimationFrame(dragFrame); dragFrame = 0; }
        drag = null; node.classList.remove('dragging');
        if (api.changed) api.changed(false); else update();
    };
    const update = () => {
        const items = api.items();
        for (const [id,node] of nodes) if (!items.some(item => item.id === id)) { node.remove(); nodes.delete(id); }
        for (const item of items) {
            let node = nodes.get(item.id);
            if (!node) {
                node = document.createElement('div'); node.className = 'direct-item'; node.dataset.designId = item.id;
                node.setAttribute('role','button'); node.tabIndex = 0;
                for (const corner of ['nw','ne','sw','se','n','s','e','w']) {
                    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'resize-handle handle-' + corner;
                    handle.dataset.corner = corner; handle.setAttribute('aria-label','Cambiar tamaño de ' + item.name); node.appendChild(handle);
                    handle.addEventListener('keydown',e => {
                        if (!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','+','-'].includes(e.key)) return;
                        e.preventDefault(); e.stopPropagation(); api.select(item);
                        const factor = ['ArrowUp','ArrowRight','+'].includes(e.key) ? 1.05 : .95;
                        if (corner.length === 1 && api.stretch) api.stretch(item,(item.stretchX ?? 1) * (['e','w'].includes(corner) ? factor : 1),(item.stretchY ?? 1) * (['n','s'].includes(corner) ? factor : 1));
                        else api.resize(item,item.scale * factor); api.changed(); update();
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
                    const handle = e.target.closest('[data-corner]')?.dataset.corner;
                    drag = {item,node,pointer:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,cx,cy,startScale:item.scale,
                        startWidth:geometry.width,startHeight:geometry.height,startX:item.stretchX ?? 1,startY:item.stretchY ?? 1,shiftX:0,shiftY:0,angle:(geometry.angle || 0) * Math.PI / 180,
                        distance:Math.max(10,Math.hypot(e.clientX - cx,e.clientY - cy)),handle};
                    node.setPointerCapture(e.pointerId); node.classList.add('dragging'); update();
                });
                node.addEventListener('pointermove',e => {
                    if (!drag || drag.node !== node || drag.pointer !== e.pointerId) return;
                    e.preventDefault(); e.stopPropagation();
                    if (drag.handle?.length === 1 && api.stretch) {
                        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy, c = Math.cos(drag.angle), s = Math.sin(drag.angle);
                        const horizontal = ['e','w'].includes(drag.handle), sign = ['e','s'].includes(drag.handle) ? 1 : -1;
                        const amount = horizontal ? dx * c + dy * s : -dx * s + dy * c;
                        api.stretch(item,horizontal ? drag.startX * Math.max(.02,1 + sign * amount / drag.startWidth) : drag.startX,horizontal ? drag.startY : drag.startY * Math.max(.02,1 + sign * amount / drag.startHeight));
                        const shift = sign * (horizontal ? drag.startWidth * ((item.stretchX ?? 1) / drag.startX - 1) : drag.startHeight * ((item.stretchY ?? 1) / drag.startY - 1)) / 2;
                        const shiftX = horizontal ? shift * c : -shift * s, shiftY = horizontal ? shift * s : shift * c;
                        api.move(item,shiftX - drag.shiftX,shiftY - drag.shiftY); drag.shiftX = shiftX; drag.shiftY = shiftY;
                    } else if (drag.handle) api.resize(item,drag.startScale * Math.hypot(e.clientX - drag.cx,e.clientY - drag.cy) / drag.distance);
                    else api.move(item,e.clientX - drag.x,e.clientY - drag.y);
                    drag.x = e.clientX; drag.y = e.clientY; scheduleDragUpdate();
                });
                ['pointerup','pointercancel','lostpointercapture'].forEach(type => node.addEventListener(type,() => finishDrag(node)));
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
