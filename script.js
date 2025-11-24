/* MicroBioBase - script.js
   - Carrega data.json localmente
   - Renderiza cards responsivos
   - Busca em tempo real, categorias na sidebar
   - Painel de detalhes no próprio <main>
   - Modo escuro com persistência em localStorage
   - Favoritos salvos no localStorage
*/
(function(){
  const DATA_FILE = 'data.json';
  const THEME_KEY = 'microbiobase-dark';
  const FAV_KEY = 'microbiobase-favs';

  const searchEl = document.getElementById('search');
  const themeBtn = document.getElementById('theme-toggle');
  const navBtns = document.querySelectorAll('.nav-btn');
  const cardsContainer = document.getElementById('cards');
  const detailPanel = document.getElementById('detail');
  const detailContent = document.getElementById('detail-content');
  const detailClose = document.getElementById('detail-close');
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');
  const aboutBtn = document.getElementById('about-btn');
  const aboutModal = document.getElementById('about-modal');
  const aboutClose = document.getElementById('about-close');
  const exportImageBtn = document.getElementById('export-image-btn');
  const itemsCountEl = document.getElementById('items-count');
  const siteLogo = document.querySelector('.site-logo');

  let data = {items:[]};
  let activeCategory = 'all';
  let favorites = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));

  // theme
  function applyTheme(dark){
    if(dark) document.documentElement.classList.add('dark-mode'); else document.documentElement.classList.remove('dark-mode');
    if(themeBtn){
      themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      // atualizar título e conteúdo (ícone + rótulo)
      themeBtn.title = dark ? 'Alternar para modo claro' : 'Alternar para modo escuro';
      const icon = dark ? '🌙' : '☀️';
      const label = dark ? 'Escuro' : 'Claro';
      themeBtn.innerHTML = `<span class="theme-icon" aria-hidden="true">${icon}</span><span class="theme-label">${label}</span>`;
    }
    localStorage.setItem(THEME_KEY, dark ? '1' : '0');
  }
  // Verifica se o tema salvo não é '0'. Se for a primeira visita (null), o resultado será true,
  // tornando o modo escuro o padrão.
  const savedTheme = localStorage.getItem(THEME_KEY) !== '0';
  if(themeBtn) themeBtn.addEventListener('click', ()=> applyTheme(!document.documentElement.classList.contains('dark-mode')));
  applyTheme(savedTheme);

  // Prevent dragging and context menu on the logo as extra protection
  if(siteLogo){
    siteLogo.addEventListener('dragstart', function(e){ e.preventDefault(); });
    siteLogo.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  }

  // load data
  async function load(){
    try{
      const res = await fetch(DATA_FILE);
      const parsed = await res.json();
      // normalizar formato: aceitar tanto {items: [...]} quanto [...] e nomes em PT/EN
      data = normalizeData(parsed);
      console.info('MicroBioBase: dados carregados —', (data.items||[]).length, 'itens');
      renderCards();
    }catch(e){
      console.error('Erro ao carregar data.json', e);
      // tentar fallback embutido (se houver)
      const fb = document.getElementById('data-fallback');
      if(fb){
        try{
          const parsed = JSON.parse(fb.textContent || fb.innerText);
          data = normalizeData(parsed);
          console.warn('Usando fallback embutido para dados (data-fallback)');
          renderCards();
          return;
        }catch(e2){
          console.error('Erro ao parsear fallback embutido', e2);
        }
      }
      cardsContainer.innerHTML = '<p class="error">Erro ao carregar base local (data.json). Se estiver abrindo o arquivo diretamente via <code>file://</code>, sirva a pasta por um servidor HTTP (ex.: `python -m http.server`) e recarregue a página.</p>';
    }
  }

  // filtros dinâmicos removidos — a navegação usa botões explícitos agora

  function capitalize(s){ return String(s||'').replace(/(^|_)([a-z])/g,(m,p,c)=> c.toUpperCase()); }

  function clearActiveNav(){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); }

  // normaliza várias formas de JSON para { items: [...] }
function normalizeData(parsed){
  let arr = [];
  if(!parsed) return {items: []};
  if(Array.isArray(parsed)) arr = parsed;
  else if(Array.isArray(parsed.items)) arr = parsed.items;
  else if(Array.isArray(parsed.data)) arr = parsed.data;
  else arr = [];

  const norm = arr.map((it, idx)=>{
    const name = it.name || it.nome || it.nome_comum || it.nome_popular || '';
    const description = it.description || it.descricao || it.importancia_clinica || it.summary || '';
    const classification = it.classification || it.classificacao || it.classificacao_principal || '';
    const morfologia = it.morfologia || it.morphology || '';
    const gram = it.gram || (classification ? (classification.toLowerCase().includes('gram') ? classification : '') : '') ;

    // --- antibióticos ---
    let antibioticos = it.antibioticos || it.antibioticos_recomendados || it.breakdowns || [];
    if(Array.isArray(antibioticos)){
      antibioticos = antibioticos.map(a => (typeof a === 'string' ? { nome: a } : a));
    }

    // Se for um antibiótico, o objeto 'breakpoints' precisa ser transformado
    // em um array 'antibioticos' para que a lógica de exibição funcione.
    if (it.type === 'antibiotic' && it.breakpoints) {
        const bpGroups = it.breakpoints;
        const keys = Object.keys(bpGroups);

        // Verifica se os breakpoints são um objeto com múltiplos grupos
        if (keys.length > 0 && typeof bpGroups[keys[0]] === 'object') {
            // Transforma { "Grupo1": {...}, "Grupo2": {...} } em um array
            antibioticos = keys.map(groupName => ({
                nome: groupName, // O nome do grupo (ex: "Streptococcus")
                breakpoint: bpGroups[groupName] // O objeto de breakpoint {S, I, R}
            }));
        }
    }

    // --- resistência ---
    let resistencia = it.resistencia || it.resistencias || it.resistance || [];
    if((!resistencia || !resistencia.length) && Array.isArray(it.tags)){
      resistencia = it.tags.filter(t => /resist/i.test(String(t)) || /resistên/i.test(String(t)) || /beta/i.test(String(t)));
    }

    // --- cultivo ---
    const cultivo = it.cultivo || it.cultivo_recomendado || it.culture || it.cultivo_padrao || '';

    // --- tipo ---
    const type = it.type || it.tipo || (Array.isArray(antibioticos) && antibioticos.length ? 'microbe' : 'microbe');

    // --- id ---
    const id = it.id || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g,'_') : `item_${idx}`);
    const image = it.image || '';

    return {
      id, name, description, classification, morfologia, gram, antibioticos, resistencia, cultivo, type, image, raw: it
    };
  });

  return { items: norm };
}

  // render cards according to filters
function renderCards() {
  const q = (searchEl.value || '').trim().toLowerCase();
  cardsContainer.innerHTML = '';
  const items = data.items || [];

  items.forEach((it, idx) => {
    if (!passesCategory(it)) return;

    if (q) {
      const hay = ((it.name || '') + ' ' + (it.description || '') + ' ' + (it.classification || '')).toLowerCase();
      if (!hay.includes(q)) return;
    }

    // --- Card ---
    const card = document.createElement('article');
    card.className = 'card';
    // garante id válido
    card.id = it.id || `card_${idx}`;

    // --- Conteúdo do card ---
    const h = document.createElement('h3');
    h.textContent = it.name;

    const cls = document.createElement('div');
    cls.className = 'meta';
    cls.textContent = it.classification || '';

    const gram = document.createElement('div');
    gram.className = 'meta';
    gram.textContent = it.gram ? `Gram: ${it.gram}` : '';

    const morph = document.createElement('div');
    morph.className = 'meta';
    morph.textContent = it.morfologia ? `Morfologia: ${it.morfologia}` : '';

    // --- Ações ---
    const actions = document.createElement('div');
    actions.className = 'actions';

    // Botão favorito
    const favBtn = document.createElement('button');
    favBtn.className = 'fav btn-fav';
    favBtn.type = 'button';
    favBtn.textContent = favorites.has(it.id) ? '★ Favorito' : '☆ Favorito';
    favBtn.setAttribute('aria-pressed', favorites.has(it.id) ? 'true' : 'false');
    if (favorites.has(it.id)) favBtn.classList.add('active');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(it.id, favBtn);
    });

    // Botão abrir detalhe
    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.textContent = 'Abrir';
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isPanelOpen = detailPanel.getAttribute('aria-hidden') === 'false';
      const isSameItem = detailPanel.dataset.currentItemId === it.id;

      if (isPanelOpen && isSameItem) {
        closeDetail();
      } else {
        openDetail(it);
      }
    });

    actions.appendChild(favBtn);
    actions.appendChild(openBtn);

    card.appendChild(h);
    card.appendChild(cls);
    card.appendChild(gram);
    card.appendChild(morph);
    card.appendChild(actions);

    card.addEventListener('click', () => openDetail(it));

    cardsContainer.appendChild(card);
  });

  // Atualiza contador de cards visíveis / total
  try {
    const visible = cardsContainer.children.length;
    const total = items.length;
    if (itemsCountEl) itemsCountEl.textContent = `Mostrando ${visible} de ${total}`;
  } catch (e) { /* ignora */ }
}

  function passesCategory(item){
    if(activeCategory === 'all') return true;

    if(activeCategory === 'favorites') return favorites.has(item.id);
    if(activeCategory === 'antibiotics') return item.type === 'antibiotic';
    if(activeCategory === 'gram+') return (item.gram||'').toLowerCase().includes('gram+');
    if(activeCategory === 'gram-') return (item.gram||'').toLowerCase().includes('gram-');

    // Filtro principal por classificação (Bactéria, Fungo, etc.)
    return (item.classification || '').toLowerCase() === activeCategory.toLowerCase();
  }

  function toggleFavorite(id, btn){
    if(favorites.has(id)){
      favorites.delete(id);
      if(btn){ btn.textContent = '☆ Favorito'; btn.setAttribute('aria-pressed','false'); btn.classList.remove('active'); }
    } else {
      favorites.add(id);
      if(btn){ btn.textContent = '★ Favorito'; btn.setAttribute('aria-pressed','true'); btn.classList.add('active'); }
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favorites)));
  }

 // detail panel
function openDetail(item) {
    detailPanel.dataset.currentItemId = item.id; // Armazena o ID do item atual
    detailPanel.setAttribute('aria-hidden', 'false');
    detailContent.innerHTML = '';

    // --- Cabeçalho com Nome e Imagem ---
    const header = document.createElement('div');
    header.className = 'detail-header';

    const title = document.createElement('h2');
    title.textContent = item.name;
    header.appendChild(title);

    if (item.image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'detail-image-container';
        const imgElement = document.createElement('img');
        imgElement.src = item.image;
        imgElement.alt = `Imagem de ${item.name}`;
        imgElement.className = 'detail-image';
        imgElement.style.cursor = 'zoom-in';
        imgElement.addEventListener('click', () => showImageZoom(item.image, item.name));
        imgContainer.appendChild(imgElement);
        header.appendChild(imgContainer);

        // Adiciona um texto explicativo para a imagem do Treponema pallidum (VDRL)
        if (item.id === 'treponema_pallidum') {
            const caption = document.createElement('p');
            caption.textContent = 'Imagem ilustrativa de um teste VDRL (Venereal Disease Research Laboratory), usado no diagnóstico sorológico da sífilis.';
            caption.style.fontSize = '0.85rem';
            caption.style.color = 'var(--muted)';
            header.appendChild(caption);
        }
    }
    detailContent.appendChild(header);

    // --- Seção de Tags com características principais ---
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'detail-tags';
    const mainTags = [item.classification, item.gram, item.morfologia].filter(Boolean);
    mainTags.forEach(tagText => {
        const tag = document.createElement('span');
        tag.className = 'detail-tag';
        tag.textContent = tagText;
        tagsContainer.appendChild(tag);
    });
    detailContent.appendChild(tagsContainer);

    // --- Função auxiliar para criar seções ---
    function createSection(title, contentElement) {
        const section = document.createElement('section');
        section.className = 'detail-section';
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = title;
        section.appendChild(sectionTitle);
        section.appendChild(contentElement);
        detailContent.appendChild(section);
    }

    // --- Seção: Descrição ---
    if (item.description) {
        const p = document.createElement('p');
        p.textContent = item.description;
        createSection('Descrição', p);
    }

    // --- Seção: Cultivo ---
    if (item.cultivo) {
        const p = document.createElement('p');
        p.textContent = item.cultivo;
        createSection('Cultivo', p);
    }

    // --- Seção: Resistência ---
    if (item.resistencia && item.resistencia.length > 0) {
        const ul = document.createElement('ul');
        item.resistencia.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            ul.appendChild(li);
        });
        createSection('Mecanismos de Resistência', ul);
    }

    // --- Seção: Antibiograma (para micróbios) ou Breakpoints (para antibióticos) ---
    if (item.type === 'microbe' && item.antibioticos && item.antibioticos.length > 0) {
        const tableContainer = renderBreakpointTable(item.antibioticos, 'Antibiótico'); // Para micróbios, a coluna é 'Antibiótico'
        createSection('Antibiograma', tableContainer);
    } else if (item.type === 'antibiotic' && item.antibioticos && item.antibioticos.length > 0) {
        const tableContainer = renderBreakpointTable(item.antibioticos, 'Grupo Microbiano'); // Para antibióticos, a coluna é 'Grupo Microbiano'
        createSection('Indicadores de interpretação clínica', tableContainer);
    }

    // --- Função auxiliar para breakpoints ---
    function getBreakpoint(a) {
        const bp = a.breakpoint || a.breakpoints || a.bp || {};
        return { S: bp.S ?? '-', I: bp.I ?? '-', R: bp.R ?? '-' };
    }

    // --- Função auxiliar para renderizar tabela de breakpoints ---
    function renderBreakpointTable(arr, headerName = 'Antibiótico') {
        try {
            const style = getComputedStyle(document.documentElement);
            const sColor = style.getPropertyValue('--success') || '#10B981';
            const iColor = style.getPropertyValue('--warning') || '#F59E0B';
            const rColor = style.getPropertyValue('--danger') || '#EF4444';

            const legend = document.createElement('div');
            legend.className = 'si-legend';
            legend.style.display = 'none'; // Escondido por padrão, será movido para o final
            legend.style.gap = '0.75rem';
            legend.style.marginTop = '0.6rem';
            legend.style.alignItems = 'center';

            const make = (label, color, text) => {
                const span = document.createElement('span');
                span.textContent = `${label} — ${text}`;
                span.style.color = color.trim();
                span.style.fontWeight = 600;
                span.style.fontSize = '0.95rem';
                return span;
            };
            
            // A legenda será adicionada no final do container da tabela
            // legend.appendChild(make('S', sColor, 'Sensível'));
            // legend.appendChild(make('I', iColor, 'Intermediário'));
            // legend.appendChild(make('R', rColor, 'Resistente'));
        } catch (e) { /* ignora */ }

        const tbl = document.createElement('table');
        tbl.className = 'detail-table';
        tbl.innerHTML = `<thead><tr><th>${headerName}</th><th>S</th><th>I</th><th>R</th></tr></thead>`;
        const tbody = document.createElement('tbody');

        arr.forEach(a => {
            const tr = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.textContent = a.nome || a.name || a;
            tr.appendChild(tdName);

            const bp = getBreakpoint(a);
            ['S','I','R'].forEach(key => {
                const td = document.createElement('td');
                td.textContent = bp[key];
                td.className = key.toLowerCase();
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        tbl.appendChild(tbody);
        
        const container = document.createElement('div');
        container.appendChild(tbl);
        // container.appendChild(legend); // A legenda foi removida para evitar duplicação
        return container;
    }
}

// --- Função para exibir imagem em um modal de zoom interativo ---
function showImageZoom(src, alt) {
    // Previne a criação de múltiplos modais
    if (document.querySelector('.zoom-modal-overlay')) return;

    // Cria o contêiner do modal (o fundo escuro)
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'zoom-modal-overlay';
    Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: '1001', cursor: 'zoom-out'
    });

    // Cria o elemento da imagem ampliada
    const zoomedImage = document.createElement('img');
    zoomedImage.src = src;
    zoomedImage.alt = alt;
    zoomedImage.draggable = false; // Previne o comportamento padrão de arrastar imagem
    Object.assign(zoomedImage.style, {
        maxWidth: '90%', maxHeight: '300px', // Inicia com a mesma altura máxima do painel
        objectFit: 'contain',
        transition: 'transform 0.2s ease-out',
        transformOrigin: 'center', // Ponto de origem do zoom para o centro
        cursor: 'zoom-in' // O cursor não mudará mais para "grab"
    });

    // --- Lógica de Zoom e Pan ---
    let scale = 1;
    let panning = false;
    let pointX = 0, pointY = 0;
    let start = { x: 0, y: 0 };

    function setTransform(resetPan = false) {
        if (resetPan) { pointX = 0; pointY = 0; }
        zoomedImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    zoomedImage.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const newScale = scale * (delta > 0 ? 1.2 : 1 / 1.2);
        
        // Limita o zoom entre 1x (tamanho inicial ajustado) e 10x
        scale = Math.max(1, Math.min(newScale, 10));

        // Se o zoom voltar ao normal (1x), reseta a posição de pan.
        // O parâmetro 'true' força o reset de pointX e pointY.
        setTransform(scale === 1);
    });

    function closeModal() {
        // Limpa os event listeners globais para evitar memory leaks
        const onMouseUp = () => {};
        const onMouseMove = () => {};
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        if (modalOverlay.parentElement) document.body.removeChild(modalOverlay);
    }

    // Adiciona o evento para fechar o modal ao clicar no fundo
    modalOverlay.addEventListener('click', (e) => { 
        if (e.target === modalOverlay) closeModal(); 
    });

    modalOverlay.appendChild(zoomedImage);
    document.body.appendChild(modalOverlay);
}


  function closeDetail() {
    detailPanel.setAttribute('aria-hidden', 'true');
    detailPanel.removeAttribute('data-current-item-id'); // Limpa o ID ao fechar
  }

  detailClose.addEventListener('click', closeDetail);

  // help modal handlers (robusto): tenta usar os elementos diretos, e adiciona delegação como fallback
  function openHelp(){ if(helpModal) helpModal.setAttribute('aria-hidden','false'); }
  function closeHelp(){ if(helpModal) helpModal.setAttribute('aria-hidden','true'); }

  if(helpBtn && helpModal && helpClose){
    helpBtn.addEventListener('click', openHelp);
    helpClose.addEventListener('click', closeHelp);
    helpModal.addEventListener('click', (e)=>{ if(e.target === helpModal) closeHelp(); });
  } else {
    // fallback: delegation in case IDs/classes were changed or elements loaded later
    document.addEventListener('click', function onDocClick(e){
      const t = e.target;
      if(!t) return;
      if(t.id === 'help-btn' || t.closest && t.closest && t.closest('#help-btn')){ openHelp(); }
      if(t.id === 'help-close' || t.closest && t.closest && t.closest('#help-close')){ closeHelp(); }
      if(t.id === 'help-modal' && e.target === t){ closeHelp(); }
    });
    // also close on Escape
    document.addEventListener('keydown', function onKey(e){ if(e.key === 'Escape') closeHelp(); });
  }

  // about modal handlers
  function openAbout(){ if(aboutModal) aboutModal.setAttribute('aria-hidden','false'); }
  function closeAbout(){ if(aboutModal) aboutModal.setAttribute('aria-hidden','true'); }

  if(aboutBtn && aboutModal && aboutClose){
    aboutBtn.addEventListener('click', openAbout);
    aboutClose.addEventListener('click', closeAbout);
    aboutModal.addEventListener('click', (e)=>{ if(e.target === aboutModal) closeAbout(); });
    document.addEventListener('keydown', function onKey(e){ if(e.key === 'Escape') closeAbout(); });
  }

  // --- NOVA FUNÇÃO DE EXPORTAR IMAGEM ---
  async function exportFavoritesToImage() {
    if (typeof html2canvas === 'undefined') {
      alert('Erro: A biblioteca html2canvas não foi carregada. Verifique se o script foi incluído no HTML.');
      console.error('html2canvas is not defined');
      return;
    }

    // 1. Criar um contêiner temporário para a imagem
    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-container';
    // Estilos para garantir que o conteúdo seja visível para o html2canvas, mas não para o usuário
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    Object.assign(exportContainer.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      padding: '40px', // Aumenta o preenchimento para criar a borda
      background: isDarkMode ? 'linear-gradient(145deg, #071025, #0a1a3a)' : 'linear-gradient(145deg, #f4f7fb, #e8eef7)',
      width: '1200px' // Largura fixa para a imagem final
    });

    // 2. Adicionar um título à imagem exportada
    const title = document.createElement('h2');
    title.textContent = 'MicroBioBase - Itens Favoritos';
    Object.assign(title.style, {
      color: isDarkMode ? '#e6eef8' : '#072033',
      textAlign: 'center',
      marginBottom: '2rem',
      fontSize: '28px',
      fontWeight: '700'
    });
    exportContainer.appendChild(title);

    // 3. Criar um contêiner interno para os cards com borda
    const cardsWrapper = document.createElement('div');
    Object.assign(cardsWrapper.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1rem',
      padding: '2rem',
      borderRadius: '16px',
      background: isDarkMode ? 'rgba(7, 32, 51, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`
    });

    // 2. Adicionar apenas os cards favoritados
    const favoritedItems = data.items.filter(it => favorites.has(it.id));
    if (favoritedItems.length === 0) {
      alert('Nenhum item favoritado para exportar.');
      return;
    }

    favoritedItems.forEach(it => {
      const card = document.getElementById(it.id);
      if (card) {
        cardsWrapper.appendChild(card.cloneNode(true));
      }
    });

    exportContainer.appendChild(cardsWrapper);
    document.body.appendChild(exportContainer);

    // 3. Usar html2canvas para gerar a imagem e iniciar o download
    // Usando a cor de fundo correta para o canvas
    const canvas = await html2canvas(exportContainer, { scale: 2, backgroundColor: isDarkMode ? '#071025' : '#f4f7fb' });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = 'microbiobase-favoritos.jpg';
    link.click();

    // 5. Limpar o contêiner temporário
    document.body.removeChild(exportContainer);
  }

  // nav events
  navBtns.forEach(btn=> btn.addEventListener('click', ()=>{
    navBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.cat;
    renderCards();
  }));

  // search
  if(searchEl) searchEl.addEventListener('input', ()=> renderCards());

  // Adiciona o evento de clique ao botão de exportar
  if(exportImageBtn) exportImageBtn.addEventListener('click', exportFavoritesToImage);

  // initial load
  load();
})();
