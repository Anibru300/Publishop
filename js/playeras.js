(() => {
    const grid = document.getElementById('modelsGrid');
    const resultCount = document.getElementById('resultCount');
    const familySelect = document.getElementById('familyFilter');
    const kindSelect = document.getElementById('kindFilter');
    const genderFilters = document.getElementById('genderFilters');
    const searchInput = document.getElementById('modelSearch');
    const colorSelect = document.getElementById('colorFilter');
    const sortSelect = document.getElementById('sortModels');
    const clearButton = document.getElementById('clearFilters');
    const emptyState = document.getElementById('emptyState');
    const dialog = document.getElementById('modelDialog');
    const closeDialog = document.getElementById('closeDialog');
    let models = [];
    let gender = 'Todos';
    let kind = 'Todos';
    let family = '';
    let activeButton = null;
    let observer;

    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const escapeHTML = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const swatches = {
        negro:'#171717', blanco:'#f4f3ef', marino:'#182b49', azul:'#155eef', rey:'#1755c7',
        rojo:'#d42c37', vino:'#722f45', rosa:'#e983bb', morado:'#7337a8', lila:'#b8a0d7',
        gris:'#85858a', carbon:'#42444a', jaspe:'#8f8f92', aqua:'#36aeb0', turquesa:'#16a1a3',
        verde:'#27905b', olivo:'#77834b', limon:'#c4cf37', amarillo:'#f5d548', naranja:'#ed812f',
        cafe:'#704a3c', canario:'#f2d928', arena:'#c9b99c', plata:'#c0c1c4'
    };
    const colorHex = color => swatches[normalize(color).split(/\s+/)[0]] || '#81818a';
    const sheetURL = model => `assets/images/playeras/galeria/${model.sheet}`;
    const position = model => `${model.column * 25}% ${model.row * (100 / 3)}%`;
    const genderLabel = value => value === 'Por confirmar' ? 'Otros modelos' : value;
    const familyOf = model => {
        if (model.kind === 'Camisetas') return 'Camisetas';
        if (model.kind === 'Polos') return 'Polos';
        if (/^camisa/i.test(model.title)) return 'Camisas';
        if (model.kind === 'Deportivas') return 'Playeras deportivas';
        if (model.kind === 'Para sublimación') return 'Playeras para sublimar';
        return 'Playeras';
    };

    function filteredModels() {
        const tokens = normalize(searchInput.value.trim()).split(/\s+/).filter(Boolean);
        const selectedColor = colorSelect.value;
        const matches = models.filter(model => {
            if (!family && !tokens.length) return false;
            if (family && familyOf(model) !== family) return false;
            if (gender !== 'Todos' && model.gender !== gender) return false;
            if (kind !== 'Todos' && model.kind !== kind) return false;
            if (selectedColor !== 'Todos' && model.color !== selectedColor) return false;
            const haystack = normalize([model.title, model.gender, model.kind, model.color, model.composition].join(' '));
            return tokens.every(token => haystack.includes(token));
        });
        const sort = sortSelect.value;
        if (sort === 'az') matches.sort((a,b) => a.title.localeCompare(b.title, 'es'));
        if (sort === 'za') matches.sort((a,b) => b.title.localeCompare(a.title, 'es'));
        return matches;
    }

    function drawFamilies() {
        const priority = ['Playeras','Camisetas','Polos','Camisas','Playeras deportivas','Playeras para sublimar'];
        const present = new Set(models.map(familyOf));
        const families = priority.filter(value => present.has(value));
        families.forEach(value => familySelect.add(new Option(`${value} · ${models.filter(model => familyOf(model) === value).length}`, value)));
    }

    function drawKinds() {
        const kinds = [...new Set(models.filter(model => family && familyOf(model) === family).map(model => model.kind))];
        kindSelect.replaceChildren(new Option('Todos los estilos', 'Todos'));
        kinds.forEach(value => kindSelect.add(new Option(`${value} · ${models.filter(model => familyOf(model) === family && model.kind === value).length}`, value)));
        kindSelect.disabled = !family;
    }

    function drawColors() {
        const colors = [...new Set(models.filter(model => family && familyOf(model) === family && (kind === 'Todos' || model.kind === kind)).map(model => model.color).filter(Boolean))]
            .sort((a,b) => a.localeCompare(b, 'es'));
        colorSelect.replaceChildren(new Option(family ? 'Todos los colores' : 'Elige primero el tipo', 'Todos'));
        colorSelect.disabled = !family;
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorSelect.append(option);
        });
    }

    function photoElement(model, extraClass = '') {
        return `<div class="playera-photo ${extraClass}" data-sheet="${escapeHTML(model.sheet)}" data-x="${model.column}" data-y="${model.row}" role="img" aria-label="${escapeHTML(model.title)}"></div>`;
    }

    function observePhotos() {
        observer?.disconnect();
        const photos = grid.querySelectorAll('.playera-photo[data-sheet]');
        const load = photo => {
            const sheet = photo.dataset.sheet;
            if (!/^galeria-\d{2}\.webp$/.test(sheet)) return;
            photo.style.backgroundImage = `url("${sheetURL({sheet})}")`;
            photo.style.backgroundPosition = position({column:Number(photo.dataset.x),row:Number(photo.dataset.y)});
            photo.removeAttribute('data-sheet');
        };
        if (!('IntersectionObserver' in window)) {
            photos.forEach(load);
            return;
        }
        observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                load(entry.target);
                observer.unobserve(entry.target);
            });
        }, {rootMargin:'320px 0px'});
        photos.forEach(photo => observer.observe(photo));
    }

    function render() {
        const results = filteredModels();
        const hasFilters = !!family || gender !== 'Todos' || kind !== 'Todos' || colorSelect.value !== 'Todos' || searchInput.value.trim();
        resultCount.innerHTML = `<strong>${results.length}</strong> ${results.length === 1 ? 'modelo' : 'modelos'} ${hasFilters ? 'en esta selección' : 'disponibles para explorar'}`;
        clearButton.hidden = !hasFilters;
        emptyState.hidden = results.length > 0;
        grid.hidden = results.length === 0;
        if (!family && !searchInput.value.trim()) {
            emptyState.querySelector('h3').textContent = 'Elige una categoría para empezar';
            emptyState.querySelector('p').textContent = 'Selecciona playeras, camisetas, polos u otra categoría. Después filtra por estilo y color.';
        } else {
            emptyState.querySelector('h3').textContent = 'No encontramos ese modelo';
            emptyState.querySelector('p').textContent = 'Prueba con otras palabras o cambia el estilo, el color o el público.';
        }
        grid.innerHTML = results.map(model => {
            const index = models.indexOf(model);
            const group = genderLabel(model.gender);
            return `<article class="playera-card">
                <button type="button" class="playera-card__open" data-model-index="${index}" aria-label="Ver ${escapeHTML(model.title)}">
                    ${photoElement(model, 'playera-card__photo')}
                    <div class="playera-card__content">
                        <div class="playera-card__tags"><span class="playera-tag playera-tag--gender">${escapeHTML(group)}</span><span class="playera-tag">${escapeHTML(model.kind)}</span></div>
                        <h3>${escapeHTML(model.title)}</h3>
                        ${model.color ? `<span class="playera-card__color"><span class="playera-card__swatch" style="background:${colorHex(model.color)}"></span>${escapeHTML(model.color)}</span>` : ''}
                    </div>
                </button>
            </article>`;
        }).join('');
        observePhotos();
    }

    function openModel(model, button) {
        activeButton = button;
        const photo = document.getElementById('dialogPhoto');
        photo.dataset.sheet = model.sheet;
        photo.style.backgroundImage = `url("${sheetURL(model)}")`;
        photo.style.backgroundPosition = position(model);
        photo.setAttribute('aria-label', model.title);
        document.getElementById('dialogGender').textContent = genderLabel(model.gender);
        document.getElementById('dialogTitle').textContent = model.title;
        document.getElementById('dialogIntro').textContent = 'Al personalizarlo, cargaremos automáticamente el corte, color y composición de este modelo.';
        const specs = document.getElementById('dialogSpecs');
        specs.replaceChildren();
        [['Público',genderLabel(model.gender)],['Estilo',model.kind],['Color',model.color || 'Por confirmar'],['Composición',model.composition || 'Por confirmar']].forEach(([label,value]) => {
            const dt = document.createElement('dt'), dd = document.createElement('dd');
            dt.textContent = label; dd.textContent = value; specs.append(dt,dd);
        });
        const message = `Hola PUBLI SHOP, quiero cotizar el modelo ${model.title}. Público: ${genderLabel(model.gender)}. Color: ${model.color || 'por confirmar'}. Cantidad y tallas: `;
        document.getElementById('dialogQuote').href = `https://wa.me/524778411655?text=${encodeURIComponent(message)}`;
        const designURL = new URL('personaliza-playera.html', location.href);
        for (const key of ['title','gender','kind','color','composition']) designURL.searchParams.set(key, model[key] || '');
        document.getElementById('dialogDesign').href = designURL.href;
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        closeDialog.focus();
    }

    function clearFilters() {
        gender = 'Todos'; kind = 'Todos'; family = '';
        familySelect.value = ''; kindSelect.replaceChildren(new Option('Todos los estilos', 'Todos')); kindSelect.disabled = true;
        searchInput.value = ''; colorSelect.value = 'Todos'; sortSelect.value = 'featured';
        genderFilters.querySelectorAll('[data-gender]').forEach(button => {
            const active = button.dataset.gender === 'Todos';
            button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
        });
        drawColors(); render();
    }

    genderFilters.addEventListener('click', event => {
        const button = event.target.closest('[data-gender]');
        if (!button) return;
        gender = button.dataset.gender;
        genderFilters.querySelectorAll('[data-gender]').forEach(item => {
            const active = item === button;
            item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active));
        });
        render();
    });
    familySelect.addEventListener('change', () => { family = familySelect.value; kind = 'Todos'; colorSelect.value = 'Todos'; drawKinds(); drawColors(); render(); });
    kindSelect.addEventListener('change', () => { kind = kindSelect.value; colorSelect.value = 'Todos'; drawColors(); render(); });
    grid.addEventListener('click', event => {
        const button = event.target.closest('[data-model-index]');
        if (button) openModel(models[Number(button.dataset.modelIndex)], button);
    });
    [searchInput, colorSelect, sortSelect].forEach(control => control.addEventListener(control === searchInput ? 'input' : 'change', render));
    clearButton.addEventListener('click', clearFilters);
    document.getElementById('emptyClear').addEventListener('click', clearFilters);
    closeDialog.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
        document.body.style.overflow = '';
        activeButton?.focus();
    });
    document.addEventListener('keydown', event => {
        if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !dialog.open) {
            event.preventDefault(); searchInput.focus();
        }
    });

    fetch('data/playeras.json')
        .then(response => { if (!response.ok) throw new Error('No se pudo abrir el catálogo'); return response.json(); })
        .then(data => {
            models = data;
            document.getElementById('heroModelCount').textContent = models.length;
            drawFamilies(); drawKinds(); drawColors(); render();
        })
        .catch(() => {
            resultCount.textContent = 'No pudimos cargar los modelos en este momento.';
            grid.hidden = true;
            emptyState.hidden = false;
            emptyState.querySelector('h3').textContent = 'El catálogo no se pudo cargar';
            emptyState.querySelector('p').textContent = 'Recarga la página para volver a intentarlo.';
            emptyState.querySelector('button').hidden = true;
        });
})();
