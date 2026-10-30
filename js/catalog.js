const dialog = document.getElementById('productDialog');
const categories = {
    lonas: ['Lona publicitaria','Impresión en gran formato','Diseño, texto, logotipo o fotografía.','Ancho y alto, cantidad, uso y acabados solicitados.','banner'],
    dtf: ['DTF','DTF textil','Diseños para aplicación sobre prendas; revisamos el archivo antes de producir.','Medidas del diseño, cantidad y tipo de prenda.','shirt'],
    playeras: ['Playera personalizada','DTF textil, DTF reflejante o vinil','Frente y espalda; colores, cuello y mangas a elegir en el diseñador.','Talla, color, cantidad, técnica y fecha deseada.','shirt'],
    vinil: ['Vinil','Corte y aplicación de vinil','Calcomanías, letras, logotipos y etiquetas según el proyecto.','Medidas, color, cantidad y superficie donde se aplicará.',''],
    plumas: ['Pluma','Grabado láser únicamente','Nombre, texto o logotipo en un solo tono de grabado.','Modelo, cantidad, texto o logo y área disponible.','pen'],
    tazas: ['Taza','Sublimación','Mediana, grande o mágica; combina hasta cinco diseños.','Tipo de taza, cantidad y fecha deseada.','mug'],
    termos: ['Termo','Grabado láser','Texto o logotipo en un solo tono de grabado.','Modelo, capacidad o medidas, cantidad y diseño.','thermos'],
    mdf: ['MDF','Corte o grabado láser en MDF','Figuras, nombres y piezas decorativas a partir de una referencia.','Ancho, alto, espesor solicitado, cantidad y acabado.','mdf'],
    rompecabezas: ['Rompecabezas','Personalización con foto o diseño','Composición de imagen sobre un modelo de muestra.','Medidas, material, número de piezas solicitado y cantidad.','puzzle']
};
let lastCard;
function openProduct(card) {
    lastCard = card;
    const image = card.querySelector('img'), title = card.querySelector('h4').textContent;
    const info = [...(categories[card.dataset.category] || categories.mdf)];
    if (/reflejante/i.test(title)) info[1] = 'DTF reflejante';
    if (/corte|figura/i.test(title) && card.dataset.category === 'mdf') info[1] = 'Corte láser de MDF';
    if (/grabado/i.test(title) && card.dataset.category === 'mdf') info[1] = 'Grabado láser en MDF';
    document.getElementById('detailImage').src = image.src;
    document.getElementById('detailImage').alt = image.alt;
    document.getElementById('detailTitle').textContent = title;
    document.getElementById('detailDescription').textContent = card.querySelector('.product-overlay p').textContent;
    const dl = document.getElementById('detailSpecs'); dl.replaceChildren();
    for (const [label,value] of [['Producto',info[0]],['Técnica',info[1]],['Personalización',info[2]],['Datos para cotizar',info[3]]]) {
        const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; dl.append(dt,dd);
    }
    document.getElementById('detailDesign').href = 'personaliza.html?producto=' + info[4];
    document.getElementById('detailQuote').href = 'https://wa.me/524778411655?text=' + encodeURIComponent('Hola PUBLI SHOP, quiero cotizar este producto del catálogo: ' + title + '. Técnica: ' + info[1] + '. Referencia: ' + image.src + '\nCantidad y medidas: ');
    dialog.showModal(); document.body.style.overflow = 'hidden';
}
document.querySelectorAll('.product-item').forEach(card => {
    card.tabIndex = 0; card.setAttribute('role','button'); card.setAttribute('aria-haspopup','dialog');
    card.setAttribute('aria-label','Ver foto y especificaciones: ' + card.querySelector('h4').textContent);
    card.addEventListener('click',() => openProduct(card));
    card.addEventListener('keydown',e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(card); } });
});
document.getElementById('closeProduct').addEventListener('click',() => dialog.close());
dialog.addEventListener('click',e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close',() => { document.body.style.overflow = ''; lastCard?.focus(); });
