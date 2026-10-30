export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url),30000);
}
export function downloadCanvas(canvas, filename) {
    if (canvas) canvas.toBlob(blob => { if (blob) downloadBlob(blob,filename); },'image/png');
}
export function setupCompletion(api) {
    if (!document.getElementById('finishOrder')) {
        const section = document.createElement('section'); section.className = 'order-completion';
        section.innerHTML = `<h3>Solicita tu cotización</h3>
            <label for="orderQuantity">Cantidad de productos</label><input id="orderQuantity" type="number" min="1" max="100000" step="1" value="1" required>
            <label for="orderName">Tu nombre (opcional)</label><input id="orderName" maxlength="100" autocomplete="name">
            <label for="orderMeasures">Talla o medidas deseadas</label><input id="orderMeasures" maxlength="180" placeholder="Ej. talla M o 100 × 70 cm">
            <label for="orderDate">Fecha deseada (opcional)</label><input id="orderDate" type="date">
            <label for="orderNotes">Cuéntanos qué necesitas</label><textarea id="orderNotes" rows="3" maxlength="2000" placeholder="Material, acabado, medidas o cualquier detalle de tu idea."></textarea>
            <button id="finishOrder" class="btn btn-primary" type="button">Terminé · Pedir cotización por WhatsApp</button>
            <div id="completionPanel" class="completion-panel" hidden>
                <p id="completionStatus" role="status" aria-live="polite"></p>
                <div id="completionActions" hidden><a id="finishedDownload" class="btn studio-secondary">Descargar mis vistas</a>
                <a id="finishedWhatsApp" class="btn studio-whatsapp" target="_blank" rel="noopener noreferrer">Abrir WhatsApp de PUBLI SHOP</a>
                <button id="shareOrder" type="button" class="btn studio-secondary" hidden>Compartir imagen y cotización</button></div>
            </div>
            <p class="studio-help">Al terminar se descargan las vistas y se abre WhatsApp con tu solicitud. Adjunta la imagen y pulsa Enviar. En dispositivos compatibles puedes compartir la imagen y el mensaje eligiendo WhatsApp y el contacto de PUBLI SHOP (477 841 1655).</p>`;
        document.querySelector('.studio-actions').after(section);
    }
    const panel = document.getElementById('completionPanel'), button = document.getElementById('finishOrder');
    if (!button) return;
    let file = null, message = '', url = null, revision = 0;
    const status = document.getElementById('completionStatus');
    const invalidate = () => { revision++; panel.hidden = true; document.getElementById('completionActions').hidden = true; file = null; if (url) URL.revokeObjectURL(url); url = null; };
    document.querySelector('.design-panel').addEventListener('input',invalidate);
    document.querySelector('.design-panel').addEventListener('change',invalidate);
    document.addEventListener('designchange',invalidate);
    // Layer deletion and insertion also invalidate an earlier quote.
    document.getElementById('clearDesign')?.addEventListener('click',invalidate);
    document.getElementById('addText')?.addEventListener('click',invalidate);
    button.addEventListener('click',async () => {
        const quantity = document.getElementById('orderQuantity');
        if (!quantity.reportValidity()) return;
        const notes = document.getElementById('orderNotes').value.trim();
        if (!api.count() && !notes) {
            status.textContent = 'Añade un diseño o escribe qué te gustaría hacer antes de solicitar la cotización.';
            panel.hidden = false; document.getElementById('orderNotes').focus(); return;
        }
        const canvas = api.previewCanvas(); if (!canvas) return;
        const snapshotRevision = revision;
        const name = document.getElementById('orderName').value.trim();
        const measures = document.getElementById('orderMeasures').value.trim();
        const date = document.getElementById('orderDate').value;
        message = 'Hola PUBLI SHOP, terminé mi propuesta y quiero una cotización.\n' + api.summary() + '\nCantidad: ' + quantity.value +
            (name ? '\nNombre: ' + name : '') + (measures ? '\nTalla / medidas: ' + measures : '') +
            (date ? '\nFecha deseada: ' + date : '') + (notes ? '\nMi idea: ' + notes : '') + '\nDiseños: ' + api.count() +
            '\nComparto las vistas de mi propuesta. Favor de confirmar materiales, disponibilidad, precio y tiempo de entrega.';
        const whatsapp = 'https://wa.me/524778411655?text=' + encodeURIComponent(message);
        // Open during the user's click so popup blockers do not interrupt the flow.
        const tab = window.open('about:blank','_blank'); if (tab) tab.opener = null;
        button.disabled = true;
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
            if (!blob) throw new Error('No preview');
            if (snapshotRevision !== revision) throw new Error('Design changed');
            if (url) URL.revokeObjectURL(url);
            file = new File([blob],api.filename,{type:'image/png'}); url = URL.createObjectURL(blob);
            const download = document.getElementById('finishedDownload'); download.href = url; download.download = api.filename;
            document.getElementById('finishedWhatsApp').href = whatsapp;
            const share = document.getElementById('shareOrder');
            share.hidden = !(navigator.share && navigator.canShare?.({files:[file]}));
            panel.hidden = false;
            document.getElementById('completionActions').hidden = false;
            status.textContent = 'Tu propuesta está lista y la imagen se preparó para descargar. En WhatsApp pulsa Enviar y adjunta la imagen descargada. También puedes compartirla desde este dispositivo.';
            downloadBlob(blob,api.filename);
            if (tab) tab.location.href = whatsapp;
            panel.scrollIntoView({behavior:'smooth',block:'nearest'});
        } catch {
            if (tab) tab.close(); panel.hidden = false;
            status.textContent = 'No pudimos preparar la imagen. Vuelve a intentarlo; tus diseños siguen aquí.';
        } finally { button.disabled = false; }
    });
    document.getElementById('shareOrder').addEventListener('click',async () => {
        if (!file) return;
        try {
            await navigator.share({files:[file],text:message,title:'Mi propuesta PUBLI SHOP'});
            status.textContent = 'Confirma en la aplicación elegida que la imagen y la cotización se hayan enviado. WhatsApp de PUBLI SHOP: 477 841 1655.';
        } catch (error) { if (error.name !== 'AbortError') status.textContent = 'No se pudo compartir. Usa Abrir WhatsApp y adjunta la imagen descargada.'; }
    });
}
