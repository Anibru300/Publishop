(() => {
    const grid = document.getElementById('modelsGrid');
    const count = document.getElementById('resultCount');
    const heading = document.getElementById('wizardHeading');
    const crumbs = document.getElementById('wizardCrumbs');
    const search = document.getElementById('modelSearch');
    const empty = document.getElementById('wizardEmpty');
    const dialog = document.getElementById('modelDialog');
    const closeDialog = document.getElementById('closeDialog');
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const escapeHTML = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const swatches = {negro:'#171717',blanco:'#f4f3ef',marino:'#182b49',azul:'#155eef',rey:'#1755c7',rojo:'#d42c37',vino:'#722f45',rosa:'#e983bb',morado:'#7337a8',lila:'#b8a0d7',gris:'#85858a',carbon:'#42444a',jaspe:'#8f8f92',aqua:'#36aeb0',turquesa:'#16a1a3',verde:'#27905b',olivo:'#77834b',limon:'#c4cf37',amarillo:'#f5d548',naranja:'#ed812f',cafe:'#704a3c',canario:'#f2d928',arena:'#c9b99c',cielo:'#8cc9e8',hueso:'#ece6d8',menta:'#95cdb1',khaki:'#b4a582',oxford:'#646b72',petroleo:'#16777c',salmón:'#ed9b8a',salmon:'#ed9b8a'};
    const colorHex = color => {
        const name = normalize(color);
        if (name.includes('marino')) return swatches.marino;
        if (name.includes('rey')) return swatches.rey;
        if (name.includes('cielo')) return swatches.cielo;
        return swatches[name.split(/\s+/)[0]] || '#81818a';
    };
    const sheetURL = model => `assets/images/playeras/galeria/${model.sheet}`;
    const position = model => `${model.column * 25}% ${model.row * (100 / 3)}%`;
    const audienceLabel = value => value === 'Por confirmar' ? 'Otros modelos' : value;
    const modelColor = model => {
        if (model.color) return model.color;
        const match = model.title.match(/(?:Mineral|Pigment) Wash\s+(.+?)(?:\s+Prelavado|\s+Unisex|\s+Costuras|$)/i);
        return match ? match[1].trim() : '';
    };
    const hoodieColors = [
        ['Negro','#171717'],['Blanco','#f4f3ef'],['Gris','#85858a'],['Marino','#182b49'],['Azul rey','#1755c7'],['Rojo','#d42c37'],['Verde','#27905b'],['Rosa','#e983bb'],['Beige','#c9b99c']
    ];
    let models = [], step = 'audience', gender = '', kind = '', selectedModel = null, hoodieType = 'hoodie', activeButton = null;

    function photo(model, extra='') {
        return `<div class="playera-photo ${extra}" style="background-image:url('${sheetURL(model)}');background-position:${position(model)}" role="img" aria-label="${escapeHTML(model.title)}"></div>`;
    }
    function hoodieSVG(color) {
        const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#5b4a72';
        return `<svg viewBox="0 0 240 250" role="img" aria-label="Sudadera"><path d="M77 43 95 24q25-13 50 0l18 19 39 20 26 50-30 15-16-25v119H58V103l-16 25-30-15 26-50z" fill="${safeColor}" stroke="#d8d2e4" stroke-width="4" stroke-linejoin="round"/><path d="M94 25q4 39 26 47 22-8 26-47M120 72v150M84 156q36 14 72 0l9 36H75z" fill="none" stroke="#d8d2e4" stroke-width="3"/><path d="M108 72v39m24-39v39" stroke="#eee" stroke-width="3"/></svg>`;
    }
    function kindLabel(value) {
        const map = {'Manga corta':'Playeras de manga corta','Manga larga':'Playeras de manga larga','Camisetas':'Camisetas','Polos':'Playeras tipo polo','Deportivas':'Playeras deportivas','Corte especial':'Cortes especiales','Otros estilos':'Otros estilos','Para sublimación':'Playeras para sublimar'};
        return map[value] || value;
    }
    function modelBase(model) {
        let title = model.title;
        const color = modelColor(model);
        if (color) {
            const marker = title.toLowerCase().lastIndexOf(' color ');
            if (marker >= 0) title = title.slice(0, marker);
            else if (/wash/i.test(title)) title = title.replace(/((?:Mineral|Pigment) Wash)\s+.+?(?=\s+(?:Prelavado|Unisex|Costuras)|$)/i,'$1');
        }
        title = title.replace(/\s+(?:para\s+)?(?:hombre|mujer|unisex)(?=\s|$)/ig, ' ');
        return title.replace(/\s+/g,' ').replace(/[\s,·-]+$/,'').trim();
    }
    function groupedModels() {
        const matches = models.filter(model => model.gender === gender && model.kind === kind);
        const groups = new Map();
        for (const model of matches) {
            const key = normalize(modelBase(model));
            if (!groups.has(key)) groups.set(key,{title:modelBase(model),items:[]});
            groups.get(key).items.push(model);
        }
        return [...groups.values()].sort((a,b)=>a.title.localeCompare(b.title,'es'));
    }
    function setStep(next) {
        step = next;
        search.value = '';
        render();
    }
    function drawCrumbs() {
        const stages = [
            ['audience','Público',!!gender],['product','Prenda',!!kind || step==='product'],['kind','Estilo',!!kind && step!=='kind'],['model','Modelo',!!selectedModel],['color','Color',false]
        ];
        crumbs.innerHTML = stages.map(([id,label,done]) => {
            const active = step === id || (['hoodieType','hoodieColor'].includes(step) && id === 'kind');
            return `<span class="catalog-wizard__crumb${active?' is-active':''}${done?' is-done':''}">${label}</span>`;
        }).join('<i aria-hidden="true">›</i>');
        const backTargets = {product:'audience',kind:'product',model:'kind',color:'model',hoodieType:'product',hoodieColor:'hoodieType'};
        const target = backTargets[step];
        if (target) crumbs.insertAdjacentHTML('afterbegin',`<button class="catalog-wizard__back" type="button" data-back="${target}"><i class="fas fa-arrow-left" aria-hidden="true"></i> Atrás</button>`);
    }
    function card({title,subtitle='',image,action,tag=''}) {
        return `<button class="wizard-card" type="button" data-action="${escapeHTML(action)}" aria-label="${escapeHTML(`${title}. ${subtitle}`)}">${image}<span class="wizard-card__body">${tag?`<small>${escapeHTML(tag)}</small>`:''}<strong>${escapeHTML(title)}</strong>${subtitle?`<span>${escapeHTML(subtitle)}</span>`:''}</span></button>`;
    }
    function drawAudience() {
        heading.textContent = '¿Para quién buscas una prenda?';
        return ['Hombre','Mujer','Unisex'].map(value => {
            const sample = models.find(m=>m.gender===value) || models[0];
            return card({title:value,subtitle:'Ver modelos disponibles',tag:`${models.filter(m=>m.gender===value).length} modelos`,image:photo(sample,'wizard-card__photo'),action:`audience:${value}`});
        }).join('');
    }
    function drawProduct() {
        heading.textContent = `Modelos disponibles para ${audienceLabel(gender).toLowerCase()}`;
        const shirt = models.find(m=>m.gender===gender) || models[0];
        return card({title:'Playeras y camisetas',subtitle:'Manga corta, manga larga, polos y más',image:photo(shirt,'wizard-card__photo'),action:'product:shirt'}) +
            card({title:'Sudaderas',subtitle:'Con capucha o cierre · Personalizables',image:`<div class="wizard-card__art">${hoodieSVG('#6b5b83')}</div>`,action:'product:hoodie'});
    }
    function drawKinds() {
        heading.textContent = 'Elige el estilo de playera';
        const kinds = [...new Set(models.filter(m=>m.gender===gender).map(m=>m.kind))];
        return kinds.map(value => {
            const sample = models.find(m=>m.gender===gender&&m.kind===value);
            const total = models.filter(m=>m.gender===gender&&m.kind===value).length;
            return card({title:kindLabel(value),subtitle:`${total} opciones para explorar`,tag:'Categoría',image:photo(sample,'wizard-card__photo'),action:`kind:${value}`});
        }).join('');
    }
    function drawModels() {
        heading.textContent = `${kindLabel(kind)} · elige un modelo`;
        return groupedModels().map(group => {
            const sample = group.items[0];
            const colors = new Set(group.items.map(modelColor).filter(Boolean));
            return card({title:group.title,subtitle:`${colors.size || 1} colores disponibles`,tag:audienceLabel(gender),image:photo(sample,'wizard-card__photo'),action:`model:${normalize(modelBase(sample))}`});
        }).join('');
    }
    function drawColors() {
        heading.textContent = `Colores disponibles · ${selectedModel.title}`;
        const variants = selectedModel.items.filter(modelColor);
        return variants.map((model,index)=>card({title:modelColor(model),subtitle:'Ver detalle y personalizar',tag:`Color ${index+1}`,image:photo(model,'wizard-card__photo'),action:`color:${selectedModel.items.indexOf(model)}`})).join('') || card({title:'Consultar colores',subtitle:'Solicita disponibilidad por WhatsApp',image:photo(selectedModel.items[0],'wizard-card__photo'),action:'color:0'});
    }
    function drawHoodieType() {
        heading.textContent = 'Elige el modelo de sudadera';
        return [['hoodie','Con capucha'],['zip','Con cierre']].map(([value,label])=>card({title:label,subtitle:'Sudadera personalizable',image:`<div class="wizard-card__art">${hoodieSVG('#6b5b83')}</div>`,action:`hoodie-type:${value}`})).join('');
    }
    function drawHoodieColors() {
        heading.textContent = `Colores de sudadera ${hoodieType==='zip'?'con cierre':'con capucha'}`;
        return hoodieColors.map(([name,hex])=>card({title:name,subtitle:'Ver modelo y personalizar',tag:'Color',image:`<div class="wizard-card__art">${hoodieSVG(hex)}</div>`,action:`hoodie-color:${encodeURIComponent(name)}`})).join('');
    }
    function render() {
        drawCrumbs();
        const draw = {audience:drawAudience,product:drawProduct,kind:drawKinds,model:drawModels,color:drawColors,hoodieType:drawHoodieType,hoodieColor:drawHoodieColors}[step];
        let html = draw ? draw() : '';
        const query = normalize(search.value.trim());
        if (query) {
            const tokens = query.split(/\s+/).filter(Boolean);
            if (step==='audience') html = html.split('</button>').filter(Boolean).filter((part,i)=>tokens.every(t=>normalize(['Hombre','Mujer','Unisex'][i]).includes(t))).map(part=>part+'</button>').join('');
            else if (['product','kind','hoodieType'].includes(step)) html = html.split('</button>').filter(part=>tokens.every(t=>normalize(part).includes(t))).map(part=>part+'</button>').join('');
            else if (step==='model') html = groupedModels().filter(g=>tokens.every(t=>normalize([g.title,kind,gender,g.items.map(modelColor).join(' ')].join(' ')).includes(t))).map(g=>{const m=g.items[0];return card({title:g.title,subtitle:`${new Set(g.items.map(modelColor).filter(Boolean)).size} colores disponibles`,tag:audienceLabel(gender),image:photo(m,'wizard-card__photo'),action:`model:${normalize(modelBase(m))}`});}).join('');
            else if (step==='color') html = selectedModel.items.filter(m=>tokens.every(t=>normalize([m.title,modelColor(m),m.kind,m.composition].join(' ')).includes(t))).map(m=>card({title:modelColor(m)||'Color por confirmar',subtitle:'Ver detalle y personalizar',image:photo(m,'wizard-card__photo'),action:`color:${selectedModel.items.indexOf(m)}`})).join('');
            else if (step==='hoodieColor') html = hoodieColors.filter(([name])=>tokens.every(t=>normalize([name,hoodieType,gender].join(' ')).includes(t))).map(([name,hex])=>card({title:name,subtitle:'Ver modelo y personalizar',tag:'Color',image:`<div class="wizard-card__art">${hoodieSVG(hex)}</div>`,action:`hoodie-color:${encodeURIComponent(name)}`})).join('');
        }
        grid.innerHTML = html;
        grid.hidden = !html;
        empty.hidden = !!html;
        count.textContent = html ? `${grid.querySelectorAll('.wizard-card').length} opciones · selecciona una imagen para continuar` : 'Sin coincidencias en esta selección';
    }
    function groupFromKey(key) { return groupedModels().find(g=>normalize(modelBase(g.items[0]))===key); }
    function openModel(model, button, hoodie=false) {
        model={...model,color:modelColor(model)};
        activeButton=button;
        const photoBox=document.getElementById('dialogPhoto');
        if (hoodie) { photoBox.style.backgroundImage='none'; photoBox.innerHTML=hoodieSVG(colorHex(model.color)); }
        else { photoBox.innerHTML=''; photoBox.style.backgroundImage=`url("${sheetURL(model)}")`; photoBox.style.backgroundPosition=position(model); }
        photoBox.setAttribute('aria-label',model.title);
        document.getElementById('dialogGender').textContent=audienceLabel(model.gender);
        document.getElementById('dialogTitle').textContent=model.title;
        document.getElementById('dialogIntro').textContent='Elegiste este modelo y color. Personalízalo y envíanos tu solicitud de cotización.';
        const specs=document.getElementById('dialogSpecs'); specs.replaceChildren();
        [['Público',audienceLabel(model.gender)],['Estilo',model.kind],['Color',model.color||'Por confirmar'],['Composición',model.composition||'Por confirmar']].forEach(([label,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;specs.append(dt,dd);});
        const msg=`Hola PUBLI SHOP, quiero cotizar ${hoodie?'una sudadera':'el modelo '+model.title}. Público: ${audienceLabel(model.gender)}. ${model.kind}. Color: ${model.color||'por confirmar'}. Cantidad y tallas: `;
        document.getElementById('dialogQuote').href=`https://wa.me/524778411655?text=${encodeURIComponent(msg)}`;
        const target=new URL(hoodie?'personaliza-sudadera.html':'personaliza-playera.html',location.href);
        for(const key of ['title','gender','kind','color','composition']) target.searchParams.set(key,model[key]||'');
        if(hoodie) target.searchParams.set('type',model.type||hoodieType);
        document.getElementById('dialogDesign').href=target.href;
        document.getElementById('dialogDesign').textContent=hoodie?'Personaliza esta sudadera':'Diseña esta playera';
        dialog.showModal(); document.body.style.overflow='hidden'; closeDialog.focus();
    }
    function handleAction(button) {
        const [action,value]=button.dataset.action.split(':');
        if(action==='audience'){gender=value;setStep('product');return;}
        if(action==='product'){if(value==='shirt'){setStep('kind');}else{hoodieType='hoodie';setStep('hoodieType');}return;}
        if(action==='kind'){kind=value;setStep('model');return;}
        if(action==='model'){selectedModel=groupFromKey(value);setStep('color');return;}
        if(action==='color'){openModel(selectedModel.items[Number(value)]||selectedModel.items[0],button);return;}
        if(action==='hoodie-type'){hoodieType=value;setStep('hoodieColor');return;}
        if(action==='hoodie-color'){
            const name=decodeURIComponent(value), color=hoodieColors.find(([n])=>n===name)?.[1]||'#81818a';
            openModel({title:`Sudadera ${hoodieType==='zip'?'con cierre':'con capucha'} ${audienceLabel(gender)}`,gender,kind:hoodieType==='zip'?'Con cierre':'Con capucha',color:name,composition:'Material por confirmar',type:hoodieType},button,true);
        }
    }
    grid.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)handleAction(button);});
    crumbs.addEventListener('click',event=>{const button=event.target.closest('[data-back]');if(button)setStep(button.dataset.back);});
    search.addEventListener('input',render);
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!dialog.open){event.preventDefault();search.focus();}});
    closeDialog.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{document.body.style.overflow='';activeButton?.focus();});

    fetch('data/playeras.json').then(response=>{if(!response.ok)throw new Error('No se pudo cargar el catálogo');return response.json();}).then(data=>{
        models=data;
        document.getElementById('heroModelCount').textContent=models.length;
        render();
    }).catch(()=>{
        heading.textContent='El catálogo no pudo cargarse';
        grid.hidden=true;empty.hidden=false;
        empty.querySelector('h3').textContent='No pudimos cargar los modelos';
        empty.querySelector('p').textContent='Recarga la página para volver a intentarlo.';
        count.textContent='Error al leer el catálogo';
    });
})();
